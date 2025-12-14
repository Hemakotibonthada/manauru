/**
 * Authentication Service
 * Handles all authentication operations with Firebase
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';
import { uploadImage } from './storageService';

export class AuthService {
  /**
   * Register a new user
   */
  static async registerUser(
    email: string,
    password: string,
    displayName: string,
    phoneNumber?: string
  ): Promise<User> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, { displayName });

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email,
        displayName,
        phoneNumber,
        role: UserRole.USER,
        verified: false,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        language: 'en',
        followers: [],
        following: [],
        qualifications: [],
        skills: [],
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      console.log('✅ User registered successfully');
      return { ...userData, id: firebaseUser.uid } as User;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign in user
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = await this.getUserData(userCredential.user.uid);

      if (!user) {
        throw new Error('User data not found');
      }

      console.log('✅ User signed in successfully');
      return user;
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Get current user data from Firestore
   */
  static async getUserData(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Update Firebase Auth profile if display name or photo changed
      if (auth.currentUser) {
        const profileUpdates: any = {};
        if (updates.displayName) profileUpdates.displayName = updates.displayName;
        if (updates.photoURL) profileUpdates.photoURL = updates.photoURL;

        if (Object.keys(profileUpdates).length > 0) {
          await updateProfile(auth.currentUser, profileUpdates);
        }
      }

      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Upload and update user profile photo
   */
  static async updateProfilePhoto(userId: string, imageUri: string): Promise<string> {
    try {
      const photoURL = await uploadImage(imageUri, `users/${userId}/profile`);
      await this.updateUserProfile(userId, { photoURL });
      return photoURL;
    } catch (error) {
      console.error('❌ Error updating profile photo:', error);
      throw new Error('Failed to update profile photo');
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update user email
   */
  static async updateUserEmail(newEmail: string, password: string): Promise<void> {
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('No user logged in');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update email
      await updateEmail(auth.currentUser, newEmail);

      // Update Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        email: newEmail,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Email updated successfully');
    } catch (error: any) {
      console.error('❌ Email update error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update user password
   */
  static async updateUserPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('No user logged in');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      console.log('✅ Password updated successfully');
    } catch (error: any) {
      console.error('❌ Password update error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Follow a user
   */
  static async followUser(userId: string, targetUserId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const targetRef = doc(db, 'users', targetUserId);

      const userData = await getDoc(userRef);
      const targetData = await getDoc(targetRef);

      if (!userData.exists() || !targetData.exists()) {
        throw new Error('User not found');
      }

      const following = userData.data()?.following || [];
      const followers = targetData.data()?.followers || [];

      await updateDoc(userRef, {
        following: [...following, targetUserId],
        updatedAt: serverTimestamp(),
      });

      await updateDoc(targetRef, {
        followers: [...followers, userId],
        updatedAt: serverTimestamp(),
      });

      console.log('✅ User followed successfully');
    } catch (error) {
      console.error('❌ Error following user:', error);
      throw new Error('Failed to follow user');
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const targetRef = doc(db, 'users', targetUserId);

      const userData = await getDoc(userRef);
      const targetData = await getDoc(targetRef);

      if (!userData.exists() || !targetData.exists()) {
        throw new Error('User not found');
      }

      const following = userData.data()?.following || [];
      const followers = targetData.data()?.followers || [];

      await updateDoc(userRef, {
        following: following.filter((id: string) => id !== targetUserId),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(targetRef, {
        followers: followers.filter((id: string) => id !== userId),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ User unfollowed successfully');
    } catch (error) {
      console.error('❌ Error unfollowing user:', error);
      throw new Error('Failed to unfollow user');
    }
  }

  /**
   * Get current Firebase user
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get user-friendly error messages
   */
  private static getAuthErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/requires-recent-login': 'Please log in again to continue',
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again';
  }
}

export default AuthService;
