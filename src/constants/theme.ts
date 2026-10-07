// =============================================================================
// TEMA / DESIGN SYSTEM - RENFI MOBILE
// Basado en DESIGN.md: "La Finca Abierta / Casa de Campo"
// =============================================================================

export const Colors = {
  // Primary — Terracota
  primary: '#c2410c',
  primaryLight: '#ea580c',
  primaryDark: '#9a3412',
  primarySurface: '#fbece2',

  // Secondary — Verde Cordillera
  secondary: '#1b4332',
  secondaryLight: '#2d6a4f',
  secondaryDark: '#081c15',
  secondarySurface: '#e5efe8',

  // Accent — Ámbar atardecer (solo estrellas)
  accent: '#d97706',

  // Superficies
  surfaceBase: '#f5f2eb',
  surfaceLight: '#fcfbf9',
  surfaceMedium: '#e8e2d5',
  surfaceDark: '#d6cfc4',

  // Texto
  textPrimary: '#1f2421',
  textSecondary: '#5c645d',
  textTertiary: '#8f9892',
  textInverse: '#ffffff',
  textOnDark: '#dbe7df',
  textOnDarkMuted: '#b9cbbf',
  onDarkAccent: '#fdba74',

  // Estado
  success: '#2d6a4f',
  successSurface: '#e5efe8',
  warning: '#92400e',
  warningSurface: '#fbf0dc',
  danger: '#b42318',
  dangerSurface: '#fbe7e3',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
  gutter: 20,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Sombras — Sistema "alero"
export const Shadows = {
  alerLeve: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  aleroMedio: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  aleroAmplio: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 32,
    elevation: 6,
  },
  tejaPrimary: {
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  tarjetaElevada: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
