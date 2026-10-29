import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth, esAdmin, esDueno } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';

// Panel "Mi finca": dueños de finca y administrador (la API vuelve a validar el rol en cada petición)
export default function DuenoLayout() {
  const { usuario, cargando } = useAuth();
  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceBase }}>
        <ActivityIndicator color={Colors.secondaryLight} />
      </View>
    );
  }
  if (!esDueno(usuario) && !esAdmin(usuario)) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surfaceBase } }} />;
}
