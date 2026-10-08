import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppHeader } from '../../components/AppHeader';
import { FincaImage } from '../../components/Brand';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Feedback';
import { fechaMedia } from '../../components/ReservaCalendar';
import { useAuth } from '../../context/AuthContext';
import { crearReserva, listarMetodosDePago } from '../../services/reservas.service';
import { checkout } from '../../services/checkout';
import { Colors, Fonts, Radius, Shadows, Type, formatCOP } from '../../constants/theme';
import type { MetodoDePago } from '../../types';

const METODOS_RESPALDO: MetodoDePago[] = [
  { IdMetodoDePago: 1, NombreMetodoDePago: 'Efectivo', PagoMixto: false },
  { IdMetodoDePago: 2, NombreMetodoDePago: 'Transferencia Bancaria', PagoMixto: false },
  { IdMetodoDePago: 3, NombreMetodoDePago: 'Tarjeta de Crédito', PagoMixto: false },
  { IdMetodoDePago: 4, NombreMetodoDePago: 'Nequi / Daviplata', PagoMixto: false },
];

export default function Pago() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  const borrador = checkout.getBorrador();
  const [metodos, setMetodos] = useState<MetodoDePago[]>([]);
  const [metodo, setMetodo] = useState<number | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [intento, setIntento] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    listarMetodosDePago().then((r) => {
      if (!alive) return;
      const lista = r.data?.length ? r.data : METODOS_RESPALDO;
      setMetodos(lista);
      setMetodo((m) => m ?? lista[0].IdMetodoDePago);
    });
    return () => {
      alive = false;
    };
  }, []);

  const sinSesion = !!borrador && !usuario;
  useEffect(() => {
    if (!sinSesion) return;
    const t = setTimeout(() => router.replace('/iniciar-sesion'), 2000);
    return () => clearTimeout(t);
  }, [sinSesion]);

  const volver = () => (borrador ? router.navigate(`/fincas/${borrador.fincaId}`) : router.navigate('/'));

  const confirmar = async () => {
    setIntento(true);
    setError('');
    if (!acepta || !borrador || !usuario || metodo == null) return;
    setProcesando(true);
    const r = await crearReserva({
      IdFinca: borrador.fincaId,
      NumeroDocumentoUsuario: usuario.NumeroDocumento,
      FechaEntrada: borrador.fechaEntrada,
      FechaSalida: borrador.fechaSalida,
      MontoReserva: borrador.montoTotal,
      IdMetodoDePago: metodo,
      Huespedes: borrador.huespedes,
    });
    setProcesando(false);
    if (r.error || !r.data) {
      setError(r.error || 'Error al procesar la reserva. Por favor, intenta nuevamente.');
      return;
    }
    checkout.setResultado({
      borrador,
      idReserva: r.data.IdReserva,
      idFactura: r.idFactura ?? null,
      idPago: r.idPago ?? null,
      metodoPago: metodos.find((m) => m.IdMetodoDePago === metodo)?.NombreMetodoDePago ?? '',
      fechaPago: new Date().toISOString(),
      aNombreDe: `${usuario.NombreUsuario} ${usuario.ApellidoUsuario}`,
    });
    checkout.setBorrador(null);
    router.replace('/reserva/comprobante');
  };

  return (
    <View style={styles.page}>
      <AppHeader />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <Pressable accessibilityRole="link" style={styles.volver} onPress={volver}>
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
          <Text style={styles.volverTxt}>{borrador ? 'Volver a la finca' : 'Volver al inicio'}</Text>
        </Pressable>
        <Text style={styles.h1}>Confirma y paga tu reserva</Text>
        <Text style={styles.sub}>Revisa los detalles de tu estadía antes de confirmar.</Text>

        <View style={styles.stepper}>
          <Paso n={1} label="Elige fechas" estado="hecho" />
          <View style={styles.linea} />
          <Paso n={2} label="Pago" estado="actual" />
          <View style={styles.linea} />
          <Paso n={3} label="Comprobante" estado="pendiente" />
        </View>

        {!borrador ? (
          <>
            <Alert tone="error">
              No hay información de reserva disponible. Por favor, inicia el proceso desde la página de la finca.
            </Alert>
            <Button title="Regresar al inicio" variant="secondary" onPress={() => router.navigate('/')} />
          </>
        ) : !usuario ? (
          <Alert tone="error">Debes iniciar sesión para completar la reserva.</Alert>
        ) : (
          <>
            {!!error && <Alert tone="error">{error}</Alert>}
            <View style={styles.card}>
              <View style={styles.resumenHead}>
                <FincaImage uri={borrador.fincaImagen} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.finca}>{borrador.fincaNombre}</Text>
                  {!!borrador.municipio && <Text style={styles.muni}>{borrador.municipio}</Text>}
                </View>
              </View>
              <Fila k="Entrada" v={fechaMedia(borrador.fechaEntrada)} />
              <Fila k="Salida" v={fechaMedia(borrador.fechaSalida)} />
              <Fila k="Noches" v={String(borrador.noches)} />
              <Fila k="Huéspedes" v={String(borrador.huespedes)} />
              <Fila k="Precio por noche" v={formatCOP(borrador.precioNoche)} />
              <View style={styles.total}>
                <Text style={styles.totalK}>Total a pagar</Text>
                <Text style={[styles.totalV, Type.num]}>{formatCOP(borrador.montoTotal)}</Text>
              </View>
              <View style={styles.sello}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.secondary} />
                <Text style={styles.selloTxt}>Pago protegido · Recibirás un comprobante oficial</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Información de pago</Text>
              <Select
                label="Método de pago"
                value={metodo}
                options={metodos.map((m) => ({ label: m.NombreMetodoDePago, value: m.IdMetodoDePago }))}
                onChange={setMetodo}
                placeholder="Cargando métodos…"
              />
              <Alert tone="info">
                <Text style={{ fontFamily: Fonts.bold }}>Nota importante:</Text> Esta es una simulación académica. No se procesará ningún pago real. Al confirmar, se creará tu reserva en el sistema.
              </Alert>
              <Checkbox
                label="Acepto los términos y condiciones del servicio de reserva"
                checked={acepta}
                onChange={setAcepta}
                error={intento && !acepta ? 'Debes aceptar los términos y condiciones' : undefined}
              />
              <View style={styles.botones}>
                <Button title="Cancelar" variant="secondary" onPress={volver} />
                <Button
                  title={procesando ? 'Procesando…' : 'Confirmar reserva'}
                  size="lg"
                  icon="lock-closed"
                  loading={procesando}
                  disabled={!acepta}
                  onPress={confirmar}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Paso({ n, label, estado }: { n: number; label: string; estado: 'hecho' | 'actual' | 'pendiente' }) {
  return (
    <View style={styles.paso}>
      <View style={[styles.circulo, estado === 'hecho' && styles.cHecho, estado === 'actual' && styles.cActual, estado === 'pendiente' && styles.cPend]}>
        {estado === 'hecho' ? (
          <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
        ) : (
          <Text style={[styles.cNum, Type.num, estado === 'pendiente' && { color: Colors.textSecondary }]}>{n}</Text>
        )}
      </View>
      <Text style={[styles.pasoTxt, estado === 'hecho' && { color: Colors.secondary }]}>{label}</Text>
    </View>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.k}>{k}</Text>
      <Text style={[styles.v, Type.num]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.surfaceBase },
  scroll: { padding: 16, gap: 14 },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, alignSelf: 'flex-start' },
  volverTxt: { fontFamily: Fonts.semibold, fontSize: 14.4, color: Colors.textSecondary },
  h1: { ...Type.headline },
  sub: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, marginTop: -8 },
  stepper: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  paso: { alignItems: 'center', gap: 6, width: 84 },
  linea: { flex: 1, height: 2, backgroundColor: Colors.surfaceDark, marginTop: 13 },
  circulo: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cHecho: { backgroundColor: Colors.secondary },
  cActual: { backgroundColor: Colors.primary },
  cPend: { borderWidth: 2, borderColor: Colors.surfaceDark },
  cNum: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textInverse },
  pasoTxt: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.xl, padding: 20, gap: 10, ...Shadows.sm },
  cardTitle: { fontFamily: Fonts.semibold, fontSize: 19, color: Colors.textPrimary, marginBottom: 4 },
  resumenHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  thumb: { width: 88, height: 70, borderRadius: Radius.md },
  finca: { fontFamily: Fonts.semibold, fontSize: 17, color: Colors.textPrimary },
  muni: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  k: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary },
  v: { flex: 1, textAlign: 'right', fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textPrimary },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.surfaceMedium, paddingTop: 12, marginTop: 4 },
  totalK: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary },
  totalV: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.primary },
  sello: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.secondarySurface, borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: 12 },
  selloTxt: { flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: Colors.secondary },
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
});
