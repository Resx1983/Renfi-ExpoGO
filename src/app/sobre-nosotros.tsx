import React from 'react';
import { View, Text, ScrollView, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { Zocalo } from '../components/Brand';
import { Button } from '../components/ui/Button';
import { Colors, Fonts, Radius, Type, WHATSAPP_URL } from '../constants/theme';

const VALORES: [keyof typeof Ionicons.glyphMap, string, string][] = [
  ['shield-checkmark-outline', 'Propiedades 100% verificadas', 'Inspeccionamos cada finca para asegurar fotos reales, servicios activos y anfitriones confiables.'],
  ['card-outline', 'Tarifas claras en COP', 'Precios en moneda local colombiana con pasarela de pago segura y sin comisiones ocultas.'],
  ['home-outline', 'Espacios campestres únicos', 'Fincas con piscina, zonas verdes, BBQ y privacidad total para descansar y celebrar en familia.'],
  ['leaf-outline', 'Desarrollo y turismo rural', 'Impulsamos el turismo sostenible y el empleo local en los municipios más bellos de Colombia.'],
];

export default function SobreNosotrosScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.page}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <View style={styles.band}>
          <Text accessibilityRole="header" style={styles.h1}>¿Quiénes somos?</Text>
          <Text style={styles.lead}>
            Renfi es la plataforma web colombiana para encontrar, reservar y disfrutar fincas de recreo y descanso en toda Colombia. Conectamos a familias, grupos de amigos y viajeros con espacios campestres verificados para vivir momentos inolvidables en la naturaleza, con tarifas transparentes y pagos seguros.
          </Text>
        </View>

        <View accessibilityLabel="Lo que nos define" style={styles.values}>
          {VALORES.map(([icon, t, d]) => (
            <View key={t} style={styles.row}>
              <View style={styles.circle}>
                <Ionicons name={icon} size={22} color={Colors.secondary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowT}>{t}</Text>
                <Text style={styles.rowP}>{d}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pledge}>
          <View style={styles.pledgeBody}>
            <Text accessibilityRole="header" style={styles.pledgeH}>Nuestro compromiso</Text>
            <Text style={styles.pledgeP}>
              Trabajamos con anfitriones y viajeros en todo el país para ofrecer una experiencia de hospedaje campestre cálida, confiable y accesible, desde el primer clic hasta la entrega de llaves.
            </Text>
            <Button title="Explorar fincas" size="lg" fullWidth onPress={() => router.push({ pathname: '/', params: { seccion: 'portafolio' } })} />
            <Button title="Escríbenos por WhatsApp" variant="onDark" size="lg" fullWidth onPress={() => Linking.openURL(WHATSAPP_URL)} />
          </View>
          <Zocalo />
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.surfaceBase },
  flex: { flex: 1 },
  band: { backgroundColor: Colors.surfaceLight, borderBottomWidth: 1, borderBottomColor: Colors.surfaceMedium, paddingHorizontal: 16, paddingVertical: 40, gap: 14 },
  h1: { ...Type.headline, fontSize: 32, lineHeight: 38 },
  lead: { fontFamily: Fonts.regular, fontSize: 18, lineHeight: 28, color: Colors.textSecondary },
  values: { paddingHorizontal: 16, paddingVertical: 24 },
  row: { flexDirection: 'row', gap: 16, paddingVertical: 20, borderTopWidth: 1, borderTopColor: Colors.surfaceMedium },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondarySurface, alignItems: 'center', justifyContent: 'center' },
  rowT: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary, marginBottom: 4 },
  rowP: { ...Type.body, fontSize: 15, lineHeight: 23 },
  pledge: { marginHorizontal: 16, marginBottom: 40, backgroundColor: Colors.secondary, borderRadius: Radius.xxl, overflow: 'hidden' },
  pledgeBody: { padding: 28, gap: 14 },
  pledgeH: { fontFamily: Fonts.bold, fontSize: 26, lineHeight: 30, color: Colors.textInverse },
  pledgeP: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 25, color: Colors.textOnDarkMuted, marginBottom: 6 },
});
