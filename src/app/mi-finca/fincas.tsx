import React from 'react';
import { RecursoCrud } from '../../components/admin/RecursoCrud';
import { RECURSO_FINCA_DUENO } from '../../constants/adminResources';

export default function MisFincas() {
  return <RecursoCrud cfg={RECURSO_FINCA_DUENO} panel="dueno" />;
}
