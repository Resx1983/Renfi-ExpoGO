import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from './AdminHeader';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert, ConfirmDialog, StateBlock } from '../ui/Feedback';
import { elegirFoto } from '../../services/fotos';
import {
  eliminarImagen, establecerPortada, listarImagenesFinca, obtenerFincaPorId, subirImagenFinca,
} from '../../services/fincas.service';
import type { Panel } from '../../constants/adminResources';
import { Colors, Fonts, Radius, Shadows, Spacing } from '../../constants/theme';
import type { Imagen } from '../../types';

const MAX_IMAGENES = 10;

export function ImagenesFinca({ id, panel = 'admin' }: Readonly<{ id?: string; panel?: Panel }>) {
  const idFinca = Number(id);
  const base = panel === 'dueno' ? '/mi-finca' : '/administrador';
  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState('');
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [porEliminar, setPorEliminar] = useState<Imagen | null>(null);

  const obtener = useCallback(async () => {
    const [finca, galeria] = await Promise.all([obtenerFincaPorId(idFinca), listarImagenesFinca(idFinca)]);
    return { nombre: finca.data?.NombreFinca ?? '', imagenes: galeria.data ?? [], error: finca.error || galeria.error || '' };
  }, [idFinca]);

  const aplicar = useCallback((r: Awaited<ReturnType<typeof obtener>>) => {
    setNombre(r.nombre);
    setImagenes(r.imagenes);
    setError(r.error);
    setCargando(false);
  }, []);

  const cargar = async () => aplicar(await obtener());

  useEffect(() => {
    if (!Number.isInteger(idFinca) || idFinca <= 0) return;
    let alive = true;
    obtener().then((r) => {
      if (alive) aplicar(r);
    });
    return () => {
      alive = false;
    };
  }, [idFinca, obtener, aplicar]);

  const agregar = async () => {
    setError('');
    const elegida = await elegirFoto();
    if (elegida.cancelado) return;
    if (elegida.error || !elegida.foto) return setError(elegida.error ?? 'No se pudo elegir la foto.');

    setSubiendo(true);
    const r = await subirImagenFinca(idFinca, elegida.foto.archivo);
    setSubiendo(false);
    if (r.error) return setError(r.error);
    await cargar();
  };

  const hacerPortada = async (img: Imagen) => {
    setError('');
    setOcupada(img.IdImagen);
    const r = await establecerPortada(img.IdImagen);
    setOcupada(null);
    if (r.error) return setError(r.error);
    await cargar();
  };

  const confirmarEliminar = async () => {
    if (!porEliminar) return;
    setOcupada(porEliminar.IdImagen);
    const r = await eliminarImagen(porEliminar.IdImagen);
    setOcupada(null);
    setPorEliminar(null);
    if (r.error) return setError(r.error);
    await cargar();
  };

  if (!Number.isInteger(idFinca) || idFinca <= 0) {
    return (
      <View style={styles.flex}>
        <AdminHeader slug="fincas" panel={panel} />
        <StateBlock
          icon="alert-circle-outline"
          title="Finca no válida"
          action={{ title: 'Volver a las fincas', onPress: () => router.replace(`${base}/fincas` as any) }}
        />
      </View>
    );
  }

  const lleno = imagenes.length >= MAX_IMAGENES;

  return (
    <View style={styles.flex}>
      <AdminHeader slug="fincas" panel={panel} />
      <FlatList
        data={cargando ? [] : imagenes}
        keyExtractor={(i) => String(i.IdImagen)}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        ListHeaderComponent={
          <View style={styles.toolbar}>
            <Text style={styles.h1}>Imágenes de la finca</Text>
            {!!nombre && <Text style={styles.sub}>{nombre}</Text>}
            <Text style={styles.count}>
              {imagenes.length} de {MAX_IMAGENES} imágenes · La portada es la primera foto que ven los clientes.
            </Text>
            <View style={styles.btns}>
              <Button title="Volver a fincas" variant="secondary" size="sm" icon="arrow-back" onPress={() => router.navigate(`${base}/fincas` as any)} />
              <Button
                title={subiendo ? 'Subiendo…' : 'Agregar foto'}
                size="sm"
                icon="image-outline"
                loading={subiendo}
                disabled={lleno || subiendo}
                onPress={agregar}
              />
            </View>
            {lleno && <Alert tone="warning">Alcanzaste el máximo de {MAX_IMAGENES} imágenes. Elimina alguna para subir otra.</Alert>}
            {!!error && <Alert tone="error">{error}</Alert>}
          </View>
        }
        ListEmptyComponent={
          cargando ? (
            <StateBlock loading title="Cargando imágenes…" />
          ) : (
            <View style={styles.card}>
              <StateBlock
                icon="images-outline"
                title="Esta finca todavía no tiene imágenes"
                text="Agrega una foto: la primera quedará como portada."
              />
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.UrlImagen }} style={styles.img} accessibilityLabel={item.TextoAlternativo ?? 'Imagen de la finca'} />
            <View style={styles.cardHead}>
              {item.EsPortada ? <Badge label="Portada" variant="success" /> : <Badge label={`Posición ${item.Orden ?? '—'}`} />}
              {!!item.Ancho && !!item.Alto && <Text style={styles.dim}>{item.Ancho} × {item.Alto}</Text>}
            </View>
            {!!item.TextoAlternativo && <Text style={styles.alt}>{item.TextoAlternativo}</Text>}
            <View style={styles.btns}>
              {!item.EsPortada && (
                <Button
                  title="Hacer portada"
                  variant="secondary"
                  size="sm"
                  disabled={ocupada !== null}
                  loading={ocupada === item.IdImagen}
                  onPress={() => hacerPortada(item)}
                />
              )}
              <Button title="Eliminar" variant="dangerGhost" size="sm" disabled={ocupada !== null} onPress={() => setPorEliminar(item)} />
            </View>
          </View>
        )}
      />

      <ConfirmDialog
        visible={!!porEliminar}
        danger
        icon="trash-outline"
        title="¿Eliminar esta imagen?"
        message={porEliminar?.EsPortada ? 'Es la portada: la siguiente imagen de la galería pasará a ser la portada. Esta acción no se puede deshacer.' : 'Esta acción no se puede deshacer.'}
        confirmText="Eliminar"
        loading={ocupada !== null && !!porEliminar && ocupada === porEliminar.IdImagen}
        onCancel={() => setPorEliminar(null)}
        onConfirm={confirmarEliminar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },
  content: { padding: Spacing.gutter, gap: 12 },
  toolbar: { gap: 10, marginBottom: 4 },
  h1: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.secondary },
  sub: { fontFamily: Fonts.semibold, fontSize: 16, color: Colors.textPrimary },
  count: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 10,
    ...Shadows.sm,
  },
  img: { width: '100%', height: 180, borderRadius: Radius.md, backgroundColor: Colors.surfaceMedium },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dim: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary },
  alt: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
});
