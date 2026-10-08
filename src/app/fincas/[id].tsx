import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader } from '../../components/AppHeader';
import { FincaImage } from '../../components/Brand';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Alert, StateBlock } from '../../components/ui/Feedback';
import { ReservaCalendar, diasOcupados, hayConflicto, sumarDias, fechaMedia } from '../../components/ReservaCalendar';
import { useAuth } from '../../context/AuthContext';
import { obtenerFincaPorId } from '../../services/fincas.service';
import { listarReservasPorFinca } from '../../services/reservas.service';
import { checkout } from '../../services/checkout';
import { Colors, Radius, Fonts, Shadows, Type, formatCOP } from '../../constants/theme';
import type { Finca, Reserva } from '../../types';

type IconName = keyof typeof Ionicons.glyphMap;

export default function DetalleFinca() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  const [finca, setFinca] = useState<Finca | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [img, setImg] = useState(0);
  const [rotas, setRotas] = useState<string[]>([]);

  const [fecha, setFecha] = useState<string | null>(null);
  const [nochesTxt, setNochesTxt] = useState('1');
  const [huespedesTxt, setHuespedesTxt] = useState('1');
  const [intento, setIntento] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([obtenerFincaPorId(Number(id)), listarReservasPorFinca(Number(id))]).then(([f, r]) => {
      if (!alive) return;
      if (f.error || !f.data) setError(f.error ? 'Ocurrió un error al cargar la finca. Intenta de nuevo más tarde.' : 'No se encontró la finca seleccionada.');
      else setFinca(f.data);
      setReservas(r.data ?? []);
      setCargando(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const ocupados = useMemo(() => diasOcupados(reservas), [reservas]);
  const imagenes = useMemo(
    () => (finca?.Imagenes ?? []).map((i) => i.UrlImagen).filter((u) => !!u && !rotas.includes(u)),
    [finca, rotas]
  );
  const actual = Math.min(img, Math.max(imagenes.length - 1, 0));

  const noches = Number(nochesTxt);
  const nochesOk = Number.isInteger(noches) && noches >= 1 && noches <= 365;
  const nochesErr = !nochesOk ? (noches > 365 ? 'El número de noches debe estar entre 1 y 365.' : 'Indica al menos una noche de reserva.') : '';
  const cap = finca?.Capacidad ?? 1;
  const huespedes = Number(huespedesTxt);
  const huespedesErr =
    !Number.isInteger(huespedes) || huespedes < 1
      ? 'Ingresa un número válido de huéspedes'
      : huespedes > cap
        ? `Capacidad máxima: ${cap} huéspedes`
        : '';
  const conflicto = !!fecha && nochesOk && hayConflicto(fecha, noches, ocupados);
  const salida = fecha && nochesOk ? sumarDias(fecha, noches) : null;
  const total = (finca?.Precio ?? 0) * (nochesOk ? noches : 0);
  const valido = !!fecha && nochesOk && !huespedesErr && !conflicto;

  const irAlPago = () => {
    setIntento(true);
    setErrorEnvio('');
    if (!usuario) return setErrorEnvio('Debes iniciar sesión para reservar esta finca.');
    if (!fecha) return setErrorEnvio('Selecciona una fecha de entrada válida.');
    if (!valido || !salida || !finca) return setErrorEnvio('Por favor completa todos los campos requeridos correctamente.');
    checkout.setBorrador({
      fincaId: finca.IdFinca,
      fincaNombre: finca.NombreFinca,
      municipio: finca.NombreMunicipio ?? '',
      fincaImagen: finca.Imagenes?.[0]?.UrlImagen ?? null,
      precioNoche: finca.Precio,
      fechaEntrada: fecha,
      fechaSalida: salida,
      noches,
      huespedes,
      montoTotal: total,
    });
    router.push('/reserva/pago');
  };

  const Body = () => {
    if (cargando) return <StateBlock loading title="Cargando información de la finca…" />;
    if (!finca) {
      return (
        <StateBlock
          icon="home-outline"
          title="No se encontró la finca seleccionada."
          text={error.startsWith('Ocurrió') ? error : undefined}
          action={{ title: 'Regresar al inicio', onPress: () => router.navigate('/') }}
        />
      );
    }
    const n = reservas.length;
    const rating = Number(finca.Calificacion) || 0;
    const propietario = [finca.NombrePropietario, finca.ApellidoPropietario].filter(Boolean).join(' ');
    const disponible = finca.Estado === 'Disponible';
    const hayResponsable = !!(propietario || finca.TelefonoPropietario || finca.CorreoPropietario);
    const tiles: { icon: IconName; label: string; value: string }[] = [
      { icon: 'pricetag-outline', label: 'Precio/noche', value: formatCOP(finca.Precio) },
      { icon: 'people-outline', label: 'Capacidad', value: `${finca.Capacidad} huéspedes` },
    ];
    return (
      <>
        <Text style={styles.h1}>{finca.NombreFinca}</Text>
        <View style={styles.meta}>
          {rating > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={15} color={Colors.accent} />
              <Text style={[styles.ratingTxt, Type.num]}>{rating}/5</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaTxt}>
              {finca.Direccion || 'Dirección no disponible'} · {finca.NombreMunicipio || ''}
            </Text>
          </View>
          <Badge label={finca.Estado || 'Estado desconocido'} variant={disponible ? 'success' : 'warning'} dot={disponible} />
        </View>

        <View style={styles.galeria}>
          {imagenes.length ? (
            <Image
              source={{ uri: imagenes[actual] }}
              style={styles.imgMain}
              onError={() => setRotas((r) => [...r, imagenes[actual]])}
            />
          ) : (
            <FincaImage uri={null} style={styles.imgMain} />
          )}
          {imagenes.length > 1 && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Imagen anterior"
                style={[styles.arrow, { left: 16 }]}
                onPress={() => setImg((actual - 1 + imagenes.length) % imagenes.length)}
              >
                <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Imagen siguiente"
                style={[styles.arrow, { right: 16 }]}
                onPress={() => setImg((actual + 1) % imagenes.length)}
              >
                <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
              </Pressable>
              <View style={styles.contador}>
                <Text style={[styles.contadorTxt, Type.num]}>
                  {actual + 1} / {imagenes.length}
                </Text>
              </View>
            </>
          )}
        </View>
        {imagenes.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {imagenes.map((u, i) => (
              <Pressable key={u + i} accessibilityRole="button" accessibilityLabel={`Ver imagen ${i + 1}`} onPress={() => setImg(i)}>
                <Image source={{ uri: u }} style={[styles.thumb, i === actual && styles.thumbActive]} />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={styles.h2}>Sobre esta finca</Text>
        {!!finca.InformacionAdicional && <Text style={styles.info}>{finca.InformacionAdicional}</Text>}
        <View style={styles.tiles}>
          {tiles.map((t) => (
            <View key={t.label} style={styles.tile}>
              <View style={styles.tileIcon}>
                <Ionicons name={t.icon} size={20} color={Colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tileLabel}>{t.label}</Text>
                <Text style={[styles.tileValor, Type.num]}>{t.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.booking}>
          <Text style={styles.oculto} accessibilityRole="header">
            Reserva tu estadía
          </Text>
          <View style={styles.bookingTop}>
            <Text style={[styles.precio, Type.num]}>
              {formatCOP(finca.Precio)} <Text style={styles.precioNoche}>/ noche</Text>
            </Text>
            {rating > 0 && <Text style={[styles.ratingTxt, Type.num]}>{rating}/5</Text>}
          </View>
          {!usuario ? (
            <View style={styles.login}>
              <Text style={styles.loginTxt}>Inicia sesión para reservar esta finca y administrar tus estancias.</Text>
              <Button title="Iniciar sesión para reservar" fullWidth onPress={() => router.push('/iniciar-sesion')} />
              <Pressable accessibilityRole="link" style={styles.link} onPress={() => router.push('/registrarse')}>
                <Text style={styles.linkTxt}>¿No tienes cuenta? Crea una</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.intro}>
                Selecciona tu fecha de llegada y te llevaremos a la pasarela de pago para completar la reserva.
              </Text>
              <ReservaCalendar ocupados={ocupados} seleccionado={fecha} onSelect={setFecha} />
              {intento && !fecha && <Text style={styles.err}>Selecciona un día disponible para continuar.</Text>}
              {conflicto && <Text style={styles.err}>Algunas noches seleccionadas ya están reservadas.</Text>}
              <View style={styles.campos}>
                <Input
                  label="Noches"
                  keyboardType="numeric"
                  value={nochesTxt}
                  onChangeText={setNochesTxt}
                  error={nochesErr}
                  containerStyle={styles.campo}
                />
                <Input
                  label="Huéspedes"
                  keyboardType="numeric"
                  value={huespedesTxt}
                  onChangeText={setHuespedesTxt}
                  error={huespedesErr}
                  containerStyle={styles.campo}
                />
              </View>
              {!!fecha && (
                <View style={styles.resumen}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resLabel}>Entrada</Text>
                    <Text style={[styles.resValor, Type.num]}>{fechaMedia(fecha)}</Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={[styles.pillTxt, Type.num]}>
                      {nochesOk ? noches : 0} {noches === 1 ? 'noche' : 'noches'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.resLabel}>Salida</Text>
                    <Text style={[styles.resValor, Type.num]}>{salida ? fechaMedia(salida) : '—'}</Text>
                  </View>
                </View>
              )}
              {!!fecha && !salida && (
                <Alert tone="warning">La fecha de salida debe ser posterior a la de entrada. Verifica el número de noches.</Alert>
              )}
              <View style={styles.total}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total estimado</Text>
                  <Text style={[styles.totalValor, Type.num]}>{formatCOP(total)}</Text>
                </View>
                <Text style={[styles.desglose, Type.num]}>
                  {formatCOP(finca.Precio)} × {nochesOk ? noches : 0} {noches === 1 ? 'noche' : 'noches'}
                </Text>
              </View>
              <Text style={styles.nota}>El monto puede variar si el propietario modifica el precio antes de confirmar.</Text>
              {!!errorEnvio && <Alert tone="error">{errorEnvio}</Alert>}
              <Button
                title="Ir al pago seguro"
                size="lg"
                fullWidth
                disabled={intento && !valido}
                onPress={irAlPago}
              />
            </>
          )}
          <View style={styles.trust}>
            <View style={styles.seal}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.secondary} />
            </View>
            <Text style={styles.trustTxt}>Pago protegido · Comprobante oficial de reserva</Text>
          </View>
        </View>

        {hayResponsable && (
          <>
            <Text style={styles.h2}>Responsable de la finca</Text>
            <View style={styles.resp}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{(propietario || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                {!!propietario && <Text style={styles.respNombre}>{propietario}</Text>}
                {!!finca.TelefonoPropietario && (
                  <Pressable accessibilityRole="link" style={styles.contacto} onPress={() => Linking.openURL(`tel:${finca.TelefonoPropietario}`)}>
                    <Text style={[styles.contactoTxt, Type.num]}>{finca.TelefonoPropietario}</Text>
                  </Pressable>
                )}
                {!!finca.CorreoPropietario && (
                  <Pressable accessibilityRole="link" style={styles.contacto} onPress={() => Linking.openURL(`mailto:${finca.CorreoPropietario}`)}>
                    <Text style={styles.contactoTxt}>{finca.CorreoPropietario}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </>
        )}

        <Text style={styles.h2}>Información general</Text>
        <View>
          <Fila k="Municipio" v={finca.NombreMunicipio || 'No disponible'} />
          {!!finca.Estado && <Fila k="Estado" v={finca.Estado} />}
          {n > 0 ? (
            <Fila k="Reservas realizadas" v={String(n)} />
          ) : (
            <Text style={[styles.info, { marginTop: 10 }]}>Todavía no hay registros de reservas para esta finca.</Text>
          )}
        </View>
      </>
    );
  };

  return (
    <View style={styles.page}>
      <AppHeader />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <Pressable accessibilityRole="link" style={styles.volver} onPress={() => router.navigate('/')}>
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
          <Text style={styles.volverTxt}>Volver a las fincas</Text>
        </Pressable>
        {Body()}
      </ScrollView>
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
  scroll: { padding: 16 },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, alignSelf: 'flex-start' },
  volverTxt: { fontFamily: Fonts.semibold, fontSize: 14.4, color: Colors.textSecondary },
  h1: { ...Type.headline, marginTop: 6 },
  h2: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.secondary, marginTop: 28, marginBottom: 10 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 10, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  metaTxt: { fontFamily: Fonts.regular, fontSize: 14.4, color: Colors.textSecondary, flexShrink: 1 },
  ratingTxt: { fontFamily: Fonts.semibold, fontSize: 14.4, color: Colors.textPrimary },
  galeria: { borderRadius: Radius.xxl, overflow: 'hidden', backgroundColor: Colors.surfaceMedium, height: 260 },
  imgMain: { width: '100%', height: 260 },
  arrow: {
    position: 'absolute',
    top: 108,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  contador: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(8,28,21,0.72)', borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: 10 },
  contadorTxt: { color: Colors.textInverse, fontFamily: Fonts.semibold, fontSize: 13 },
  thumbs: { gap: 8, paddingVertical: 10 },
  thumb: { width: 88, height: 66, borderRadius: Radius.md, borderWidth: 2, borderColor: 'transparent', opacity: 0.72 },
  thumbActive: { borderColor: Colors.primary, opacity: 1 },
  info: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textSecondary, lineHeight: 25, marginBottom: 14 },
  tiles: { gap: 10 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 16 },
  tileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondarySurface, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  tileValor: { fontFamily: Fonts.semibold, fontSize: 15.5, color: Colors.textPrimary },
  booking: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.xl, padding: 24, marginTop: 28, ...Shadows.lg },
  oculto: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: Colors.surfaceMedium, paddingBottom: 16, marginBottom: 16 },
  precio: { fontFamily: Fonts.bold, fontSize: 24, color: Colors.primary },
  precioNoche: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  login: { alignItems: 'center', gap: 14 },
  loginTxt: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 23, color: Colors.textSecondary, textAlign: 'center' },
  link: { minHeight: 44, justifyContent: 'center' },
  linkTxt: { fontFamily: Fonts.semibold, fontSize: 14.4, color: Colors.primary, textDecorationLine: 'underline' },
  intro: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21, color: Colors.textSecondary, marginBottom: 14 },
  err: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.danger, marginTop: 8 },
  campos: { flexDirection: 'row', gap: 12, marginTop: 16 },
  campo: { flex: 1 },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceBase, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 },
  resLabel: { fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.5, color: Colors.textSecondary },
  resValor: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textPrimary, marginTop: 2 },
  pill: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10 },
  pillTxt: { fontFamily: Fonts.semibold, fontSize: 12.5, color: Colors.secondary },
  total: { borderTopWidth: 1, borderTopColor: Colors.surfaceMedium, paddingTop: 14, gap: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textPrimary },
  totalValor: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.secondary },
  desglose: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  nota: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 19, color: Colors.textSecondary, marginVertical: 12 },
  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  seal: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.secondarySurface, alignItems: 'center', justifyContent: 'center' },
  trustTxt: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  resp: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.secondarySurface, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.secondary },
  respNombre: { fontFamily: Fonts.semibold, fontSize: 16, color: Colors.textPrimary },
  contacto: { minHeight: 44, justifyContent: 'center' },
  contactoTxt: { fontFamily: Fonts.regular, fontSize: 14.4, color: Colors.textSecondary },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.surfaceMedium },
  k: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary },
  v: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textPrimary, textAlign: 'right', maxWidth: '60%' },
});
