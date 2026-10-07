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
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  FontWeight,
  Shadows,
} from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { registrarUsuario, iniciarSesion } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

// =============================================================================
// PANTALLA REGISTRO
// =============================================================================

interface FormErrors {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  contrasena: string;
  confirmar: string;
}

const erroresVacios: FormErrors = {
  nombre: '',
  apellido: '',
  telefono: '',
  correo: '',
  contrasena: '',
  confirmar: '',
};

export default function RegisterScreen() {
  const { setUsuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<FormErrors>(erroresVacios);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // ── Validación ─────────────────────────────────────────────────────────────
  const validar = (): boolean => {
    const e: FormErrors = { ...erroresVacios };
    let ok = true;

    if (!nombre.trim()) {
      e.nombre = 'El nombre es requerido.';
      ok = false;
    } else if (nombre.trim().length < 2) {
      e.nombre = 'Mínimo 2 caracteres.';
      ok = false;
    }

    if (!apellido.trim()) {
      e.apellido = 'El apellido es requerido.';
      ok = false;
    } else if (apellido.trim().length < 2) {
      e.apellido = 'Mínimo 2 caracteres.';
      ok = false;
    }

    if (telefono.trim() && !/^\+?[\d\s\-()]{7,15}$/.test(telefono.trim())) {
      e.telefono = 'Ingresa un teléfono válido.';
      ok = false;
    }

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
    } else if (contrasena.length < 6) {
      e.contrasena = 'Mínimo 6 caracteres.';
      ok = false;
    }

    if (!confirmar) {
      e.confirmar = 'Confirma tu contraseña.';
      ok = false;
    } else if (contrasena !== confirmar) {
      e.confirmar = 'Las contraseñas no coinciden.';
      ok = false;
    }

    setErrores(e);
    return ok;
  };

  // ── Registro ───────────────────────────────────────────────────────────────
  const handleRegistrar = async () => {
    setErrorGeneral(null);
    if (!validar()) return;

    setLoading(true);
    const { numeroDocumento, error: regError } = await registrarUsuario({
      nombre,
      apellido,
      telefono,
      correo,
      contrasena,
      idRol: 2, // Cliente por defecto (según tabla Rol)
    });
    setLoading(false);

    if (regError || !numeroDocumento) {
      const msg = regError ?? 'Inténtalo de nuevo.';
      setErrorGeneral(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Error al registrarse', msg);
      }
      return;
    }

    // Auto-login después del registro
    setLoading(true);
    const { data: sesion, error: loginError } = await iniciarSesion(
      correo.trim().toLowerCase(),
      contrasena
    );
    setLoading(false);

    if (loginError || !sesion) {
      // Registro OK pero login falló — enviar al login manual
      if (Platform.OS === 'web') {
        router.replace('/(auth)/login');
      } else {
        Alert.alert(
          '¡Cuenta creada!',
          'Tu cuenta fue creada exitosamente. Por favor inicia sesión.',
          [{ text: 'Aceptar', onPress: () => router.replace('/(auth)/login') }]
        );
      }
      return;
    }

    setUsuario(sesion);
    if (Platform.OS === 'web') {
      router.replace('/(main)/home');
    } else {
      Alert.alert(
        '¡Bienvenido/a!',
        `Hola ${sesion.NombreUsuario}, tu cuenta fue creada exitosamente.`,
        [{ text: 'Continuar', onPress: () => router.replace('/(main)/home') }]
      );
    }
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
        {/* ── Header verde compacto ── */}
        <View style={[styles.heroBand, { paddingTop: insets.top + 24 }]}>
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(auth)/login')
            }
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={8}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoBox}>
            <View style={styles.logoRoof} />
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.brandName}>Renfi</Text>
          <Text style={styles.brandTagline}>Crea tu cuenta gratis</Text>

          {/* Cordillera decorativa */}
          <View style={styles.mountainDecor}>
            <View style={[styles.mountain, styles.mountain3]} />
            <View style={[styles.mountain, styles.mountain2]} />
            <View style={[styles.mountain, styles.mountain1]} />
          </View>
        </View>

        {/* Zócalo */}
        <View style={styles.zocalo}>
          <View style={styles.zocaloGreen} />
          <View style={styles.zocaloWhite} />
          <View style={styles.zocaloTerra} />
        </View>

        {/* ── Formulario ── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Crear cuenta</Text>
          <Text style={styles.formSubtitle}>
            Completa tus datos para comenzar
          </Text>

          {errorGeneral && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorGeneral}</Text>
            </View>
          )}

          {/* Fila nombre + apellido */}
          <View style={styles.row}>
            <Input
              label="Nombre"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              placeholder="María"
              error={errores.nombre}
              containerStyle={styles.halfInputLeft}
            />
            <Input
              label="Apellido"
              value={apellido}
              onChangeText={setApellido}
              autoCapitalize="words"
              placeholder="García"
              error={errores.apellido}
              containerStyle={styles.halfInputRight}
            />
          </View>

          <Input
            label="Teléfono (opcional)"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            placeholder="+57 300 000 0000"
            error={errores.telefono}
            containerStyle={styles.inputSpacing}
          />

          <Input
            label="Correo electrónico"
            value={correo}
            onChangeText={setCorreo}
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
            onChangeText={setContrasena}
            secureTextEntry={!mostrarPass}
            placeholder="Mínimo 6 caracteres"
            error={errores.contrasena}
            containerStyle={styles.inputSpacing}
          />

          <TouchableOpacity
            style={styles.togglePassBtn}
            onPress={() => setMostrarPass(!mostrarPass)}
          >
            <Text style={styles.togglePassText}>
              {mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            </Text>
          </TouchableOpacity>

          <Input
            label="Confirmar contraseña"
            value={confirmar}
            onChangeText={setConfirmar}
            secureTextEntry={!mostrarConfirmar}
            placeholder="Repite tu contraseña"
            error={errores.confirmar}
            containerStyle={styles.inputSpacing}
          />

          <TouchableOpacity
            style={styles.togglePassBtn}
            onPress={() => setMostrarConfirmar(!mostrarConfirmar)}
          >
            <Text style={styles.togglePassText}>
              {mostrarConfirmar
                ? 'Ocultar confirmación'
                : 'Mostrar confirmación'}
            </Text>
          </TouchableOpacity>

          {/* Nota de rol */}
          <View style={styles.rolNote}>
            <Text style={styles.rolNoteText}>
              Tu cuenta se creará como{' '}
              <Text style={styles.rolNoteStrong}>Cliente</Text>. Si eres
              propietario de una finca, contacta al administrador.
            </Text>
          </View>

          <Button
            title="Crear cuenta"
            onPress={handleRegistrar}
            loading={loading}
            fullWidth
            style={styles.registerBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Ya tengo cuenta · Iniciar sesión"
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>

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
    paddingBottom: 44,
    overflow: 'hidden',
  },

  backBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backArrow: {
    fontSize: 20,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },

  logoBox: {
    width: 52,
    height: 52,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  logoRoof: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: Colors.primary,
  },
  logoText: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginTop: 6,
  },
  brandName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    letterSpacing: -0.4,
  },
  brandTagline: {
    fontSize: FontSize.sm,
    color: Colors.textOnDarkMuted,
    marginTop: 3,
    letterSpacing: 0.3,
  },

  mountainDecor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
  },
  mountain: { position: 'absolute', bottom: 0 },
  mountain1: {
    left: '5%',
    width: '40%',
    height: 32,
    backgroundColor: 'rgba(45,106,79,0.6)',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 40,
  },
  mountain2: {
    left: '30%',
    width: '50%',
    height: 24,
    backgroundColor: 'rgba(27,67,50,0.7)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 60,
  },
  mountain3: {
    right: '0%',
    width: '45%',
    height: 28,
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
    marginTop: 24,
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

  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInputLeft: {
    flex: 1,
    marginBottom: 12,
  },
  halfInputRight: {
    flex: 1,
    marginBottom: 12,
  },
  inputSpacing: { marginBottom: 12 },

  togglePassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  togglePassText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: FontWeight.medium,
  },

  rolNote: {
    backgroundColor: Colors.secondarySurface,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 20,
    marginTop: 4,
  },
  rolNoteText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  rolNoteStrong: {
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },

  registerBtn: { marginBottom: Spacing.md },

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

  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    paddingVertical: Spacing.lg,
  },
});
