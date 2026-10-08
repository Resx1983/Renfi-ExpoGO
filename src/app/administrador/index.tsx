import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/ui/Button';
import { contarRegistros, listarRegistros, type Row } from '../../services/admin.service';
import { Badge } from '../../components/ui/Badge';
import { Colors, Fonts, Radius, Shadows, Spacing, Type, formatCOP } from '../../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const INDICADORES = [
  { icon: 'people-outline' as IconName, title: 'Usuarios activos', desc: 'Personas registradas en Renfi', table: 'Usuario', slug: 'usuarios' },
  { icon: 'home-outline' as IconName, title: 'Fincas registradas', desc: 'Inmuebles activos para reserva', table: 'Finca', slug: 'fincas' },
  { icon: 'calendar-outline' as IconName, title: 'Reservas totales', desc: 'Histórico de reservas realizadas', table: 'Reserva', slug: 'reservas' },
  { icon: 'card-outline' as IconName, title: 'Pagos registrados', desc: 'Transacciones históricas', table: 'Pago', slug: 'pagos' },
];

interface Datos {
  conteos: (number | null)[];
  top: { nombre: string; reservas: number; ingresos: number }[];
  pendientes: Row[];
}

async function cargar(): Promise<Datos> {
  const [conteos, reservas, fincas, pagos] = await Promise.all([
    Promise.all(INDICADORES.map((i) => contarRegistros(i.table))),
    listarRegistros('Reserva', 'IdReserva'),
    listarRegistros('Finca', 'IdFinca'),
    listarRegistros('Pago', 'IdPago'),
  ]);
  const nombres = new Map((fincas.data ?? []).map((f) => [f.IdFinca, f.NombreFinca]));
  const acc = new Map<number, { nombre: string; reservas: number; ingresos: number }>();
  for (const r of reservas.data ?? []) {
    const t = acc.get(r.IdFinca) ?? { nombre: nombres.get(r.IdFinca) ?? `Finca ${r.IdFinca}`, reservas: 0, ingresos: 0 };
    t.reservas += 1;
    t.ingresos += Number(r.MontoReserva) || 0;
    acc.set(r.IdFinca, t);
  }
  return {
    conteos: conteos.map((c) => c.data),
    top: [...acc.values()].sort((a, b) => b.reservas - a.reservas).slice(0, 5),
    pendientes: (pagos.data ?? []).filter((p) => p.EstadoPago !== 'Pagado'),
  };
}

export default function AdminInicio() {
  const insets = useSafeAreaInsets();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    cargar().then((d) => alive && setDatos(d));
    return () => { alive = false; };
  }, [version]);

  const actualizar = () => {
    setDatos(null);
    setVersion((v) => v + 1);
  };

  return (
    <View style={styles.flex}>
      <AdminHeader />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Button title="Actualizar datos" variant="secondary" size="sm" icon="refresh" onPress={actualizar} style={styles.toolbar} />

        <View style={styles.grid}>
          {INDICADORES.map((i, idx) => {
            const v = datos?.conteos[idx];
            return (
              <Pressable
                key={i.slug}
                accessibilityRole="link"
                style={styles.tile}
                onPress={() => router.push(`/administrador/${i.slug}` as Href)}
              >
                <View style={styles.tileHead}>
                  <View style={styles.tileIcon}>
                    <Ionicons name={i.icon} size={20} color={Colors.secondary} />
                  </View>
                  <Text style={styles.tileTitle} numberOfLines={2}>{i.title}</Text>
                </View>
                {!datos ? (
                  <ActivityIndicator color={Colors.secondaryLight} style={styles.spinner} />
                ) : v == null ? (
                  <View style={styles.badgeWrap}><Badge label="Sin datos" variant="danger" /></View>
                ) : (
                  <Text style={styles.value}>{v}</Text>
                )}
                <Text style={styles.desc}>{i.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        <Reporte titulo="Fincas más reservadas" desc="Ranking de fincas con mayor demanda en la plataforma." datos={datos}
          cols={['Finca', 'Reservas', 'Ingresos']}
          filas={datos?.top.map((t) => [t.nombre, String(t.reservas), formatCOP(t.ingresos)])} />
        <Reporte titulo="Pagos pendientes" desc="Pagos a revisar y aprobar por el equipo administrativo." datos={datos}
          cols={['#', 'Monto', 'Fecha', 'Estado']}
          filas={datos?.pendientes.map((p) => [`#${p.IdPago}`, formatCOP(p.Monto), String(p.FechaPago ?? '—').slice(0, 10), p.EstadoPago ?? '—'])} />
      </ScrollView>
    </View>
  );
}

function Reporte({ titulo, desc, datos, cols, filas }: Readonly<{ titulo: string; desc: string; datos: Datos | null; cols: string[]; filas?: string[][] }>) {
  return (
    <View style={styles.report}>
      <Text style={styles.reportTitle}>{titulo}</Text>
      <Text style={styles.reportDesc}>{desc}</Text>
      {!datos ? (
        <Text style={styles.empty}>Cargando información…</Text>
      ) : !filas?.length ? (
        <Text style={styles.empty}>Sin datos para mostrar en este momento.</Text>
      ) : (
        <View style={styles.table}>
          <View style={[styles.rowLine, styles.thead]}>
            {cols.map((c, j) => (
              <Text key={c} style={[styles.th, j === 0 && styles.cellFirst]} numberOfLines={1}>{c}</Text>
            ))}
          </View>
          {filas.map((f, i) => (
            <View key={i} style={styles.rowLine}>
              {f.map((c, j) => (
                <Text key={j} style={[styles.cell, j === 0 && styles.cellFirst]} numberOfLines={1}>{c}</Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },
  content: { padding: Spacing.gutter, gap: 16 },
  toolbar: { alignSelf: 'flex-end' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 6,
    ...Shadows.sm,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondarySurface, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { flex: 1, fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textPrimary },
  value: { ...Type.num, fontFamily: Fonts.bold, fontSize: 30, lineHeight: 38, color: Colors.secondary },
  spinner: { alignSelf: 'flex-start', height: 38 },
  badgeWrap: { height: 38, justifyContent: 'center', alignItems: 'flex-start' },
  desc: { fontFamily: Fonts.regular, fontSize: 13.6, color: Colors.textSecondary },
  report: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.xl, padding: 20, gap: 4, ...Shadows.sm },
  reportTitle: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.secondary },
  reportDesc: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  empty: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  table: { borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.md, overflow: 'hidden', marginTop: 4 },
  rowLine: { flexDirection: 'row', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: Colors.surfaceMedium, backgroundColor: Colors.surfaceLight },
  thead: { backgroundColor: Colors.surfaceBase, borderTopWidth: 0 },
  th: { ...Type.num, flex: 1, fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.5, color: Colors.textSecondary },
  cell: { ...Type.num, flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  cellFirst: { flex: 1.4, fontFamily: Fonts.semibold, color: Colors.textPrimary },
});
