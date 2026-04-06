export interface Activo {
  id: string;
  codigo: string;
  tipo: string;
  categoria: string;
  nombre_tipo: string;
  capacidad: string | null;
  estado: 'OPERATIVO' | 'MANTENCION' | 'DESCARGADO';
  foto_url: string | null;
  created_at?: string;
}

export interface Vehiculo {
  id: string;
  patente: string;
  tipo: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  id_interno?: string;
  capacidad: string | null;
  estado: 'OPERATIVO' | 'MANTENCIÓN' | 'FALLA MECÁNICA';
  created_at?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  disposicion_final: string;
  created_at?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email?: string;
  rol: 'admin' | 'master_admin' | 'chofer' | 'cliente';
  avatar_url?: string;
}

export interface ServicioAsignado {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  tipo_servicio: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'anulado';
  chofer_id: string;
  vehiculo_id: string;
  bono_tipo_vehiculo?: string;
}

export interface Comprobante {
  id: string;
  folio_numero: string;
  empresa: string;
  planta_lugar: string;
  patente: string;
  servicio_id: string;
  cat_asimilables_kilos?: number;
  cat_lodos_kilos?: number;
  cat_escombros_kilos?: number;
  cat_peligrosos_kilos?: number;
  cat_industriales_kilos?: number;
  cat_valorizables_kilos?: number;
  observaciones?: string;
  fecha?: string;
  created_at: string;
}