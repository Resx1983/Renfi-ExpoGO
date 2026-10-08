import React, { ReactNode } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from './AppHeader';
import { LogoMark, Zocalo } from './Brand';
import { Colors, Radius, Fonts, Spacing, Shadows, Type } from '../constants/theme';

// Estructura común de Iniciar sesión / Registrarse: tarjeta con switch y, debajo, panel verde de marca.
interface Props {
  title: string;
  description: string;
  panelTitle: string;
  panelText: string;
  active: 'login' | 'register';
  children: ReactNode;
}

const CHECKS = [
  'Fincas verificadas, con fotos reales y servicios activos',
  'Tarifas claras en COP, sin comisiones ocultas',
  'Comprobante oficial de cada reserva',
];

export function AuthShell({ title, description, panelTitle, panelText, active, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.flex}>
      <AppHeader />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        >
          <View style={styles.card}>
            <View style={styles.switch}>
              {(['login', 'register'] as const).map((k) => {
                const on = k === active;
                return (
                  <Pressable
                    key={k}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.switchItem, on && styles.switchOn]}
                    onPress={() => !on && router.replace(k === 'login' ? '/iniciar-sesion' : '/registrarse')}
                  >
                    <Text style={[styles.switchText, on && styles.switchTextOn]}>
                      {k === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.h1}>{title}</Text>
            <Text style={styles.lead}>{description}</Text>
            {children}
          </View>

          <View style={styles.panel}>
            <View style={styles.panelBody}>
              <View style={styles.brand}>
                <LogoMark size={32} />
                <Text style={styles.brandText}>Renfi</Text>
              </View>
              <Text style={styles.panelTitle}>{panelTitle}</Text>
              <Text style={styles.panelText}>{panelText}</Text>
              {CHECKS.map((c) => (
                <View key={c} style={styles.check}>
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={14} color={Colors.onDarkAccent} />
                  </View>
                  <Text style={styles.checkText}>{c}</Text>
                </View>
              ))}
            </View>
            <Zocalo />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },
  content: { padding: Spacing.gutter, paddingTop: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    padding: 24,
    ...Shadows.sm,
  },
  switch: { flexDirection: 'row', backgroundColor: Colors.surfaceMedium, borderRadius: Radius.full, padding: 4, marginBottom: 20 },
  switchItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full },
  switchOn: { backgroundColor: Colors.surfaceLight, ...Shadows.sm },
  switchText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textSecondary },
  switchTextOn: { color: Colors.secondary },
  h1: { ...Type.headline, marginBottom: 6 },
  lead: { ...Type.body, fontSize: 15, marginBottom: 20 },
  panel: { backgroundColor: Colors.secondary, borderRadius: Radius.xxl, overflow: 'hidden' },
  panelBody: { padding: 28, paddingBottom: 32, gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textInverse },
  panelTitle: { fontFamily: Fonts.bold, fontSize: 22, lineHeight: 28, color: Colors.textInverse },
  panelText: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 23, color: Colors.textOnDarkMuted },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  checkText: { flex: 1, fontFamily: Fonts.medium, fontSize: 14, lineHeight: 20, color: Colors.textOnDark },
});
