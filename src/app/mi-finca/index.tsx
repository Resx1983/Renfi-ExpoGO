import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Card, Stat, panelStyles as ps } from '../../components/admin/PanelUI';
import { Button } from '../../components/ui/Button';
import { Alert, StateBlock } from '../../components/ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { listarMisFincas } from '../../services/admin.service';
import { estadoReserva, esPagado, listarMisPagos, listarMisReservas, type ReservaDueno, type PagoDueno } from '../../services/dueno.service';
import { Colors, Fonts, Spacing, formatCOP } from '../../constants/theme';

interface Datos {
  fincas: Record<string, any>[];
  reservas: ReservaDueno[];
  pagos: PagoDueno[];
}

export default function InicioDueno() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const [f, r, p] = await Promise.all([listarMisFincas(), listarMisReservas(), listarMisPagos()]);
      if (!alive) return;
      // Si reservas o pagos fallan no se tumba el resumen entero
      if (f.error) setError(f.error);
      setDatos({ fincas: f.data ?? [], reservas: r.data ?? [], pagos: p.data ?? [] });
    })();
    return () => { alive = false; };
  }, []);

  const go = (ruta: string) => router.push(ruta as Href);

  if (!datos) {
    return (
      <View style={styles.flex}>
        <AdminHeader panel="dueno" />
        <StateBlock loading title="Cargando tu resumen…" />
      </View>
    );
  }

  const { fincas, reservas, pagos } = datos;
  const disponibles = fincas.filter((f) => f.Estado === 'Disponible').length;
  const hoy = new Date().setHours(0, 0, 0, 0);
  const proximas = reservas
    .filter((r) => ['Activa', 'Confirmada'].includes(estadoReserva(r)) && new Date(r.FechaSalida).getTime() >= hoy)
    .sort((a, b) => new Date(a.FechaEntrada).getTime() - new Date(b.FechaEntrada).getTime())
    .slice(0, 5);
  const pasos = [
    { titulo: 'Publica tu primera finca', detalle: 'Nombre, municipio, precio por noche y capacidad.', hecho: fincas.length > 0, ruta: '/mi-finca/fincas', accion: 'Crear finca' },
    { titulo: 'Sube las fotos', detalle: 'Las fincas con fotos reciben muchas más reservas.', hecho: fincas.length > 0 && fincas.every((f) => (f.Imagenes?.length ?? 0) > 0), ruta: '/mi-finca/fincas', accion: 'Agregar fotos' },
    { titulo: 'Déjala disponible', detalle: 'Una finca en pausa no recibe reservas nuevas.', hecho: disponibles > 0, ruta: '/mi-finca/fincas', accion: 'Revisar' },
    { titulo: 'Recibe tu primera reserva', detalle: 'Aparecerá en Reservas para que la confirmes.', hecho: reservas.length > 0, ruta: '/mi-finca/reservas', accion: 'Ver reservas' },
  ];

  return (
    <View style={styles.flex}>
      <AdminHeader panel="dueno" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Text style={ps.title}>Hola{usuario?.NombreUsuario ? `, ${usuario.NombreUsuario}` : ''}</Text>
        {!!error && <Alert tone="error">{error}</Alert>}

        <View style={styles.grid}>
          <Stat title="Mis fincas" value={String(fincas.length)} desc={`${disponibles} disponibles`} />
          <Stat title="Por confirmar" value={String(reservas.filter((r) => estadoReserva(r) === 'Activa').length)} desc="Reservas esperando tu respuesta" />
          <Stat title="Cobrado" value={formatCOP(pagos.filter(esPagado).reduce((s, p) => s + Number(p.Monto ?? 0), 0))} desc="Pagos recibidos" />
        </View>

        {pasos.some((p) => !p.hecho) && (
          <Card>
            <Text style={ps.title}>Primeros pasos</Text>
            {pasos.map((p) => (
              <View key={p.titulo} style={[ps.spread, styles.paso]}>
                <View style={styles.flex}>
                  <Text style={[ps.strong, p.hecho && styles.hecho]}>{p.hecho ? '✓ ' : ''}{p.titulo}</Text>
                  <Text style={ps.sub}>{p.detalle}</Text>
                </View>
                {!p.hecho && <Button title={p.accion} size="sm" variant="secondary" onPress={() => go(p.ruta)} />}
              </View>
            ))}
          </Card>
        )}

        <Card>
          <Text style={ps.title}>Próximas reservas</Text>
          {proximas.length === 0 ? (
            <Text style={ps.sub}>Aún no tienes reservas próximas.</Text>
          ) : (
            proximas.map((r) => (
              <View key={r.IdReserva} style={styles.paso}>
                <Text style={ps.strong}>{r.NombreFinca ?? `Finca ${r.IdFinca}`}</Text>
                <Text style={ps.sub}>
                  {[r.NombreCliente, r.ApellidoCliente].filter(Boolean).join(' ') || 'Cliente'} · {String(r.FechaEntrada).slice(0, 10)} → {String(r.FechaSalida).slice(0, 10)}
                </Text>
              </View>
            ))
          )}
          <Button title="Ver todas las reservas" size="sm" variant="secondary" onPress={() => go('/mi-finca/reservas')} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },
  content: { padding: Spacing.gutter, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  paso: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.surfaceMedium },
  hecho: { color: Colors.secondaryLight, fontFamily: Fonts.medium },
});
