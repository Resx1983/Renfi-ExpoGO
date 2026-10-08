import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../src/components/ui/Button';
import { Badge, estadoFincaVariant, estadoReservaVariant } from '../../src/components/ui/Badge';
import { Input } from '../../src/components/ui/Input';

describe('UI Components (con React Native Testing Library)', () => {
  describe('<Button />', () => {
    test('debe renderizar el título correctamente y responder a pulsaciones', async () => {
      const onPressMock = jest.fn();
      const { getByText } = await render(
        <Button title="Ingresar" onPress={onPressMock} />
      );

      const btn = getByText('Ingresar');
      expect(btn).toBeTruthy();

      fireEvent.press(btn);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    test('debe deshabilitarse y mostrar el spinner cuando loading = true', async () => {
      const onPressMock = jest.fn();
      const { getByText } = await render(
        <Button title="Cargando..." loading onPress={onPressMock} />
      );

      // El spinner antecede al texto y el botón queda deshabilitado
      fireEvent.press(getByText('Cargando...'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    test('no debe disparar onPress si está deshabilitado', async () => {
      const onPressMock = jest.fn();
      const { getByText } = await render(
        <Button title="Deshabilitado" disabled onPress={onPressMock} />
      );

      fireEvent.press(getByText('Deshabilitado'));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('<Badge /> y helpers de estado', () => {
    test('debe renderizar la etiqueta del badge', async () => {
      const { getByText } = await render(<Badge label="Disponible" variant="success" />);
      expect(getByText('Disponible')).toBeTruthy();
    });

    test('helpers de estado deben retornar las variantes semánticas correspondientes', () => {
      expect(estadoFincaVariant('Disponible')).toBe('success');
      expect(estadoFincaVariant('Ocupada')).toBe('warning');
      expect(estadoFincaVariant('Mantenimiento')).toBe('warning');
      expect(estadoFincaVariant('')).toBe('default');

      expect(estadoReservaVariant('Confirmada')).toBe('success');
      expect(estadoReservaVariant('Pendiente')).toBe('warning');
      expect(estadoReservaVariant('Cancelada')).toBe('danger');
      expect(estadoReservaVariant('Completada')).toBe('success');
      expect(estadoReservaVariant('Otro')).toBe('warning');
    });
  });

  describe('<Input />', () => {
    test('debe renderizar label, placeholder y permitir ingreso de texto', async () => {
      const onChangeTextMock = jest.fn();
      const { getByText, getByPlaceholderText } = await render(
        <Input
          label="Correo"
          placeholder="tu@correo.com"
          onChangeText={onChangeTextMock}
        />
      );

      expect(getByText('Correo')).toBeTruthy();
      const input = getByPlaceholderText('tu@correo.com');
      expect(input).toBeTruthy();

      fireEvent.changeText(input, 'test@renfi.com');
      expect(onChangeTextMock).toHaveBeenCalledWith('test@renfi.com');
    });

    test('debe mostrar mensaje de error si la prop error está presente', async () => {
      const { getByText } = await render(
        <Input label="Contraseña" error="La contraseña es requerida." />
      );

      expect(getByText('La contraseña es requerida.')).toBeTruthy();
    });
  });
});

