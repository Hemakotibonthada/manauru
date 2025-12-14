/**
 * Theme Configuration
 * Design system tokens and theme configuration with light/dark mode support
 */

// Light theme colors
export const lightColors = {
  // Primary colors
  primary: {
    main: '#FF6B35',
    light: '#FF8C61',
    dark: '#E55A2B',
    contrast: '#FFFFFF',
  },
  
  // Secondary colors
  secondary: {
    main: '#004E89',
    light: '#1A6BA8',
    dark: '#003A6A',
    contrast: '#FFFFFF',
  },
  
  // Success, error, warning, info
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
  },
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
  },
  
  // Neutral colors
  background: {
    default: '#FFFFFF',
    paper: '#F5F5F5',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },
  divider: '#E0E0E0',
  border: '#CCCCCC',
  
  // Social media colors
  like: '#E91E63',
  share: '#2196F3',
  comment: '#607D8B',
};

// Dark theme colors
export const darkColors = {
  // Primary colors
  primary: {
    main: '#FF6B35',
    light: '#FF8C61',
    dark: '#E55A2B',
    contrast: '#000000',
  },
  
  // Secondary colors
  secondary: {
    main: '#4A90E2',
    light: '#6BA3E8',
    dark: '#3A7BC8',
    contrast: '#000000',
  },
  
  // Success, error, warning, info
  success: {
    main: '#66BB6A',
    light: '#81C784',
    dark: '#4CAF50',
  },
  error: {
    main: '#EF5350',
    light: '#E57373',
    dark: '#F44336',
  },
  warning: {
    main: '#FFA726',
    light: '#FFB74D',
    dark: '#FF9800',
  },
  info: {
    main: '#42A5F5',
    light: '#64B5F6',
    dark: '#2196F3',
  },
  
  // Neutral colors
  background: {
    default: '#121212',
    paper: '#1E1E1E',
    card: '#2C2C2C',
    elevated: '#383838',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    disabled: '#707070',
    inverse: '#000000',
  },
  divider: '#3A3A3A',
  border: '#4A4A4A',
  
  // Social media colors
  like: '#E91E63',
  share: '#2196F3',
  comment: '#90A4AE',
};

// Legacy export for backward compatibility
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.25,
  },
};

export const shadows = {
  sm: {
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  md: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  lg: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

export type Theme = typeof theme;

// Helper function to get themed colors
export function getThemedColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}
