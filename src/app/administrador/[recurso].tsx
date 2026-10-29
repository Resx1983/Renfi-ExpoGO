import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RecursoCrud } from '../../components/admin/RecursoCrud';
import { getRecurso } from '../../constants/adminResources';

export default function RecursoScreen() {
  const { recurso } = useLocalSearchParams<{ recurso: string }>();
  return <RecursoCrud cfg={getRecurso(recurso)} />;
}
