/**
 * LotWorks Material Design 3 Theme Configuration
 * 
 * This file defines design tokens following Material Design 3 specifications
 * while maintaining the LotWorks brand identity (primary: #4B5FD7)
 */

// =============================================================================
// TYPOGRAPHY SCALE (Material Design 3)
// =============================================================================
// Roles: display, headline, title, body, label
// Sizes: large, medium, small

export const typography = {
  // Display - Reserved for hero content, large numbers
  displayLarge: { size: '57px', lineHeight: '64px', weight: 400, tracking: '-0.25px' },
  displayMedium: { size: '45px', lineHeight: '52px', weight: 400, tracking: '0' },
  displaySmall: { size: '36px', lineHeight: '44px', weight: 400, tracking: '0' },
  
  // Headline - Section headers, card titles
  headlineLarge: { size: '32px', lineHeight: '40px', weight: 400, tracking: '0' },
  headlineMedium: { size: '28px', lineHeight: '36px', weight: 400, tracking: '0' },
  headlineSmall: { size: '24px', lineHeight: '32px', weight: 400, tracking: '0' },
  
  // Title - Subheadings, component headers
  titleLarge: { size: '22px', lineHeight: '28px', weight: 500, tracking: '0' },
  titleMedium: { size: '16px', lineHeight: '24px', weight: 500, tracking: '0.15px' },
  titleSmall: { size: '14px', lineHeight: '20px', weight: 500, tracking: '0.1px' },
  
  // Body - Main content text
  bodyLarge: { size: '16px', lineHeight: '24px', weight: 400, tracking: '0.5px' },
  bodyMedium: { size: '14px', lineHeight: '20px', weight: 400, tracking: '0.25px' },
  bodySmall: { size: '12px', lineHeight: '16px', weight: 400, tracking: '0.4px' },
  
  // Label - Buttons, chips, captions
  labelLarge: { size: '14px', lineHeight: '20px', weight: 500, tracking: '0.1px' },
  labelMedium: { size: '12px', lineHeight: '16px', weight: 500, tracking: '0.5px' },
  labelSmall: { size: '11px', lineHeight: '16px', weight: 500, tracking: '0.5px' },
} as const;

// =============================================================================
// SHAPE SCALE (Material Design 3)
// =============================================================================
// Corner radius scale for consistent component shapes

export const shape = {
  none: '0px',
  extraSmall: '4px',
  small: '8px',
  medium: '12px',
  large: '16px',
  extraLarge: '28px',
  full: '9999px', // Pill shape
} as const;

// =============================================================================
// COLOR SYSTEM (Material Design 3)
// =============================================================================
// Based on LotWorks brand primary: #4B5FD7

export const colors = {
  // Brand Colors
  brand: {
    primary: '#4B5FD7',
    primaryDark: '#192A54',
  },
  
  // Light Theme - Primary tonal palette
  light: {
    // Primary colors
    primary: '#4B5FD7',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E0E1FF',
    onPrimaryContainer: '#00006E',
    
    // Secondary colors (muted indigo)
    secondary: '#5C5D72',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E1E0F9',
    onSecondaryContainer: '#191A2C',
    
    // Tertiary colors (warm accent)
    tertiary: '#78536B',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8EE',
    onTertiaryContainer: '#2E1126',
    
    // Error colors
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    
    // Surface colors with tonal elevation
    surface: '#FBF8FF',
    surfaceDim: '#DBD8E0',
    surfaceBright: '#FBF8FF',
    onSurface: '#1B1B21',
    onSurfaceVariant: '#46464F',
    
    // Surface container hierarchy (for elevation)
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F5F2FA',
    surfaceContainer: '#EFEDF5',
    surfaceContainerHigh: '#E9E7EF',
    surfaceContainerHighest: '#E4E1E9',
    
    // Outline colors
    outline: '#777680',
    outlineVariant: '#C7C5D0',
    
    // Inverse colors
    inverseSurface: '#303036',
    inverseOnSurface: '#F3EFF7',
    inversePrimary: '#BEC2FF',
    
    // Background
    background: '#FBF8FF',
    onBackground: '#1B1B21',
    
    // Scrim for modals
    scrim: '#000000',
  },
  
  // Semantic colors for data visualization & insights
  semantic: {
    success: '#10B981',
    successContainer: '#D1FAE5',
    onSuccess: '#FFFFFF',
    
    warning: '#F59E0B',
    warningContainer: '#FEF3C7',
    onWarning: '#FFFFFF',
    
    info: '#3B82F6',
    infoContainer: '#DBEAFE',
    onInfo: '#FFFFFF',
    
    hot: '#F97316',
    hotContainer: '#FFEDD5',
    onHot: '#FFFFFF',
  },
  
  // Chart/data visualization colors
  chart: [
    '#4B5FD7', // Primary (brand)
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ],
  
  // Device breakdown colors
  device: {
    mobile: '#3B82F6',
    desktop: '#EF4444',
    tablet: '#F59E0B',
    smartTv: '#8B5CF6',
  },
  
  // OS colors
  os: {
    windows: '#6366F1',
    macOS: '#8B5CF6',
    iOS: '#F59E0B',
    android: '#10B981',
    linux: '#EF4444',
    chromeOS: '#06B6D4',
  },
} as const;

// =============================================================================
// ELEVATION (Material Design 3)
// =============================================================================
// Tonal elevation + shadow for depth

export const elevation = {
  level0: {
    shadow: 'none',
    overlay: 0,
  },
  level1: {
    shadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    overlay: 0.05,
  },
  level2: {
    shadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    overlay: 0.08,
  },
  level3: {
    shadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overlay: 0.11,
  },
  level4: {
    shadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    overlay: 0.12,
  },
  level5: {
    shadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overlay: 0.14,
  },
} as const;

// =============================================================================
// SPACING (8px grid system)
// =============================================================================

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// =============================================================================
// MOTION (Material Design 3)
// =============================================================================

export const motion = {
  duration: {
    short1: '50ms',
    short2: '100ms',
    short3: '150ms',
    short4: '200ms',
    medium1: '250ms',
    medium2: '300ms',
    medium3: '350ms',
    medium4: '400ms',
    long1: '450ms',
    long2: '500ms',
    long3: '550ms',
    long4: '600ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
    standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  },
} as const;

// =============================================================================
// STATE LAYERS (Material Design 3)
// =============================================================================
// Opacity values for interaction states

export const stateLayer = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// CSS CUSTOM PROPERTIES EXPORT
// =============================================================================

export function getCSSVariables(): string {
  return `
  :root {
    /* Typography */
    --md-sys-typescale-display-large-size: ${typography.displayLarge.size};
    --md-sys-typescale-display-large-line-height: ${typography.displayLarge.lineHeight};
    --md-sys-typescale-display-large-weight: ${typography.displayLarge.weight};
    
    --md-sys-typescale-headline-large-size: ${typography.headlineLarge.size};
    --md-sys-typescale-headline-medium-size: ${typography.headlineMedium.size};
    --md-sys-typescale-headline-small-size: ${typography.headlineSmall.size};
    
    --md-sys-typescale-title-large-size: ${typography.titleLarge.size};
    --md-sys-typescale-title-medium-size: ${typography.titleMedium.size};
    --md-sys-typescale-title-small-size: ${typography.titleSmall.size};
    
    --md-sys-typescale-body-large-size: ${typography.bodyLarge.size};
    --md-sys-typescale-body-medium-size: ${typography.bodyMedium.size};
    --md-sys-typescale-body-small-size: ${typography.bodySmall.size};
    
    --md-sys-typescale-label-large-size: ${typography.labelLarge.size};
    --md-sys-typescale-label-medium-size: ${typography.labelMedium.size};
    --md-sys-typescale-label-small-size: ${typography.labelSmall.size};
    
    /* Shape */
    --md-sys-shape-corner-none: ${shape.none};
    --md-sys-shape-corner-extra-small: ${shape.extraSmall};
    --md-sys-shape-corner-small: ${shape.small};
    --md-sys-shape-corner-medium: ${shape.medium};
    --md-sys-shape-corner-large: ${shape.large};
    --md-sys-shape-corner-extra-large: ${shape.extraLarge};
    --md-sys-shape-corner-full: ${shape.full};
    
    /* Colors - Light Theme */
    --md-sys-color-primary: ${colors.light.primary};
    --md-sys-color-on-primary: ${colors.light.onPrimary};
    --md-sys-color-primary-container: ${colors.light.primaryContainer};
    --md-sys-color-on-primary-container: ${colors.light.onPrimaryContainer};
    
    --md-sys-color-secondary: ${colors.light.secondary};
    --md-sys-color-on-secondary: ${colors.light.onSecondary};
    --md-sys-color-secondary-container: ${colors.light.secondaryContainer};
    --md-sys-color-on-secondary-container: ${colors.light.onSecondaryContainer};
    
    --md-sys-color-tertiary: ${colors.light.tertiary};
    --md-sys-color-on-tertiary: ${colors.light.onTertiary};
    --md-sys-color-tertiary-container: ${colors.light.tertiaryContainer};
    --md-sys-color-on-tertiary-container: ${colors.light.onTertiaryContainer};
    
    --md-sys-color-error: ${colors.light.error};
    --md-sys-color-on-error: ${colors.light.onError};
    --md-sys-color-error-container: ${colors.light.errorContainer};
    --md-sys-color-on-error-container: ${colors.light.onErrorContainer};
    
    --md-sys-color-surface: ${colors.light.surface};
    --md-sys-color-surface-dim: ${colors.light.surfaceDim};
    --md-sys-color-surface-bright: ${colors.light.surfaceBright};
    --md-sys-color-on-surface: ${colors.light.onSurface};
    --md-sys-color-on-surface-variant: ${colors.light.onSurfaceVariant};
    
    --md-sys-color-surface-container-lowest: ${colors.light.surfaceContainerLowest};
    --md-sys-color-surface-container-low: ${colors.light.surfaceContainerLow};
    --md-sys-color-surface-container: ${colors.light.surfaceContainer};
    --md-sys-color-surface-container-high: ${colors.light.surfaceContainerHigh};
    --md-sys-color-surface-container-highest: ${colors.light.surfaceContainerHighest};
    
    --md-sys-color-outline: ${colors.light.outline};
    --md-sys-color-outline-variant: ${colors.light.outlineVariant};
    
    --md-sys-color-inverse-surface: ${colors.light.inverseSurface};
    --md-sys-color-inverse-on-surface: ${colors.light.inverseOnSurface};
    --md-sys-color-inverse-primary: ${colors.light.inversePrimary};
    
    --md-sys-color-background: ${colors.light.background};
    --md-sys-color-on-background: ${colors.light.onBackground};
    
    --md-sys-color-scrim: ${colors.light.scrim};
    
    /* Semantic Colors */
    --md-sys-color-success: ${colors.semantic.success};
    --md-sys-color-success-container: ${colors.semantic.successContainer};
    --md-sys-color-warning: ${colors.semantic.warning};
    --md-sys-color-warning-container: ${colors.semantic.warningContainer};
    --md-sys-color-info: ${colors.semantic.info};
    --md-sys-color-info-container: ${colors.semantic.infoContainer};
    
    /* Motion */
    --md-sys-motion-duration-short1: ${motion.duration.short1};
    --md-sys-motion-duration-short2: ${motion.duration.short2};
    --md-sys-motion-duration-medium1: ${motion.duration.medium1};
    --md-sys-motion-duration-medium2: ${motion.duration.medium2};
    --md-sys-motion-easing-standard: ${motion.easing.standard};
    --md-sys-motion-easing-emphasized: ${motion.easing.emphasized};
  }
  `;
}

// =============================================================================
// MD3 COMPACT EXPORT (for component usage)
// =============================================================================
// Flattened structure for easy access in React components

export const MD3 = {
  colors: {
    primary: colors.light.primary,
    onPrimary: colors.light.onPrimary,
    primaryContainer: colors.light.primaryContainer,
    onSurfaceVariant: colors.light.onSurfaceVariant,
    outline: colors.light.outline,
    outlineVariant: colors.light.outlineVariant,
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    info: colors.semantic.info,
    hot: colors.semantic.hot,
    error: colors.light.error,
  },
  chart: colors.chart,
  device: {
    Mobile: colors.device.mobile,
    Desktop: colors.device.desktop,
    Tablet: colors.device.tablet,
    'Smart tv': colors.device.smartTv,
  } as Record<string, string>,
  os: {
    Windows: colors.os.windows,
    macOS: colors.os.macOS,
    iOS: colors.os.iOS,
    Android: colors.os.android,
    Linux: colors.os.linux,
    'Chrome OS': colors.os.chromeOS,
  } as Record<string, string>,
} as const;

export default {
  typography,
  shape,
  colors,
  elevation,
  spacing,
  motion,
  stateLayer,
  breakpoints,
  MD3,
};
