import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import IniciarSesionScreen from '../../src/app/iniciar-sesion';
import { iniciarSesion } from '../../src/services/auth.service';

const mockSetUsuario = jest.fn();

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null })); // expo-asset no está instalado en este entorno
jest.mock('../../src/services/auth.service', () => ({ iniciarSesion: jest.fn() }));
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ usuario: null, cargando: false, setUsuario: mockSetUsuario, cerrarSesion: jest.fn() }),
  esAdmin: (u: any) => Number(u?.IdRol) === 1,
}));

const usuario = { NumeroDocumento: 1, IdRol: 2, NombreUsuario: 'Ana', ApellidoUsuario: 'Paz', Correo: 'a@b.co', Estado: 'Activo' };

describe('IniciarSesionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  test('muestra errores de validación y no llama al servicio', async () => {
    await render(<IniciarSesionScreen />);
    await fireEvent.press(screen.getByText('Ingresar a la plataforma'));
    expect(await screen.findByText('Ingresa un correo electrónico válido.')).toBeTruthy();
    expect(screen.getByText('Ingresa tu contraseña (mínimo 6 caracteres).')).toBeTruthy();
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  test('muestra el error del servicio', async () => {
    (iniciarSesion as jest.Mock).mockResolvedValue({ data: null, error: 'Correo o contraseña incorrectos.' });
    await render(<IniciarSesionScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('tu@correo.com'), 'a@b.co');
    await fireEvent.changeText(screen.getByPlaceholderText('Tu contraseña'), 'secreto');
    await fireEvent.press(screen.getByText('Ingresar a la plataforma'));
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeTruthy();
    expect(mockSetUsuario).not.toHaveBeenCalled();
  });

  test('login exitoso guarda la sesión y redirige tras 900ms', async () => {
    (iniciarSesion as jest.Mock).mockResolvedValue({ data: usuario, error: null });
    await render(<IniciarSesionScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText('tu@correo.com'), 'a@b.co');
    await fireEvent.changeText(screen.getByPlaceholderText('Tu contraseña'), 'secreto');
    await fireEvent.press(screen.getByText('Ingresar a la plataforma'));

    await waitFor(() => expect(mockSetUsuario).toHaveBeenCalledWith(usuario));
    expect(iniciarSesion).toHaveBeenCalledWith('a@b.co', 'secreto');
    expect(screen.getByText('Inicio de sesión exitoso. Te estamos redirigiendo.')).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(900);
    });
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
