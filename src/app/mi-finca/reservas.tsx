import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Card, panelStyles as ps } from '../../components/admin/PanelUI';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert, ConfirmDialog, StateBlock } from '../../components/ui/Feedback';
import {
  cambiarEstadoReserva, estadoReserva, etiquetaReserva, listarMisReservas, puedeCambiar, type EstadoGestion, type ReservaDueno,
} from '../../services/dueno.service';
import { Colors, Spacing, formatCOP } from '../../constants/theme';

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'Activa', label: 'Por confirmar' },
  { id: 'Confirmada', label: 'Confirmadas' },
  { id: 'Finalizada', label: 'Finalizadas' },
  { id: 'Cancelada', label: 'Canceladas' },
];
const VARIANTE: Record<string, 'success' | 'danger' | 'warning' | 'default'> = { Confirmada: 'success', Cancelada: 'danger', Finalizada: 'default', Activa: 'warning' };
const ACCIONES: { estado: EstadoGestion; titulo: string }[] = [
  { estado: 'Confirmada', titulo: 'Confirmar' },
  { estado: 'Finalizada', titulo: 'Finalizar' },
  { estado: 'Cancelada', titulo: 'Cancelar' },
];

export default function ReservasDueno() {
  const insets = useSafeAreaInsets();
  const [reservas, setReservas] = useState<ReservaDueno[]>([]);
  const [filtro, setFiltro] = useState('todas');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [porCancelar, setPorCancelar] = useState<ReservaDueno | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const r = await listarMisReservas();
    setReservas(r.data ?? []);
    setError(r.error ?? '');
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const aplicar = async (r: ReservaDueno, estado: EstadoGestion) => {
    setOcupada(r.IdReserva);
    setError('');
    setAviso('');
    const res = await cambiarEstadoReserva(r.IdReserva, estado);
    setOcupada(null);
    if (res.error) return setError(res.error);
    setReservas((lista) => lista.map((x) => (x.IdReserva === r.IdReserva ? { ...x, Estado: estado } : x)));
    setAviso(`Reserva #${r.IdReserva}: ${estado.toLowerCase()}.`);
  };

  // Confirmar y finalizar son directos; cancelar pide confirmación
  const pedir = (r: ReservaDueno, estado: EstadoGestion) => (estado === 'Cancelada' ? setPorCancelar(r) : aplicar(r, estado));

  const visibles = filtro === 'todas' ? reservas : reservas.filter((r) => estadoReserva(r) === filtro);

  return (
    <View style={styles.flex}>
      <AdminHeader slug="reservas" panel="dueno" />
      <FlatList
        data={cargando ? [] : visibles}
        keyExtractor={(r) => String(r.IdReserva)}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        ListHeaderComponent={
          <View style={styles.head}>
            <View style={ps.row}>
              {FILTROS.map((f) => (
                <Button
                  key={f.id}
                  size="sm"
                  variant={filtro === f.id ? 'primary' : 'secondary'}
                  title={`${f.label} (${f.id === 'todas' ? reservas.length : reservas.filter((r) => estadoReserva(r) === f.id).length})`}
                  onPress={() => setFiltro(f.id)}
                />
              ))}
            </View>
            {!!error && <Alert tone="error">{error}</Alert>}
            {!!aviso && <Alert tone="success">{aviso}</Alert>}
          </View>
        }
        ListEmptyComponent={
          cargando ? <StateBlock loading title="Cargando reservas…" /> : <Card><StateBlock icon="calendar-outline" title="No hay reservas para mostrar" /></Card>
        }
        renderItem={({ item: r }) => (
          <Card>
            <View style={ps.spread}>
              <Text style={[ps.strong, styles.flex]}>{r.NombreFinca ?? `Finca ${r.IdFinca}`}</Text>
              <Badge label={etiquetaReserva(r)} variant={VARIANTE[estadoReserva(r)] ?? 'default'} />
            </View>
            <Text style={ps.sub}>
              #{r.IdReserva} · {[r.NombreCliente, r.ApellidoCliente].filter(Boolean).join(' ') || 'Cliente sin datos'}
            </Text>
            {!!(r.TelefonoCliente || r.CorreoCliente) && <Text style={ps.sub}>{[r.TelefonoCliente, r.CorreoCliente].filter(Boolean).join(' · ')}</Text>}
            <Text style={ps.num}>{String(r.FechaEntrada).slice(0, 10)} → {String(r.FechaSalida).slice(0, 10)} · {formatCOP(r.MontoReserva)}</Text>
            <View style={ps.row}>
              {ACCIONES.filter((a) => puedeCambiar(r, a.estado)).map((a) => (
                <Button
                  key={a.estado}
                  title={a.titulo}
                  size="sm"
                  variant={a.estado === 'Cancelada' ? 'dangerGhost' : 'secondary'}
                  disabled={ocupada !== null}
                  loading={ocupada === r.IdReserva}
                  onPress={() => pedir(r, a.estado)}
                />
              ))}
            </View>
          </Card>
        )}
      />
      <ConfirmDialog
        visible={!!porCancelar}
        danger
        icon="close-circle-outline"
        title={`¿Cancelar la reserva #${porCancelar?.IdReserva}?`}
        message="El cliente verá su reserva como cancelada. Esta acción no se puede deshacer."
        confirmText="Cancelar reserva"
        onCancel={() => setPorCancelar(null)}
        onConfirm={() => {
          const r = porCancelar;
          setPorCancelar(null);
          if (r) aplicar(r, 'Cancelada');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },
  content: { padding: Spacing.gutter, gap: 12 },
  head: { gap: 12, marginBottom: 4 },
});
