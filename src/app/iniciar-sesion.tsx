import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { Alert, ConfirmDialog } from '../components/ui/Feedback';
import { iniciarSesion } from '../services/auth.service';
import { useAuth, esAdmin } from '../context/AuthContext';
import { Colors, Fonts } from '../constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERR_RED = 'No fue posible conectar con el servidor. Intenta nuevamente en unos instantes.';

export default function IniciarSesionScreen() {
  const { setUsuario } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [ver, setVer] = useState(false);
  const [recordar, setRecordar] = useState(true); // la sesión siempre se persiste (AuthContext)
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const enviar = async () => {
    const e: typeof errores = {};
    if (!EMAIL_RE.test(correo.trim())) e.correo = 'Ingresa un correo electrónico válido.';
    if (contrasena.length < 6) e.contrasena = 'Ingresa tu contraseña (mínimo 6 caracteres).';
    setErrores(e);
    setError('');
    if (e.correo || e.contrasena) return;

    setCargando(true);
    try {
      const { data, error: err } = await iniciarSesion(correo.trim().toLowerCase(), contrasena);
      if (err || !data) {
        setError(err ?? ERR_RED);
        return;
      }
      setExito(true);
      setUsuario(data);
      timer.current = setTimeout(() => router.replace(esAdmin(data) ? '/administrador' : '/'), 900);
    } catch {
      setError(ERR_RED);
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      description="Ingresa para reservar fincas, revisar tus reservas y gestionar tu cuenta."
      panelTitle="Tu próxima escapada al campo empieza aquí"
      panelText="Retoma tus planes: fincas de recreo verificadas en toda Colombia, con reserva directa y pago seguro."
      active="login"
    >
      <Input
        icon="mail-outline"
        label="Correo electrónico"
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={correo}
        onChangeText={setCorreo}
        error={errores.correo}
      />
      <View>
        <Input
          icon="lock-closed-outline"
          label="Contraseña"
          placeholder="Tu contraseña"
          secureTextEntry={!ver}
          autoCapitalize="none"
          value={contrasena}
          onChangeText={setContrasena}
          error={errores.contrasena}
        />
        <Pressable
          accessibilityLabel={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={styles.eye}
          onPress={() => setVer(!ver)}
        >
          <Ionicons name={ver ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Checkbox label="Recordarme en este equipo" checked={recordar} onChange={setRecordar} />
        </View>
        <Pressable onPress={() => setDialogo(true)} hitSlop={8}>
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </Pressable>
      </View>

      {!!error && <Alert tone="error">{error}</Alert>}
      {exito && <Alert tone="success">Inicio de sesión exitoso. Te estamos redirigiendo.</Alert>}

      <Button
        title={cargando ? 'Validando credenciales...' : 'Ingresar a la plataforma'}
        size="lg"
        fullWidth
        loading={cargando}
        onPress={enviar}
      />
      <Text style={styles.foot}>
        ¿Aún no tienes cuenta?{' '}
        <Text style={styles.link} onPress={() => router.replace('/registrarse')}>
          Regístrate
        </Text>
      </Text>

      <ConfirmDialog
        visible={dialogo}
        icon="key-outline"
        title="Recuperación de contraseña"
        message="Te llevaremos al canal de soporte de Renfi para restablecer tu contraseña con asistencia personalizada."
        cancelText="Volver"
        confirmText="Contactar soporte"
        onCancel={() => setDialogo(false)}
        onConfirm={() => {
          setDialogo(false);
          router.push('/sobre-nosotros');
        }}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  eye: { position: 'absolute', right: 0, top: 22, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  link: { color: Colors.primary, fontFamily: Fonts.semibold, fontSize: 13, textDecorationLine: 'underline' },
  foot: { textAlign: 'center', marginTop: 16, fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary },
});
