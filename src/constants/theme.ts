// =============================================================================
// TEMA / DESIGN SYSTEM - RENFI MOBILE
// "La Finca Abierta / Casa de Campo" — espejo de src/styles.css + DESIGN.md
// de la web (rama develop). Sin gradientes, sin emoji como iconos.
// =============================================================================

export const Colors = {
  // Primary — Terracota (solo acción principal y precio)
  primary: '#c2410c',
  primaryLight: '#ea580c',
  primaryDark: '#9a3412',
  primarySurface: '#fbece2',

  // Secondary — Verde cordillera
  secondary: '#1b4332',
  secondaryLight: '#2d6a4f',
  secondaryDark: '#081c15',
  secondarySurface: '#e5efe8',

  // Accent — Ámbar (solo estrellas)
  accent: '#d97706',

  // Superficies
  surfaceBase: '#f5f2eb', // fondo de página
  surfaceLight: '#fcfbf9', // tarjetas, inputs, header
  surfaceMedium: '#e8e2d5', // hairlines, bordes de tarjeta
  surfaceDark: '#d6cfc4', // bordes de inputs y botón secundario

  // Texto
  textPrimary: '#1f2421',
  textSecondary: '#5c645d',
  textTertiary: '#8f9892', // solo iconos y deshabilitados
  textInverse: '#ffffff',
  textOnDark: '#dbe7df',
  textOnDarkMuted: '#b9cbbf',
  onDarkAccent: '#fdba74',
  placeholder: '#7d867f',

  // Estado
  success: '#2d6a4f',
  successSurface: '#e5efe8',
  warning: '#92400e',
  warningSurface: '#fbf0dc',
  danger: '#b42318',
  dangerDark: '#8f1c13',
  dangerSurface: '#fbe7e3',

  overlay: 'rgba(8,28,21,0.5)',
  ghostPressed: 'rgba(27,67,50,0.07)',
  focusHalo: 'rgba(194,65,12,0.16)',
  imageFallback: '#ece6da',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 60,
  gutter: 16,
} as const;

export const Radius = {
  sm: 8,
  md: 12, // inputs
  lg: 16,
  xl: 20, // tarjetas
  xxl: 24, // modales, galerías, bandas
  full: 9999, // botones, badges, chips, avatares
} as const;

export const FontSize = {
  xs: 12,
  sm: 13,
  label: 14,
  input: 15.2,
  base: 16,
  lg: 18,
  xl: 20,
  headline: 26,
  display: 36,
} as const;

// Montserrat (cargada en src/app/_layout.tsx). En Android fontWeight no elige
// la variante, por eso cada peso es una familia.
export const Fonts = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
} as const;

// Sombras "alero": teñidas de verde, siempre con desplazamiento vertical
const alero = (y: number, radius: number, opacity: number, elevation: number, color: string = Colors.secondary) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const Shadows = {
  sm: alero(1, 3, 0.06, 1),
  md: alero(6, 18, 0.07, 3),
  lg: alero(12, 16, 0.08, 6),
  xl: alero(24, 30, 0.18, 12, Colors.secondaryDark),
  cta: alero(8, 10, 0.35, 4, Colors.primaryDark),
} as const;

// Estilos de texto reutilizables (escala móvil de DESIGN.md)
export const Type = {
  display: { fontFamily: Fonts.bold, fontSize: 36, lineHeight: 40, letterSpacing: -0.7, color: Colors.secondary },
  headline: { fontFamily: Fonts.bold, fontSize: 26, lineHeight: 30, color: Colors.secondary },
  title: { fontFamily: Fonts.semibold, fontSize: 19, lineHeight: 26, color: Colors.textPrimary },
  body: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 25, color: Colors.textSecondary },
  label: { fontFamily: Fonts.semibold, fontSize: 14, letterSpacing: 0.14, color: Colors.textPrimary },
  small: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  num: { fontVariant: ['tabular-nums'] as 'tabular-nums'[] },
} as const;

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export const formatCOP = (n: number) => copFormatter.format(Number(n) || 0);

export const WHATSAPP_URL = 'https://w.app/c2laje';
