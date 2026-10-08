import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Colors, Fonts, Spacing, WHATSAPP_URL } from '../constants/theme';
import { LogoMark, Zocalo } from './Brand';

// FOOTER — Banda verde con zócalo arriba (footer web develop)
export function Footer() {
  const link = (label: string, href: Href) => (
    <Pressable accessibilityRole="link" onPress={() => router.navigate(href)} style={styles.linkRow}>
      {({ pressed }) => <Text style={[styles.link, pressed && styles.linkPressed]}>{label}</Text>}
    </Pressable>
  );

  return (
    <View style={styles.footer}>
      <Zocalo />
      <View style={styles.body}>
        <View style={styles.brand}>
          <LogoMark variant="footer" size={34} />
          <Text style={styles.brandName}>Renfi</Text>
        </View>
        <Text style={styles.text}>
          Tu portal de confianza para alquilar fincas de recreo y descanso en Colombia. Experiencias campestres auténticas para
          familias y grupos.
        </Text>

        <Text style={styles.heading} accessibilityRole="header">
          Navegación
        </Text>
        {link('Catálogo de fincas', { pathname: '/', params: { seccion: 'portafolio' } })}
        {link('Cómo funciona', { pathname: '/', params: { seccion: 'procesos' } })}
        {link('Sobre nosotros', '/sobre-nosotros')}
        {link('Mi cuenta', '/mi-cuenta')}

        <Text style={styles.heading} accessibilityRole="header">
          Atención y soporte
        </Text>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(WHATSAPP_URL)} style={styles.linkRow}>
          {({ pressed }) => (
            <View style={styles.whatsapp}>
              <Ionicons name="logo-whatsapp" size={18} color={pressed ? Colors.onDarkAccent : Colors.textOnDark} />
              <Text style={[styles.link, pressed && styles.linkPressed]}>Escríbenos por WhatsApp</Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.text}>Soporte directo de lunes a domingo para propietarios y huéspedes.</Text>

        <View style={styles.bottom}>
          <Text style={styles.small}>© {new Date().getFullYear()} Renfi Colombia. Todos los derechos reservados.</Text>
          <View style={styles.seal}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textOnDarkMuted} />
            <Text style={styles.small}>Propiedades verificadas · Tarifas transparentes en COP</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { backgroundColor: Colors.secondary },
  body: { padding: Spacing.xl, paddingHorizontal: Spacing.lg, gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  brandName: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.textInverse },
  text: { fontFamily: Fonts.regular, fontSize: 14.4, lineHeight: 22, color: Colors.textOnDarkMuted },
  heading: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textInverse, marginTop: Spacing.lg, marginBottom: 2 },
  linkRow: { minHeight: 36, justifyContent: 'center' },
  link: { fontFamily: Fonts.medium, fontSize: 15, color: Colors.textOnDark },
  linkPressed: { color: Colors.onDarkAccent },
  whatsapp: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottom: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  seal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  small: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textOnDarkMuted, flexShrink: 1 },
});
