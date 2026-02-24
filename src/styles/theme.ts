import type { GlobalThemeOverrides } from 'naive-ui'

// ============================================
// Plan Desktop - Rose Pink Dark Theme
// ============================================
// Design Principles:
// - Geometric grid-based layout (12-column)
// - High contrast for readability
// - Functional, no unnecessary decoration
// - Rose pink accent with white and gray palette
// ============================================

// Color Palette
const colors = {
  // Backgrounds (Gray scale for depth)
  bgBase: '#18181B',        // Zinc 900 - main background
  bgElevated: '#27272A',    // Zinc 800 - cards, panels
  bgOverlay: '#3F3F46',     // Zinc 700 - hover states, borders

  // Text (High contrast for readability)
  textBase: '#FAFAFA',      // Zinc 50 - primary text (white)
  textMuted: '#A1A1AA',     // Zinc 400 - secondary text
  textDisabled: '#71717A',  // Zinc 500 - disabled text

  // Accent (Rose Pink - warm and vibrant)
  accent: '#F43F5E',        // Rose 500 - primary action (桃红色)
  accentHover: '#FB7185',   // Rose 400 - hover state
  accentMuted: '#881337',   // Rose 900 - accent backgrounds

  // Semantic
  error: '#EF4444',         // Red 500
  warning: '#F59E0B',       // Amber 500
  info: '#3B82F6',          // Blue 500
  success: '#22C55E',       // Green 500

  // Borders (Subtle, functional)
  border: '#3F3F46',        // Zinc 700
  borderLight: '#52525B',   // Zinc 600
}

// Spacing System (4px base, Swiss precision)
export const spacing = {
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '24px',
  '6': '32px',
  '7': '48px',
  '8': '64px',
  '9': '96px',
  '10': '128px',
} as const

// Border Radius (Minimal, almost sharp)
export const radius = {
  none: '0px',
  sm: '2px',
  base: '4px',
  md: '6px',
  lg: '8px',
} as const

// Typography
export const typography = {
  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",

  sizes: {
    xs: '12px',
    sm: '14px',
    base: '15px',     // Slightly reduced for dense UI
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Swiss style - tight line heights
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

// Transitions (Subtle micro-interactions)
export const transitions = {
  fast: '100ms ease-out',
  base: '150ms ease-out',
  slow: '200ms ease-out',
} as const

// ============================================
// Naive UI Theme Overrides
// ============================================
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    // Base
    baseColor: colors.bgBase,
    bodyColor: colors.bgBase,
    cardColor: colors.bgElevated,
    modalColor: colors.bgElevated,
    popoverColor: colors.bgElevated,

    // Text
    textColorBase: colors.textBase,
    textColor1: colors.textBase,
    textColor2: colors.textMuted,
    textColor3: colors.textDisabled,

    // Border
    borderColor: colors.border,
    dividerColor: colors.border,

    // Border radius
    borderRadius: radius.base,
    borderRadiusSmall: radius.sm,

    // Font
    fontFamily: typography.fontFamily,
    fontFamilyMono: typography.fontMono,
    fontSize: typography.sizes.base,
    fontSizeMini: typography.sizes.xs,
    fontSizeTiny: typography.sizes.xs,
    fontSizeSmall: typography.sizes.sm,
    fontSizeMedium: typography.sizes.base,
    fontSizeLarge: typography.sizes.lg,
    fontSizeHuge: typography.sizes.xl,

    // Transitions
    cubicBezierEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    cubicBezierEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',

    // Line heights
    lineHeight: String(typography.lineHeights.normal),
  },

  // Primary Button (Emerald accent)
  Button: {
    colorPrimary: colors.accent,
    colorHoverPrimary: colors.accentHover,
    colorPressedPrimary: colors.accent,
    colorFocusPrimary: colors.accent,
    colorDisabledPrimary: colors.accentMuted,
    textColorPrimary: colors.bgBase,
    textColorHoverPrimary: colors.bgBase,
    textColorPressedPrimary: colors.bgBase,
    textColorFocusPrimary: colors.bgBase,
    textColorDisabledPrimary: colors.textMuted,

    // Default button
    color: 'transparent',
    colorHover: colors.bgOverlay,
    colorPressed: colors.bgOverlay,
    textColor: colors.textBase,
    textColorHover: colors.textBase,
    textColorPressed: colors.textBase,
    border: `1px solid ${colors.border}`,
    borderHover: `1px solid ${colors.borderLight}`,
    borderPressed: `1px solid ${colors.borderLight}`,

    heightTiny: '24px',
    heightSmall: '32px',
    heightMedium: '40px',
    heightLarge: '48px',

    borderRadiusTiny: radius.sm,
    borderRadiusSmall: radius.base,
    borderRadiusMedium: radius.base,
    borderRadiusLarge: radius.md,
  },

  // Input
  Input: {
    color: colors.bgBase,
    colorFocus: colors.bgBase,
    colorDisabled: colors.bgElevated,
    textColor: colors.textBase,
    textColorDisabled: colors.textDisabled,
    placeholderColor: colors.textDisabled,
    border: `1px solid ${colors.border}`,
    borderHover: `1px solid ${colors.borderLight}`,
    borderFocus: `1px solid ${colors.accent}`,
    boxShadowFocus: `0 0 0 2px ${colors.accentMuted}`,
    borderRadius: radius.base,
    heightSmall: '32px',
    heightMedium: '40px',
    heightLarge: '48px',
  },

  // Card
  Card: {
    color: colors.bgElevated,
    colorModal: colors.bgElevated,
    borderRadius: radius.md,
    borderColor: colors.border,
  },

  // Modal
  Dialog: {
    color: colors.bgElevated,
    borderRadius: radius.md,
  },

  // Menu
  Menu: {
    color: colors.bgElevated,
    borderRadius: radius.base,
    borderColor: colors.border,
  },

  // Select
  Select: {
    menuColor: colors.bgElevated,
  },

  // Dropdown
  Dropdown: {
    color: colors.bgElevated,
    borderRadius: radius.base,
    optionColorActive: colors.bgOverlay,
    optionColorHover: colors.bgOverlay,
  },

  // Tooltip
  Tooltip: {
    color: colors.bgOverlay,
    textColor: colors.textBase,
    borderRadius: radius.sm,
  },

  // Tag
  Tag: {
    color: colors.bgOverlay,
    colorBordered: 'transparent',
    borderColorBordered: colors.border,
    textColor: colors.textBase,
    borderRadius: radius.sm,
  },

  // Tabs
  Tabs: {
    tabColor: 'transparent',
    tabColorActive: colors.bgOverlay,
    tabColorHover: colors.bgOverlay,
    tabBorderColor: colors.border,
    tabBorderActiveColor: colors.accent,
    tabTextColor: colors.textMuted,
    tabTextColorActive: colors.textBase,
    tabTextColorHover: colors.textBase,
    tabBorderRadius: radius.base,
    panePadding: `${spacing[4]} 0`,
  },

  // Checkbox & Radio
  Checkbox: {
    color: colors.bgBase,
    border: `1px solid ${colors.border}`,
    borderChecked: `1px solid ${colors.accent}`,
    colorChecked: colors.accent,
    borderFocus: `1px solid ${colors.accent}`,
    boxShadowFocus: `0 0 0 2px ${colors.accentMuted}`,
  },

  // Switch
  Switch: {
    railColor: colors.bgOverlay,
    railColorActive: colors.accent,
    buttonColor: colors.textBase,
    boxShadowFocus: `0 0 0 2px ${colors.accentMuted}`,
  },

  // Slider
  Slider: {
    fillColor: colors.accent,
    fillColorHover: colors.accentHover,
    railColor: colors.bgOverlay,
    handleColor: colors.textBase,
    dotColor: colors.bgElevated,
  },

  // Progress
  Progress: {
    railColor: colors.bgOverlay,
    railHeight: '4px',
    fillColor: colors.accent,
    fillColorSuccess: colors.accent,
    fillColorError: colors.error,
    fillColorWarning: colors.warning,
  },

  // Notification
  Notification: {
    color: colors.bgElevated,
    borderRadius: radius.md,
  },

  // Message
  Message: {
    color: colors.bgOverlay,
    colorInfo: colors.bgOverlay,
    colorSuccess: colors.accentMuted,
    colorWarning: '#451a03',
    colorError: '#450a0a',
    textColor: colors.textBase,
    textColorInfo: colors.textBase,
    textColorSuccess: colors.accent,
    textColorWarning: colors.warning,
    textColorError: colors.error,
    borderRadius: radius.base,
  },

  // Skeleton
  Skeleton: {
    color: colors.bgOverlay,
    colorEnd: colors.bgElevated,
  },
}

// Export colors for use in components
export { colors }
export default themeOverrides
