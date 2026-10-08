import React from 'react';
import { View, Text, ScrollView, Share, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppHeader } from '../../components/AppHeader';
import { Zocalo } from '../../components/Brand';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StateBlock } from '../../components/ui/Feedback';
import { fechaLarga, fechaCorta } from '../../components/ReservaCalendar';
import { checkout } from '../../services/checkout';
import { Colors, Fonts, Radius, Shadows, Type, formatCOP } from '../../constants/theme';

const hhmm = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fechaCorta(iso)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function Comprobante() {
  const insets = useSafeAreaInsets();
  const r = checkout.getResultado();

  if (!r) {
    return (
      <View style={styles.page}>
        <AppHeader />
        <StateBlock
          icon="receipt-outline"
          title="No encontramos una reserva reciente"
          text="Si realizaste un pago hace unos minutos, vuelve a intentar desde la finca seleccionada."
          action={{ title: 'Ir a Mi cuenta', onPress: () => router.replace('/mi-cuenta') }}
        />
      </View>
    );
  }

  const b = r.borrador;
  const fecha = fechaLarga(r.fechaPago.slice(0, 10));
  const compartir = () =>
    Share.share({
      message:
        `Comprobante de reserva Renfi #${r.idReserva}\n${b.fincaNombre} (${b.municipio})\n` +
        `Entrada: ${fechaLarga(b.fechaEntrada)}\nSalida: ${fechaLarga(b.fechaSalida)}\n` +
        `Noches: ${b.noches} · Huéspedes: ${b.huespedes}\nMonto pagado: ${formatCOP(b.montoTotal)} (${r.metodoPago})\nFecha de pago: ${fecha}`,
    });

  return (
    <View style={styles.page}>
      <AppHeader />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.head}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={28} color={Colors.secondary} />
          </View>
          <Text style={styles.h1}>¡Reserva confirmada!</Text>
          <Text style={styles.sub}>
            Hemos registrado tu pago y recibido la reserva. Te enviamos una copia a tu correo electrónico.
          </Text>
        </View>

        <View style={styles.ticket}>
          <View style={styles.ticketBody}>
            <Text style={styles.cardTitle}>Detalles de la reserva</Text>
            <Fila k="Número de reserva" v={`#${r.idReserva}`} punteada />
            <Fila k="Finca" v={b.fincaNombre} punteada />
            {!!b.municipio && <Fila k="Municipio" v={b.municipio} punteada />}
            <Fila k="Entrada" v={fechaLarga(b.fechaEntrada)} punteada />
            <Fila k="Salida" v={fechaLarga(b.fechaSalida)} punteada />
            <Fila k="Noches" v={String(b.noches)} punteada />
            <Fila k="Huéspedes" v={String(b.huespedes)} punteada />
            {!!r.aNombreDe.trim() && <Fila k="A nombre de" v={r.aNombreDe} />}
          </View>
          <Zocalo />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del pago</Text>
          <Fila k="Método" v={r.metodoPago || '—'} />
          <Fila k="Monto pagado" v={formatCOP(b.montoTotal)} />
          <Fila k="Referencia" v={r.idPago ? `PAGO-${r.idPago}` : '—'} />
          <Fila k="Fecha de pago" v={hhmm(r.fechaPago)} />
          <View style={styles.fila}>
            <Text style={styles.k}>Estado</Text>
            <Badge label="Pagado" variant="success" />
          </View>
        </View>

        {r.idFactura != null && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Factura</Text>
            <Fila k="Número de factura" v={String(r.idFactura)} />
            <Fila k="Fecha de emisión" v={hhmm(r.fechaPago)} />
            <Fila k="Total facturado" v={formatCOP(b.montoTotal)} />
          </View>
        )}

        <View style={styles.botones}>
          <Button title="Compartir" variant="secondary" icon="share-outline" onPress={compartir} />
          <Button title="Ver mis reservas" onPress={() => router.replace('/mi-cuenta')} />
        </View>
        <Text style={styles.nota}>
          Guardamos tu comprobante con fecha {fecha}. Puedes consultar y gestionar tu reserva desde el panel de “Mi cuenta”.
        </Text>
      </ScrollView>
    </View>
  );
}

function Fila({ k, v, punteada }: { k: string; v: string; punteada?: boolean }) {
  return (
    <View style={[styles.fila, punteada && styles.punteada]}>
      <Text style={styles.k}>{k}</Text>
      <Text style={[styles.v, Type.num]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.surfaceBase },
  scroll: { padding: 16, gap: 14 },
  head: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  check: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.secondarySurface, alignItems: 'center', justifyContent: 'center' },
  h1: { ...Type.headline, textAlign: 'center' },
  sub: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 23, color: Colors.textSecondary, textAlign: 'center' },
  ticket: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.xxl, overflow: 'hidden', ...Shadows.md },
  ticketBody: { padding: 20 },
  card: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.xl, padding: 20, gap: 10, ...Shadows.sm },
  cardTitle: { fontFamily: Fonts.semibold, fontSize: 19, color: Colors.textPrimary, marginBottom: 6 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  punteada: { paddingVertical: 10, borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: Colors.surfaceDark },
  k: { fontFamily: Fonts.regular, fontSize: 14.4, color: Colors.textSecondary },
  v: { flex: 1, textAlign: 'right', fontFamily: Fonts.semibold, fontSize: 14.4, color: Colors.textPrimary },
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  nota: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 19, color: Colors.textSecondary, textAlign: 'center' },
});
