import React from 'react';
import { render, waitFor, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../src/app/(auth)/login';
import * as authService from '../../src/services/auth.service';
import { AuthProvider } from '../../src/context/AuthContext';
import { router } from 'expo-router';

jest.spyOn(Alert, 'alert');

describe('<LoginScreen /> (con Mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe validar campos vacíos e informar errores requeridos', async () => {
    const user = userEvent.setup();
    const screen = await render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    const botones = screen.getAllByText('Iniciar sesión');
    const botonLogin = botones[botones.length - 1];

    await user.press(botonLogin);

    await waitFor(() => {
      expect(screen.getByText('El correo es requerido.')).toBeTruthy();
      expect(screen.getByText('La contraseña es requerida.')).toBeTruthy();
    });
  });

  test('debe validar formato de correo electrónico incorrecto', async () => {
    const user = userEvent.setup();
    const screen = await render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    const inputEmail = screen.getByPlaceholderText('tu@correo.com');
    const inputPass = screen.getByPlaceholderText('••••••••');
    const botones = screen.getAllByText('Iniciar sesión');
    const botonLogin = botones[botones.length - 1];

    await user.type(inputEmail, 'correo-invalido');
    await user.type(inputPass, '123456');
    await user.press(botonLogin);

    await waitFor(() => {
      expect(screen.getByText('Ingresa un correo válido.')).toBeTruthy();
    });
  });

  test('debe llamar a iniciarSesion y redirigir a /(main)/home en login exitoso', async () => {
    const user = userEvent.setup();
    const spyLogin = jest.spyOn(authService, 'iniciarSesion').mockResolvedValueOnce({
      data: {
        NumeroDocumento: 1,
        IdRol: 1,
        NombreUsuario: 'Admin',
        ApellidoUsuario: 'Renfi',
        Telefono: null,
        Correo: 'admin@renfi.com',
        Estado: 'Activo',
        NombreRol: 'Administrador',
      },
      error: null,
    });

    const screen = await render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    const inputEmail = screen.getByPlaceholderText('tu@correo.com');
    const inputPass = screen.getByPlaceholderText('••••••••');
    const botones = screen.getAllByText('Iniciar sesión');
    const botonLogin = botones[botones.length - 1];

    await user.type(inputEmail, 'admin@renfi.com');
    await user.type(inputPass, 'admin123');
    await user.press(botonLogin);

    await waitFor(() => {
      expect(spyLogin).toHaveBeenCalledWith('admin@renfi.com', 'admin123');
      expect(router.replace).toHaveBeenCalledWith('/(main)/home');
    });
  });
});

