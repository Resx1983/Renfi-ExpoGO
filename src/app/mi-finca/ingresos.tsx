import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Card, Stat, panelStyles as ps } from '../../components/admin/PanelUI';
import { Badge } from '../../components/ui/Badge';
import { Alert, StateBlock } from '../../components/ui/Feedback';
import { esPagado, listarMisPagos, type PagoDueno } from '../../services/dueno.service';
import { Colors, Spacing, formatCOP } from '../../constants/theme';

export default function IngresosDueno() {
  const insets = useSafeAreaInsets();
  const [pagos, setPagos] = useState<PagoDueno[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    listarMisPagos().then((r) => {
      if (!alive) return;
      setPagos(r.data ?? []);
      setError(r.error ?? '');
    });
    return () => { alive = false; };
  }, []);

  if (!pagos) {
    return (
      <View style={styles.flex}>
        <AdminHeader slug="ingresos" panel="dueno" />
        <StateBlock loading title="Cargando ingresos…" />
      </View>
    );
  }

  const suma = (lista: PagoDueno[]) => lista.reduce((s, p) => s + Number(p.Monto ?? 0), 0);
  const porFinca = new Map<string, { cobrado: number; pendiente: number }>();
  for (const p of pagos) {
    const nombre = p.NombreFinca ?? 'Sin finca';
    const f = porFinca.get(nombre) ?? { cobrado: 0, pendiente: 0 };
    f[esPagado(p) ? 'cobrado' : 'pendiente'] += Number(p.Monto ?? 0);
    porFinca.set(nombre, f);
  }

  return (
    <View style={styles.flex}>
      <AdminHeader slug="ingresos" panel="dueno" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {!!error && <Alert tone="error">{error}</Alert>}
        <View style={styles.grid}>
          <Stat title="Cobrado" value={formatCOP(suma(pagos.filter(esPagado)))} desc="Pagos recibidos" />
          <Stat title="Pendiente" value={formatCOP(suma(pagos.filter((p) => !esPagado(p))))} desc="Por cobrar o en revisión" />
        </View>

        <Card>
          <Text style={ps.title}>Por finca</Text>
          {porFinca.size === 0 ? (
            <Text style={ps.sub}>Aún no hay pagos.</Text>
          ) : (
            [...porFinca].sort((a, b) => b[1].cobrado - a[1].cobrado).map(([nombre, v]) => (
              <View key={nombre} style={styles.fila}>
                <Text style={ps.strong}>{nombre}</Text>
                <Text style={ps.sub}>Cobrado {formatCOP(v.cobrado)} · Pendiente {formatCOP(v.pendiente)}</Text>
              </View>
            ))
          )}
        </Card>

        <Card>
          <Text style={ps.title}>Pagos recibidos</Text>
          {pagos.length === 0 ? (
            <Text style={ps.sub}>Sin pagos para mostrar.</Text>
          ) : (
            pagos.map((p) => (
              <View key={p.IdPago} style={styles.fila}>
                <View style={ps.spread}>
                  <Text style={ps.strong}>#{p.IdPago} · {formatCOP(p.Monto)}</Text>
                  <Badge label={p.EstadoPago ?? '—'} variant={esPagado(p) ? 'success' : 'warning'} />
                </View>
                <Text style={ps.sub}>{[p.NombreFinca, p.NombreMetodoDePago, String(p.FechaPago ?? '').slice(0, 10)].filter(Boolean).join(' · ')}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },
  content: { padding: Spacing.gutter, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fila: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.surfaceMedium },
});
