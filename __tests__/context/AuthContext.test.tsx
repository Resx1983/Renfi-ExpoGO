import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

function ConsumerComponent() {
  const { usuario, cargando, setUsuario, cerrarSesion } = useAuth();

  if (cargando) {
    return <Text testID="loading">Cargando...</Text>;
  }

  return (
    <>
      <Text testID="user-name">{usuario ? usuario.NombreUsuario : 'Invitado'}</Text>
      <TouchableOpacity
        testID="btn-login"
        onPress={() =>
          setUsuario({
            NumeroDocumento: 1,
            IdRol: 1,
            NombreUsuario: 'Admin',
            ApellidoUsuario: 'Renfi',
            Telefono: null,
            Correo: 'admin@renfi.com',
            Estado: 'Activo',
            NombreRol: 'Administrador',
          })
        }
      >
        <Text>Iniciar Sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-logout" onPress={cerrarSesion}>
        <Text>Cerrar Sesión</Text>
      </TouchableOpacity>
    </>
  );
}

describe('AuthContext (con AsyncStorage Mocks)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  test('debe restaurar la sesión guardada desde AsyncStorage en el arranque', async () => {
    const sesionPrevia = {
      NumeroDocumento: 2,
      IdRol: 2,
      NombreUsuario: 'Carlos',
      ApellidoUsuario: 'Restrepo',
      Telefono: '3009998877',
      Correo: 'carlos@renfi.com',
      Estado: 'Activo',
      NombreRol: 'Cliente',
    };

    await AsyncStorage.setItem('@renfi_usuario_sesion', JSON.stringify(sesionPrevia));

    const { findByTestId } = await render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    const userName = await findByTestId('user-name');
    expect(userName.props.children).toBe('Carlos');
  });

  test('debe permitir iniciar sesión y persistir en AsyncStorage', async () => {
    const { findByTestId, getByTestId } = await render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    const userName = await findByTestId('user-name');
    expect(userName.props.children).toBe('Invitado');

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    const updatedUser = await findByTestId('user-name');
    expect(updatedUser.props.children).toBe('Admin');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@renfi_usuario_sesion',
      expect.stringContaining('Admin')
    );
  });

  test('debe limpiar la sesión y AsyncStorage al cerrar sesión', async () => {
    const sesionPrevia = {
      NumeroDocumento: 1,
      IdRol: 1,
      NombreUsuario: 'Admin',
      ApellidoUsuario: 'Renfi',
      Telefono: null,
      Correo: 'admin@renfi.com',
      Estado: 'Activo',
      NombreRol: 'Administrador',
    };

    await AsyncStorage.setItem('@renfi_usuario_sesion', JSON.stringify(sesionPrevia));

    const { findByTestId, getByTestId } = await render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    const userName = await findByTestId('user-name');
    expect(userName.props.children).toBe('Admin');

    await act(async () => {
      fireEvent.press(getByTestId('btn-logout'));
    });

    const clearedUser = await findByTestId('user-name');
    expect(clearedUser.props.children).toBe('Invitado');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@renfi_usuario_sesion');
  });
});

