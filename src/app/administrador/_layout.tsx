import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth, esAdmin } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';

export default function AdminLayout() {
  const { usuario, cargando } = useAuth();
  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceBase }}>
        <ActivityIndicator color={Colors.secondaryLight} />
      </View>
    );
  }
  if (!esAdmin(usuario)) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surfaceBase } }} />;
}
