/**
 * Global Theme Configuration
 * Defines colors, typography, spacing, and other design tokens
 */

export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#EBF8FF',
      100: '#BFDBFE',
      500: '#0066CC',
      600: '#0052A3',
      700: '#003D7A',
    },
    
    // Secondary colors
    secondary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
    },
    
    // Semantic colors
    success: {
      50: '#F0FDF4',
      100: '#BBF7D0',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
    },
    
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
    },
    
    error: {
      50: '#FEF2F2',
      100: '#FECACA',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
    },
    
    // Neutral colors
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    
    // Text colors
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      tertiary: '#94A3B8',
      inverse: '#FFFFFF',
    },
    
    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
    },
    
    // Border colors
    border: {
      light: '#E2E8F0',
      medium: '#CBD5E1',
      dark: '#94A3B8',
    },
  },
  
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  // Component-specific tokens
  components: {
    button: {
      height: {
        sm: 32,
        md: 40,
        lg: 48,
      },
      paddingHorizontal: {
        sm: 12,
        md: 16,
        lg: 20,
      },
    },
    
    input: {
      height: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    
    card: {
      padding: 16,
      borderRadius: 12,
    },
  },
};

export type Theme = typeof theme;
export default theme;