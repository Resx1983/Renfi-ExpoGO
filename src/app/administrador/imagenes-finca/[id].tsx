import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ImagenesFinca } from '../../../components/admin/ImagenesFinca';

export default function ImagenesFincaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ImagenesFinca id={id} />;
}
