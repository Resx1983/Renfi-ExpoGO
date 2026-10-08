import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Badge, estadoFincaVariant } from './ui/Badge';
import { StateBlock } from './ui/Feedback';
import { FincaImage } from './Brand';
import { Colors, Fonts, Radius, Shadows, Type, formatCOP } from '../constants/theme';
import type { Finca } from '../types';

export function FincaCard({ finca: f, width, onPress }: { finca: Finca; width?: number; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={f.NombreFinca}
      onPress={onPress ?? (() => router.push(`/fincas/${f.IdFinca}`))}
      style={[styles.card, width ? { width } : null]}
    >
      <View>
        <FincaImage uri={f.Imagenes?.[0]?.UrlImagen} style={styles.img} />
        <Badge label={f.Estado || 'Estado desconocido'} variant={estadoFincaVariant(f.Estado)} style={styles.badge} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{f.NombreFinca}</Text>
        <Text style={styles.place} numberOfLines={1}>
          <Text style={styles.placeBold}>{f.NombreMunicipio || 'Ubicación reservada'}</Text>
          {!!f.Direccion && ` · ${f.Direccion}`}
        </Text>
        {!!f.InformacionAdicional && <Text style={styles.desc} numberOfLines={2}>{f.InformacionAdicional}</Text>}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
            <Text style={[styles.metaText, Type.num]}>{f.Capacidad} huéspedes</Text>
          </View>
          {!!f.Calificacion && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={15} color={Colors.accent} />
              <Text style={[styles.metaText, Type.num]}>{f.Calificacion}/5</Text>
            </View>
          )}
        </View>
        <View style={styles.priceRow}>
          <Text style={[styles.price, Type.num]}>{formatCOP(f.Precio)}</Text>
          <Text style={styles.night}> /noche</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Skeleton({ width }: { width: number }) {
  const [o] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [o]);
  return (
    <Animated.View style={[styles.card, { width, opacity: o }]}>
      <View style={[styles.img, { backgroundColor: Colors.surfaceMedium }]} />
      <View style={styles.body}>
        <View style={[styles.bar, { width: '70%' }]} />
        <View style={[styles.bar, { width: '50%' }]} />
        <View style={[styles.bar, { width: '30%', height: 20 }]} />
      </View>
    </Animated.View>
  );
}

interface Props {
  fincas: Finca[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export function FincasRelevantes({ fincas, loading, error, onRetry }: Props) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(320, Math.round(width * 0.82));
  const step = cardW + 16;
  const list = useRef<FlatList<Finca>>(null);
  const [x, setX] = useState(0);

  const scrollBy = (d: number) => {
    list.current?.scrollToOffset({ offset: Math.max(0, x + d * width * 0.9), animated: true });
  };

  if (loading) {
    return (
      <View style={styles.skelRow}>
        {[0, 1, 2].map((i) => <Skeleton key={i} width={cardW} />)}
      </View>
    );
  }
  if (error) {
    return (
      <StateBlock
        icon="cloud-offline-outline"
        title="No pudimos conectar con el servidor"
        text="Hubo un problema al cargar las fincas disponibles. Revisa tu conexión o intenta de nuevo."
        action={{ title: 'Reintentar', onPress: onRetry }}
      />
    );
  }
  if (fincas.length === 0) {
    return (
      <StateBlock
        title="No hay fincas disponibles en este momento"
        text="Por ahora no hay fincas publicadas. Vuelve pronto para descubrir nuevas propiedades campestres en toda Colombia."
      />
    );
  }

  const maxX = Math.max(0, fincas.length * step + 16 - width);
  const atStart = x <= 4;
  const atEnd = x >= maxX - 4;
  return (
    <View>
      <View style={styles.arrows}>
        <Pressable accessibilityRole="button" accessibilityLabel="Anterior" disabled={atStart} onPress={() => scrollBy(-1)} style={[styles.arrow, atStart && styles.dis]}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Siguiente" disabled={atEnd} onPress={() => scrollBy(1)} style={[styles.arrow, atEnd && styles.dis]}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>
      <FlatList
        ref={list}
        data={fincas}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(f) => String(f.IdFinca)}
        snapToInterval={step}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => setX(e.nativeEvent.contentOffset.x)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
        renderItem={({ item }) => <FincaCard finca={item} width={cardW} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  skelRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, overflow: 'hidden' },
  bar: { height: 14, borderRadius: 7, backgroundColor: Colors.surfaceMedium },
  arrows: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, alignItems: 'center', justifyContent: 'center' },
  dis: { opacity: 0.4 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  card: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.surfaceMedium, overflow: 'hidden', ...Shadows.sm },
  img: { width: '100%', aspectRatio: 4 / 3, backgroundColor: Colors.surfaceMedium },
  badge: { position: 'absolute', top: 12, left: 12 },
  body: { padding: 16, gap: 8, flexGrow: 1 },
  name: { ...Type.title, fontSize: 18 },
  place: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  placeBold: { fontFamily: Fonts.semibold, color: Colors.textPrimary },
  desc: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  meta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 'auto', paddingTop: 12 },
  price: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.primary },
  night: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
});
