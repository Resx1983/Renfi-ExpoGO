import React, { useState } from 'react';
import { View, Image, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { Colors } from '../constants/theme';

// =============================================================================
// BRAND — Logo, zócalo, cordillera e imagen de finca con ilustración de respaldo
// (todos SVG en línea, igual que la web)
// =============================================================================

/** Logo: casa con techo terracota. `variant="footer"` invierte los colores. */
export function LogoMark({ size = 38, variant = 'default' }: { size?: number; variant?: 'default' | 'footer' }) {
  const footer = variant === 'footer';
  const fondo = footer ? Colors.surfaceLight : Colors.secondary;
  const techo = footer ? Colors.primary : Colors.primaryLight;
  const casa = footer ? Colors.secondary : Colors.surfaceLight;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no">
      <Rect width={32} height={32} rx={9} fill={fondo} />
      <Path d="M6 15.5 16 7l10 8.5" stroke={techo} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M9.5 14.6V24h13v-9.4" stroke={casa} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M14 24v-3.8a2 2 0 0 1 4 0V24" stroke={casa} strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** Franja firma de 14px: 2px verde, 3px cal, 9px terracota. */
export function Zocalo({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style} accessibilityElementsHidden importantForAccessibility="no">
      <View style={{ height: 2, backgroundColor: Colors.secondary }} />
      <View style={{ height: 3, backgroundColor: Colors.surfaceLight }} />
      <View style={{ height: 9, backgroundColor: Colors.primary }} />
    </View>
  );
}

/** Silueta de cordillera (3 capas) para el fondo del hero. */
export function Cordillera({ height = 160, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height }, style]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no">
      <Svg width="100%" height="100%" viewBox="0 0 1440 240" preserveAspectRatio="none">
        <Path
          fill="rgba(45,106,79,0.42)"
          d="M0 150 70 118l60 16 80-50 64 30 76-46 70 40 60-14 84-60 66 52 74-22 60 30 82-62 72 40 66-28 74 36 86-54 70 34 80-30 46 18 100-8V240H0Z"
        />
        <Path
          fill="rgba(8,28,21,0.30)"
          d="M0 182c110-34 200-30 300-52s180 18 280 8 170-46 270-30 170 46 280 30 190-34 310-20V240H0Z"
        />
        <Path fill="rgba(8,28,21,0.50)" d="M0 214c140-22 250-18 380-28s230 18 380 12 250-28 380-18 210 16 300 10V240H0Z" />
      </Svg>
    </View>
  );
}

/** Ilustración local cuando la finca no tiene foto o falla la carga. */
export function FincaIlustracion({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: Colors.imageFallback, overflow: 'hidden' }, style]} accessibilityLabel="Finca sin fotografía">
      <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <Rect width={400} height={300} fill={Colors.imageFallback} />
        <Path d="M0 196 92 120l58 44 76-74 82 70 92-52v192H0z" fill={Colors.secondary} opacity={0.12} />
        <Path d="M0 236 118 176l92 46 86-34 104 40v72H0z" fill={Colors.secondary} opacity={0.18} />
        <Path d="M160 214 200 182l40 32" stroke={Colors.primary} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M170 210v34h60v-34" fill={Colors.surfaceLight} stroke={Colors.secondary} strokeOpacity={0.45} strokeWidth={3} />
        <Path d="M193 244v-14a7 7 0 0 1 14 0v14" stroke={Colors.secondary} strokeOpacity={0.45} strokeWidth={3} fill="none" />
      </Svg>
    </View>
  );
}

/** Foto de la finca; si no hay URL o falla, muestra la ilustración. */
export function FincaImage({ uri, style }: { uri?: string | null; style: StyleProp<ImageStyle> }) {
  const [fallo, setFallo] = useState(false);
  if (!uri || fallo) return <FincaIlustracion style={style as StyleProp<ViewStyle>} />;
  return <Image source={{ uri }} style={[{ backgroundColor: Colors.imageFallback }, style]} onError={() => setFallo(true)} />;
}
