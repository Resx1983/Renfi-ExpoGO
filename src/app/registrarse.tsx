import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { Alert } from '../components/ui/Feedback';
import { registrarUsuario } from '../services/auth.service';
import { Colors, Fonts } from '../constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VACIO = { nombre: '', apellido: '', correo: '', telefono: '', contrasena: '', confirmar: '' };

export default function RegistrarseScreen() {
  const [f, setF] = useState(VACIO);
  const [acepto, setAcepto] = useState(false);
  const [ver, setVer] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const set = (k: keyof typeof VACIO) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const enviar = async () => {
    const e: Record<string, string> = {};
    if (f.nombre.trim().length < 2) e.nombre = 'Ingresa tu nombre (mínimo 2 letras).';
    if (f.apellido.trim().length < 2) e.apellido = 'Ingresa tu apellido (mínimo 2 letras).';
    if (!EMAIL_RE.test(f.correo.trim())) e.correo = 'Ingresa un correo electrónico válido.';
    if (!/^[0-9]{10,}$/.test(f.telefono.trim())) e.telefono = 'Ingresa un teléfono válido (10 dígitos).';
    if (f.contrasena.length < 8) e.contrasena = 'Usa al menos 8 caracteres.';
    if (!f.confirmar) e.confirmar = 'Confirma tu contraseña.';
    else if (f.confirmar !== f.contrasena) e.confirmar = 'Las contraseñas no coinciden.';
    if (!acepto) e.acepto = 'Debes aceptar los términos para continuar.';
    setErrores(e);
    setError('');
    if (Object.keys(e).length) return;

    setCargando(true);
    try {
      const res = await registrarUsuario({
        nombre: f.nombre.trim(),
        apellido: f.apellido.trim(),
        telefono: f.telefono.trim(),
        correo: f.correo.trim().toLowerCase(),
        contrasena: f.contrasena,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setExito(true);
      setF(VACIO);
      setAcepto(false);
      timer.current = setTimeout(() => router.replace('/iniciar-sesion'), 1800);
    } catch {
      setError('Ocurrió un error al registrar al usuario. Inténtalo nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const toggle = (
    <Pressable
      accessibilityLabel={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
      style={styles.eye}
      onPress={() => setVer(!ver)}
    >
      <Ionicons name={ver ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
    </Pressable>
  );

  return (
    <AuthShell
      title="Crear cuenta"
      description="Completa tus datos para reservar fincas y gestionar tus reservas en Renfi."
      panelTitle="Crea tu cuenta y reserva con total confianza"
      panelText="Con tu cuenta reservas en pocos pasos, pagas de forma segura y guardas el comprobante de cada estadía."
      active="register"
    >
      <Input label="Nombre" placeholder="Ej. Valeria" value={f.nombre} onChangeText={set('nombre')} error={errores.nombre} />
      <Input label="Apellido" placeholder="Ej. Gómez" value={f.apellido} onChangeText={set('apellido')} error={errores.apellido} />
      <Input
        label="Correo electrónico"
        placeholder="valeria@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={f.correo}
        onChangeText={set('correo')}
        error={errores.correo}
      />
      <Input
        label="Teléfono móvil"
        placeholder="Ej. 3001234567"
        keyboardType="phone-pad"
        value={f.telefono}
        onChangeText={set('telefono')}
        error={errores.telefono}
      />
      <View>
        <Input
          label="Contraseña"
          placeholder="Tu contraseña"
          secureTextEntry={!ver}
          autoCapitalize="none"
          value={f.contrasena}
          onChangeText={set('contrasena')}
          error={errores.contrasena}
          hint="Mínimo 8 caracteres."
        />
        {toggle}
      </View>
      <View>
        <Input
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          secureTextEntry={!ver}
          autoCapitalize="none"
          value={f.confirmar}
          onChangeText={set('confirmar')}
          error={errores.confirmar}
        />
        {toggle}
      </View>
      <Checkbox
        label="Acepto los términos y condiciones y la política de tratamiento de datos personales de Renfi."
        checked={acepto}
        onChange={setAcepto}
        error={errores.acepto}
      />

      {!!error && <Alert tone="error">{error}</Alert>}
      {exito && <Alert tone="success">¡Registro exitoso! Te redirigiremos al inicio de sesión.</Alert>}

      <Button
        title={cargando ? 'Registrando usuario...' : 'Crear mi cuenta'}
        size="lg"
        fullWidth
        loading={cargando}
        onPress={enviar}
      />
      <Text style={styles.foot}>
        ¿Ya tienes cuenta?{' '}
        <Text style={styles.link} onPress={() => router.replace('/iniciar-sesion')}>
          Inicia sesión
        </Text>
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  eye: { position: 'absolute', right: 0, top: 22, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  link: { color: Colors.primary, fontFamily: Fonts.semibold, fontSize: 14, textDecorationLine: 'underline' },
  foot: { textAlign: 'center', marginTop: 16, fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary },
});
