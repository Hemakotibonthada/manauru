/**
 * Post Service
 * Handles all post-related operations
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post, Comment, Reply, PostType, PostVisibility, Media } from '../types';
import { uploadImage, uploadVideo, uploadMultipleImages } from './storageService';

export class PostService {
  /**
   * Create a new post
   */
  static async createPost(
    userId: string,
    userName: string,
    content: string,
    type: PostType = PostType.TEXT,
    mediaUris?: string[],
    villageId?: string,
    villageName?: string,
    visibility: PostVisibility = PostVisibility.PUBLIC,
    tags: string[] = []
  ): Promise<string> {
    try {
      const postRef = doc(collection(db, 'posts'));
      let media: Media[] = [];

      // Upload media if provided
      if (mediaUris && mediaUris.length > 0) {
        const uploadedUrls = await uploadMultipleImages(
          mediaUris,
          `posts/${postRef.id}`
        );
        media = uploadedUrls.map((url) => ({
          type: type === PostType.VIDEO ? 'video' : 'image',
          url,
        }));
      }

      const postData: any = {
        userId,
        userName,
        type,
        content,
        media,
        likes: [],
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        visibility,
        tags,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Only add optional fields if they have values
      if (villageId) postData.villageId = villageId;
      if (villageName) postData.villageName = villageName;

      await setDoc(postRef, postData);
      console.log('✅ Post created successfully');
      return postRef.id;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw new Error('Failed to create post');
    }
  }

  /**
   * Get post by ID
   */
  static async getPost(postId: string): Promise<Post | null> {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        return { id: postDoc.id, ...postDoc.data() } as Post;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching post:', error);
      return null;
    }
  }

  /**
   * Get posts with pagination
   */
  static async getPosts(
    pageSize: number = 20,
    lastDocument?: any,
    villageId?: string
  ): Promise<{ posts: Post[]; lastDoc: any }> {
    try {
      let q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (villageId) {
        q = query(q, where('villageId', '==', villageId));
      }

      if (lastDocument) {
        q = query(q, startAfter(lastDocument));
      }

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Post)
      );
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return { posts, lastDoc };
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }
  }

  /**
   * Get popular posts (sorted by engagement)
   */
  static async getPopularPosts(
    pageSize: number = 20,
    timeRange: 'day' | 'week' | 'month' | 'all' = 'week'
  ): Promise<Post[]> {
    try {
      let startDate = new Date();
      
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'all':
          startDate = new Date(0);
          break;
      }

      const q = query(
        collection(db, 'posts'),
        where('createdAt', '>', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Post)
      );

      // Sort by engagement score (likes + comments * 2 + shares * 3)
      const sortedPosts = posts.sort((a, b) => {
        const scoreA = (a.likeCount || 0) + (a.commentCount || 0) * 2 + (a.shareCount || 0) * 3;
        const scoreB = (b.likeCount || 0) + (b.commentCount || 0) * 2 + (b.shareCount || 0) * 3;
        return scoreB - scoreA;
      });

      // Return top pageSize posts
      return sortedPosts.slice(0, pageSize);
    } catch (error) {
      console.error('❌ Error fetching popular posts:', error);
      throw new Error('Failed to fetch popular posts');
    }
  }

  /**
   * Get user posts
   */
  static async getUserPosts(
    userId: string,
    pageSize: number = 20
  ): Promise<Post[]> {
    try {
      const q = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
    } catch (error) {
      console.error('❌ Error fetching user posts:', error);
      throw new Error('Failed to fetch user posts');
    }
  }

  /**
   * Update post
   */
  static async updatePost(
    postId: string,
    updates: Partial<Post>
  ): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Post updated successfully');
    } catch (error) {
      console.error('❌ Error updating post:', error);
      throw new Error('Failed to update post');
    }
  }

  /**
   * Delete post
   */
  static async deletePost(postId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      console.log('✅ Post deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      throw new Error('Failed to delete post');
    }
  }

  /**
   * Like a post
   */
  static async likePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: arrayUnion(userId),
        likeCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Post liked successfully');
    } catch (error) {
      console.error('❌ Error liking post:', error);
      throw new Error('Failed to like post');
    }
  }

  /**
   * Unlike a post
   */
  static async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: arrayRemove(userId),
        likeCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Post unliked successfully');
    } catch (error) {
      console.error('❌ Error unliking post:', error);
      throw new Error('Failed to unlike post');
    }
  }

  /**
   * Share a post
   */
  static async sharePost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        shareCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Post shared successfully');
    } catch (error) {
      console.error('❌ Error sharing post:', error);
      throw new Error('Failed to share post');
    }
  }

  /**
   * Add comment to post
   */
  static async addComment(
    postId: string,
    userId: string,
    userName: string,
    content: string,
    userAvatar?: string
  ): Promise<string> {
    try {
      const commentRef = doc(collection(db, 'posts', postId, 'comments'));
      const commentData: any = {
        postId,
        userId,
        userName,
        content,
        likes: [],
        likeCount: 0,
        replies: [],
        replyCount: 0,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Only add userAvatar if it's defined
      if (userAvatar) {
        commentData.userAvatar = userAvatar;
      }

      await setDoc(commentRef, commentData);

      // Update post comment count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Comment added successfully');
      return commentRef.id;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get post comments
   */
  static async getComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, 'posts', postId, 'comments'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Comment)
      );
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  /**
   * Delete comment
   */
  static async deleteComment(postId: string, commentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));

      // Update post comment count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Comment deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Like a comment
   */
  static async likeComment(
    postId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await updateDoc(commentRef, {
        likes: arrayUnion(userId),
        likeCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Comment liked successfully');
    } catch (error) {
      console.error('❌ Error liking comment:', error);
      throw new Error('Failed to like comment');
    }
  }

  /**
   * Unlike a comment
   */
  static async unlikeComment(
    postId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await updateDoc(commentRef, {
        likes: arrayRemove(userId),
        likeCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Comment unliked successfully');
    } catch (error) {
      console.error('❌ Error unliking comment:', error);
      throw new Error('Failed to unlike comment');
    }
  }

  /**
   * Search posts by tags or content
   */
  static async searchPosts(searchTerm: string): Promise<Post[]> {
    try {
      // Note: This is a simple implementation. For production, use Algolia or similar
      const q = query(
        collection(db, 'posts'),
        where('tags', 'array-contains', searchTerm.toLowerCase()),
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
    } catch (error) {
      console.error('❌ Error searching posts:', error);
      throw new Error('Failed to search posts');
    }
  }
}

export default PostService;
