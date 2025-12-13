/**
 * Login Screen
 * User authentication screen
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
  Image,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../styles/theme';

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const LoginScreen = ({ navigation }: any) => {
  const { signIn, loading, error, clearError } = useAuthStore();
  const [showError, setShowError] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      clearError();
      await signIn(values.email, values.password);
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🏘️</Text>
          </View>
          <Text style={styles.title}>Mana Uru</Text>
          <Text style={styles.subtitle}>మన ఊరు - Our Village</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.description}>Sign in to continue to your village</Text>

          {showError && error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View>
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
                  label="Password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={touched.password && errors.password ? errors.password : ''}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                />

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <Button
                  title="Sign In"
                  onPress={handleSubmit}
                  loading={loading}
                  fullWidth
                  style={styles.button}
                />
              </View>
            )}
          </Formik>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.primary.main,
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
  },
  button: {
    marginTop: spacing.md,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  signupText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
  },
  signupLink: {
    fontSize: typography.body2.fontSize,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
