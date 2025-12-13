/**
 * Signup Screen
 * User registration screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../styles/theme';

const signupSchema = Yup.object().shape({
  displayName: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export const SignupScreen = ({ navigation }: any) => {
  const { signUp, loading, error, clearError } = useAuthStore();
  const [showError, setShowError] = useState(false);

  const handleSignup = async (values: {
    displayName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }) => {
    try {
      clearError();
      await signUp(values.email, values.password, values.displayName, values.phoneNumber);
      // Navigation will be handled by auth state listener
    } catch (err) {
      setShowError(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.description}>
            Join your village community today
          </Text>

          {showError && error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Formik
            initialValues={{
              displayName: '',
              email: '',
              phoneNumber: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={signupSchema}
            onSubmit={handleSignup}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View>
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={values.displayName}
                  onChangeText={handleChange('displayName')}
                  onBlur={handleBlur('displayName')}
                  error={
                    touched.displayName && errors.displayName
                      ? errors.displayName
                      : ''
                  }
                  leftIcon="person-outline"
                />

                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && errors.email ? errors.email : ''}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                />

                <Input
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  value={values.phoneNumber}
                  onChangeText={handleChange('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  error={
                    touched.phoneNumber && errors.phoneNumber
                      ? errors.phoneNumber
                      : ''
                  }
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                />

                <Input
                  label="Password"
                  placeholder="Create a password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={touched.password && errors.password ? errors.password : ''}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                />

                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  error={
                    touched.confirmPassword && errors.confirmPassword
                      ? errors.confirmPassword
                      : ''
                  }
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                />

                <Button
                  title="Sign Up"
                  onPress={handleSubmit}
                  loading={loading}
                  fullWidth
                  style={styles.button}
                />
              </View>
            )}
          </Formik>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  formContainer: {
    width: '100%',
  },
  heading: {
    fontSize: typography.h3.fontSize,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  errorContainer: {
    backgroundColor: colors.error.light,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error.dark,
    fontSize: typography.body2.fontSize,
  },
  button: {
    marginTop: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
  },
  loginLink: {
    fontSize: typography.body2.fontSize,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
