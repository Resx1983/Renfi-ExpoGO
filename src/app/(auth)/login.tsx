import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { iniciarSesion } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

// =============================================================================
// PANTALLA LOGIN
// =============================================================================

export default function LoginScreen() {
  const { setUsuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({ correo: '', contrasena: '' });
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const validar = () => {
    const e = { correo: '', contrasena: '' };
    let ok = true;
    if (!correo.trim()) {
      e.correo = 'El correo es requerido.';
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      e.correo = 'Ingresa un correo válido.';
      ok = false;
    }
    if (!contrasena) {
      e.contrasena = 'La contraseña es requerida.';
      ok = false;
    }
    setErrores(e);
    return ok;
  };

  const handleLogin = async () => {
    setErrorGeneral(null);
    if (!validar()) return;
    setLoading(true);
    const { data, error } = await iniciarSesion(correo.trim(), contrasena);
    setLoading(false);
    if (error || !data) {
      const msg = error ?? 'Correo o contraseña incorrectos.';
      setErrorGeneral(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Error al iniciar sesión', msg);
      }
      return;
    }
    setUsuario(data);
    router.replace('/(main)/home');
  };

  const llenarDemo = (emailDemo: string, passDemo: string) => {
    setCorreo(emailDemo);
    setContrasena(passDemo);
    setErrores({ correo: '', contrasena: '' });
    setErrorGeneral(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Panel verde de marca */}
        <View style={[styles.heroBand, { paddingTop: insets.top + 32 }]}>
          {/* Logo */}
          <View style={styles.logoBox}>
            <View style={styles.logoRoof} />
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.brandName}>Renfi</Text>
          <Text style={styles.brandTagline}>Tu finca, tus tiempos</Text>

          {/* Silueta de cordillera decorativa en SVG nativo simulada */}
          <View style={styles.mountainDecor}>
            <View style={[styles.mountain, styles.mountain3]} />
            <View style={[styles.mountain, styles.mountain2]} />
            <View style={[styles.mountain, styles.mountain1]} />
          </View>
        </View>

        {/* Zócalo signature */}
        <View style={styles.zocalo}>
          <View style={styles.zocaloGreen} />
          <View style={styles.zocaloWhite} />
          <View style={styles.zocaloTerra} />
        </View>

        {/* Formulario */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar sesión</Text>
          <Text style={styles.formSubtitle}>
            Accede para gestionar tus reservas
          </Text>

          {errorGeneral && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorGeneral}</Text>
            </View>
          )}

          <Input
            label="Correo electrónico"
            value={correo}
            onChangeText={(v) => {
              setCorreo(v);
              setErrorGeneral(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="tu@correo.com"
            error={errores.correo}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Contraseña"
            value={contrasena}
            onChangeText={(v) => {
              setContrasena(v);
              setErrorGeneral(null);
            }}
            secureTextEntry={!mostrarContrasena}
            autoComplete="current-password"
            placeholder="••••••••"
            error={errores.contrasena}
            containerStyle={styles.inputSpacing}
          />

          <TouchableOpacity
            style={styles.showPassRow}
            onPress={() => setMostrarContrasena(!mostrarContrasena)}
          >
            <Text style={styles.showPassText}>
              {mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            </Text>
          </TouchableOpacity>

          <Button
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={styles.loginBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Crear cuenta"
            variant="secondary"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
          />

          {/* Cuentas de demostración de acceso rápido */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Cuentas demo (toca para autocompletar):</Text>
            <View style={styles.demoChipsRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => llenarDemo('cliente@renfi.com', 'cliente123')}
              >
                <Text style={styles.demoChipRole}>Cliente</Text>
                <Text style={styles.demoChipCreds}>cliente123</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => llenarDemo('admin@renfi.com', 'admin123')}
              >
                <Text style={styles.demoChipRole}>Admin</Text>
                <Text style={styles.demoChipCreds}>admin123</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer mínimo */}
        <Text style={styles.footer}>
          © {new Date().getFullYear()} Renfi · Fincas verificadas
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.secondaryDark },

  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.surfaceBase,
  },

  // ── Hero band verde ──────────────────────────────────────────────────────
  heroBand: {
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 48,
    overflow: 'hidden',
  },

  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoRoof: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: Colors.primary,
  },
  logoText: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginTop: 8,
  },

  brandName: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: FontSize.base,
    color: Colors.textOnDarkMuted,
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // Cordillera decorativa
  mountainDecor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  mountain: {
    position: 'absolute',
    bottom: 0,
  },
  mountain1: {
    left: '5%',
    width: '40%',
    height: 36,
    backgroundColor: 'rgba(45,106,79,0.6)',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 40,
  },
  mountain2: {
    left: '30%',
    width: '50%',
    height: 28,
    backgroundColor: 'rgba(27,67,50,0.7)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 60,
  },
  mountain3: {
    right: '0%',
    width: '45%',
    height: 32,
    backgroundColor: 'rgba(8,28,21,0.5)',
    borderTopLeftRadius: 55,
    borderTopRightRadius: 30,
  },

  // ── Zócalo ──────────────────────────────────────────────────────────────
  zocalo: { flexDirection: 'column', height: 14 },
  zocaloGreen: { height: 2, backgroundColor: Colors.secondary },
  zocaloWhite: { height: 3, backgroundColor: Colors.surfaceLight },
  zocaloTerra: { flex: 1, backgroundColor: Colors.primary },

  // ── Formulario ──────────────────────────────────────────────────────────
  formCard: {
    margin: Spacing.gutter,
    marginTop: 28,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xxl,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    ...Shadows.aleroAmplio,
  },

  formTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputSpacing: { marginBottom: 12 },

  showPassRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  showPassText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: FontWeight.medium,
  },

  loginBtn: { marginBottom: Spacing.md },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceMedium,
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },

  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },

  demoBox: {
    marginTop: Spacing.lg,
    padding: 12,
    backgroundColor: Colors.surfaceMedium,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceDark,
  },
  demoTitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: FontWeight.medium,
  },
  demoChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.secondaryLight,
    alignItems: 'center',
  },
  demoChipRole: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
  },
  demoChipCreds: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    paddingVertical: Spacing.lg,
  },
});
