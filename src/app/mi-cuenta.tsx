import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Alert, StateBlock, ConfirmDialog } from '../components/ui/Feedback';
import { fechaCorta } from '../components/ReservaCalendar';
import { useAuth } from '../context/AuthContext';
import { actualizarUsuario } from '../services/auth.service';
import { listarReservasPorUsuario, actualizarEstadoReserva, esInactiva } from '../services/reservas.service';
import { Colors, Fonts, Radius, Shadows, Type } from '../constants/theme';
import type { Reserva } from '../types';

const esCancelada = (r: Reserva) => esInactiva(r.Estado);
const nochesEntre = (r: Reserva) =>
  r.FechaEntrada && r.FechaSalida
    ? Math.max(0, Math.round((Date.parse(r.FechaSalida.slice(0, 10)) - Date.parse(r.FechaEntrada.slice(0, 10))) / 86400000))
    : 0;

type Aviso = { tone: 'success' | 'error' | 'info'; txt: string };

export default function MiCuenta() {
  const insets = useSafeAreaInsets();
  const { usuario, setUsuario, cargando: cargandoSesion } = useAuth();
  const [nombre, setNombre] = useState(usuario?.NombreUsuario ?? '');
  const [apellido, setApellido] = useState(usuario?.ApellidoUsuario ?? '');
  const [telefono, setTelefono] = useState(usuario?.Telefono ?? '');
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [msgRes, setMsgRes] = useState<Aviso | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [porCancelar, setPorCancelar] = useState<Reserva | null>(null);
  const doc = usuario?.NumeroDocumento;

  const aplicar = (r: Awaited<ReturnType<typeof listarReservasPorUsuario>>) => {
    if (r.error || !r.data) {
      setReservas([]);
      setMsgRes({ tone: 'error', txt: 'No fue posible cargar tus reservas. Intenta nuevamente en unos minutos.' });
    } else {
      setReservas(r.data.filter((x) => !esCancelada(x)).sort((a, b) => b.IdReserva - a.IdReserva));
    }
    setCargando(false);
  };

  useEffect(() => {
    if (doc == null) return;
    let alive = true;
    listarReservasPorUsuario(doc).then((r) => alive && aplicar(r));
    return () => {
      alive = false;
    };
  }, [doc]);

  const recargar = useCallback(async () => {
    if (doc == null) return;
    setCargando(true);
    setMsgRes(null);
    const r = await listarReservasPorUsuario(doc);
    aplicar(r);
    if (!r.error) {
      const hay = (r.data ?? []).some((x) => !esCancelada(x));
      setMsgRes(
        hay
          ? { tone: 'success', txt: 'Tus reservas se sincronizaron correctamente.' }
          : { tone: 'info', txt: 'No encontramos reservas asociadas a tu cuenta.' }
      );
    }
  }, [doc]);

  if (!usuario) {
    return (
      <View style={styles.page}>
        <AppHeader />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            {cargandoSesion ? (
              <StateBlock loading title="Cargando tu información…" />
            ) : (
              <StateBlock
                icon="person-outline"
                title="Tu cuenta Renfi"
                text="Inicia sesión para ver y actualizar la información de tu perfil, además de gestionar tus reservas."
                action={{ title: 'Ir al inicio de sesión', onPress: () => router.push('/iniciar-sesion') }}
              />
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  const errNombre = nombre.trim().length < 2 ? 'Ingresa un nombre válido (mínimo 2 caracteres).' : '';
  const errApellido = apellido.trim().length < 2 ? 'Ingresa un apellido válido.' : '';
  const errTel = !/^[0-9]{7,}$/.test(telefono.trim()) ? 'Ingresa un teléfono válido (mínimo 7 dígitos).' : '';

  const guardar = async () => {
    setIntento(true);
    setAviso(null);
    if (errNombre || errApellido || errTel) return;
    setGuardando(true);
    const cambios = { NombreUsuario: nombre.trim(), ApellidoUsuario: apellido.trim(), Telefono: telefono.trim() };
    const { error } = await actualizarUsuario(usuario.NumeroDocumento, cambios);
    setGuardando(false);
    if (error) return setAviso({ tone: 'error', txt: error });
    setUsuario({ ...usuario, ...cambios });
    setAviso({ tone: 'success', txt: 'Tus datos se han actualizado correctamente.' });
  };

  const confirmarCancelar = async () => {
    const r = porCancelar;
    if (!r) return;
    setCancelando(r.IdReserva);
    // Cancelación blanda: borrar la reserva eliminaría en cascada su factura y pago.
    const res = await actualizarEstadoReserva(r.IdReserva, 'Cancelada');
    setCancelando(null);
    setPorCancelar(null);
    if (res.success) {
      setReservas((prev) => prev.filter((x) => x.IdReserva !== r.IdReserva));
      setMsgRes({ tone: 'success', txt: 'La reserva se canceló correctamente.' });
      setTimeout(() => setMsgRes(null), 5000);
    } else {
      setMsgRes({ tone: 'error', txt: 'No fue posible cancelar la reserva. Intenta nuevamente.' });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View>
          <Text style={styles.h1}>
            {usuario.NombreUsuario} {usuario.ApellidoUsuario}
          </Text>
          <Text style={styles.sub}>{usuario.Correo}</Text>
          <View style={styles.badges}>
            <Badge label={usuario.Estado || 'Activo'} variant="success" dot />
            <Badge label={usuario.NombreRol || 'Cliente'} variant="primary" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos personales</Text>
          <Text style={[styles.sub, { marginBottom: 14 }]}>Actualiza tu información para mantener tu perfil al día.</Text>
          <Input label="Nombre" value={nombre} onChangeText={setNombre} error={intento ? errNombre : ''} />
          <Input label="Apellido" value={apellido} onChangeText={setApellido} error={intento ? errApellido : ''} />
          <Input label="Correo electrónico" value={usuario.Correo} editable={false} hint="El correo es tu identificador y no puede modificarse." />
          <Input label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" error={intento ? errTel : ''} />
          {!!aviso && <Alert tone={aviso.tone}>{aviso.txt}</Alert>}
          <Button
            title={guardando ? 'Guardando…' : 'Guardar cambios'}
            loading={guardando}
            disabled={!!(errNombre || errApellido || errTel)}
            onPress={guardar}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Reservas recientes</Text>
              <Text style={styles.sub}>Consulta las reservas asociadas a tu cuenta.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Actualizar reservas"
              disabled={cargando || guardando}
              onPress={recargar}
              style={[styles.iconBtn, (cargando || guardando) && { opacity: 0.4 }]}
            >
              <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>
          {!!msgRes && (
            <View style={{ marginTop: 12 }}>
              <Alert tone={msgRes.tone}>{msgRes.txt}</Alert>
            </View>
          )}
          {cargando ? (
            <StateBlock loading title="Sincronizando tus reservas…" />
          ) : reservas.length === 0 ? (
            <StateBlock
              icon="calendar-outline"
              text="Aún no tienes reservas registradas. Explora las fincas disponibles y realiza tu primera reserva."
              action={{ title: 'Explorar fincas', onPress: () => router.navigate('/') }}
            />
          ) : (
            reservas.map((r) => (
              <View key={r.IdReserva} style={styles.item}>
                <View style={styles.itemHead}>
                  <Text style={styles.itemTitle}>{r.NombreFinca || 'Finca sin nombre'}</Text>
                  <Text style={[styles.itemId, Type.num]}>#{r.IdReserva}</Text>
                </View>
                <Text style={[styles.line, Type.num]}>
                  Entrada {fechaCorta(r.FechaEntrada)} · Salida {fechaCorta(r.FechaSalida)} · {nochesEntre(r)}{' '}
                  {nochesEntre(r) === 1 ? 'noche' : 'noches'}
                </Text>
                <View style={styles.itemFoot}>
                  <Text style={[styles.creada, Type.num]}>Creada el {fechaCorta(r.FechaReserva)}</Text>
                  <Button
                    title={cancelando === r.IdReserva ? 'Cancelando…' : 'Cancelar reserva'}
                    variant="dangerGhost"
                    size="sm"
                    loading={cancelando === r.IdReserva}
                    onPress={() => setPorCancelar(r)}
                  />
                </View>
              </View>
            ))
          )}
        </View>
        <Footer />
      </ScrollView>
      <ConfirmDialog
        visible={!!porCancelar}
        danger
        icon="alert-circle-outline"
        title="¿Cancelar esta reserva?"
        message={`Vas a cancelar la reserva #${porCancelar?.IdReserva} de ${porCancelar?.NombreFinca || 'esta finca'}. Esta acción no se puede deshacer.`}
        cancelText="Mantener reserva"
        confirmText="Sí, cancelar reserva"
        loading={cancelando != null}
        onConfirm={confirmarCancelar}
        onCancel={() => setPorCancelar(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.surfaceBase },
  scroll: { padding: 16, gap: 16 },
  card: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.xl, padding: 20, ...Shadows.sm },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 19, color: Colors.secondary, marginBottom: 4 },
  sub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  h1: { ...Type.headline, marginBottom: 4 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, alignItems: 'center', justifyContent: 'center' },
  item: { borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.lg, padding: 14, gap: 6, marginTop: 12 },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flex: 1, fontFamily: Fonts.semibold, fontSize: 16, color: Colors.textPrimary },
  itemId: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textSecondary },
  line: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  itemFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  creada: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flexShrink: 1 },
});
