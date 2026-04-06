export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activos: {
        Row: {
          capacidad: string | null
          categoria: string
          codigo: string
          created_at: string | null
          estado: string
          foto_url: string | null
          id: string
          nombre_tipo: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          capacidad?: string | null
          categoria?: string
          codigo: string
          created_at?: string | null
          estado?: string
          foto_url?: string | null
          id?: string
          nombre_tipo?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidad?: string | null
          categoria?: string
          codigo?: string
          created_at?: string | null
          estado?: string
          foto_url?: string | null
          id?: string
          nombre_tipo?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bonos_produccion: {
        Row: {
          created_at: string | null
          id: string
          planta: string
          region: string
          tipo_vehiculo: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          planta: string
          region: string
          tipo_vehiculo: string
          valor: number
        }
        Update: {
          created_at?: string | null
          id?: string
          planta?: string
          region?: string
          tipo_vehiculo?: string
          valor?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ciudad: string | null
          created_at: string | null
          disposicion_final: string | null
          id: string
          nombre: string
          residuo: string | null
          rut: string | null
          tipo_contenedor: string | null
        }
        Insert: {
          ciudad?: string | null
          created_at?: string | null
          disposicion_final?: string | null
          id?: string
          nombre: string
          residuo?: string | null
          rut?: string | null
          tipo_contenedor?: string | null
        }
        Update: {
          ciudad?: string | null
          created_at?: string | null
          disposicion_final?: string | null
          id?: string
          nombre?: string
          residuo?: string | null
          rut?: string | null
          tipo_contenedor?: string | null
        }
        Relationships: []
      }
      cocina_elecciones: {
        Row: {
          confirmo_asistencia: boolean | null
          hora_eleccion: string | null
          id: string
          minuta_id: string | null
          no_asistira: boolean | null
          usuario_id: string | null
        }
        Insert: {
          confirmo_asistencia?: boolean | null
          hora_eleccion?: string | null
          id?: string
          minuta_id?: string | null
          no_asistira?: boolean | null
          usuario_id?: string | null
        }
        Update: {
          confirmo_asistencia?: boolean | null
          hora_eleccion?: string | null
          id?: string
          minuta_id?: string | null
          no_asistira?: boolean | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cocina_elecciones_minuta_id_fkey"
            columns: ["minuta_id"]
            isOneToOne: false
            referencedRelation: "cocina_minutas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocina_elecciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "maestro_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      cocina_ingredientes: {
        Row: {
          cantidad_por_persona: number
          id: string
          nombre: string
          receta_id: string | null
          unidad: string
        }
        Insert: {
          cantidad_por_persona: number
          id?: string
          nombre: string
          receta_id?: string | null
          unidad: string
        }
        Update: {
          cantidad_por_persona?: number
          id?: string
          nombre?: string
          receta_id?: string | null
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "cocina_ingredientes_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "cocina_recetas"
            referencedColumns: ["id"]
          },
        ]
      }
      cocina_inventario: {
        Row: {
          id: string
          nombre: string
          stock: number | null
          unidad: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          stock?: number | null
          unidad: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          stock?: number | null
          unidad?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cocina_minutas: {
        Row: {
          descripcion: string | null
          fecha: string
          id: string
          receta_id: string | null
        }
        Insert: {
          descripcion?: string | null
          fecha: string
          id?: string
          receta_id?: string | null
        }
        Update: {
          descripcion?: string | null
          fecha?: string
          id?: string
          receta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cocina_minutas_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "cocina_recetas"
            referencedColumns: ["id"]
          },
        ]
      }
      cocina_recetas: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      comprobantes: {
        Row: {
          ampm_ingreso: string | null
          cat_asimilables_kilos: number | null
          cat_asimilables_m3: number | null
          cat_escombros_kilos: number | null
          cat_escombros_m3: number | null
          cat_industriales_kilos: number | null
          cat_industriales_m3: number | null
          cat_lodos_kilos: number | null
          cat_lodos_m3: number | null
          cat_peligrosos_kilos: number | null
          cat_peligrosos_m3: number | null
          cat_valorizables_kilos: number | null
          cat_valorizables_m3: number | null
          contenedor_tipo: string | null
          created_at: string | null
          destino_tipo: string | null
          empresa: string | null
          estado: string | null
          fecha: string | null
          firma_url: string | null
          folio_numero: string | null
          hora_ingreso: string | null
          id: string
          km_salida: string | null
          nombre_conductor: string | null
          observaciones: string | null
          patente: string | null
          planta_lugar: string | null
          resolucion_numero: string | null
          salida_nombre: string | null
          salida_pm: string | null
          salida_rut: string | null
          servicio_id: string | null
          tipo_detalle: string | null
        }
        Insert: {
          ampm_ingreso?: string | null
          cat_asimilables_kilos?: number | null
          cat_asimilables_m3?: number | null
          cat_escombros_kilos?: number | null
          cat_escombros_m3?: number | null
          cat_industriales_kilos?: number | null
          cat_industriales_m3?: number | null
          cat_lodos_kilos?: number | null
          cat_lodos_m3?: number | null
          cat_peligrosos_kilos?: number | null
          cat_peligrosos_m3?: number | null
          cat_valorizables_kilos?: number | null
          cat_valorizables_m3?: number | null
          contenedor_tipo?: string | null
          created_at?: string | null
          destino_tipo?: string | null
          empresa?: string | null
          estado?: string | null
          fecha?: string | null
          firma_url?: string | null
          folio_numero?: string | null
          hora_ingreso?: string | null
          id?: string
          km_salida?: string | null
          nombre_conductor?: string | null
          observaciones?: string | null
          patente?: string | null
          planta_lugar?: string | null
          resolucion_numero?: string | null
          salida_nombre?: string | null
          salida_pm?: string | null
          salida_rut?: string | null
          servicio_id?: string | null
          tipo_detalle?: string | null
        }
        Update: {
          ampm_ingreso?: string | null
          cat_asimilables_kilos?: number | null
          cat_asimilables_m3?: number | null
          cat_escombros_kilos?: number | null
          cat_escombros_m3?: number | null
          cat_industriales_kilos?: number | null
          cat_industriales_m3?: number | null
          cat_lodos_kilos?: number | null
          cat_lodos_m3?: number | null
          cat_peligrosos_kilos?: number | null
          cat_peligrosos_m3?: number | null
          cat_valorizables_kilos?: number | null
          cat_valorizables_m3?: number | null
          contenedor_tipo?: string | null
          created_at?: string | null
          destino_tipo?: string | null
          empresa?: string | null
          estado?: string | null
          fecha?: string | null
          firma_url?: string | null
          folio_numero?: string | null
          hora_ingreso?: string | null
          id?: string
          km_salida?: string | null
          nombre_conductor?: string | null
          observaciones?: string | null
          patente?: string | null
          planta_lugar?: string | null
          resolucion_numero?: string | null
          salida_nombre?: string | null
          salida_pm?: string | null
          salida_rut?: string | null
          servicio_id?: string | null
          tipo_detalle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_asignados"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_porteria: {
        Row: {
          created_at: string | null
          empresa: string | null
          fecha: string | null
          hora_ingreso: string | null
          hora_salida: string | null
          id: string
          nombre_manual: string | null
          observacion: string | null
          patente: string | null
          persona_id: string | null
          porteria: string | null
        }
        Insert: {
          created_at?: string | null
          empresa?: string | null
          fecha?: string | null
          hora_ingreso?: string | null
          hora_salida?: string | null
          id?: string
          nombre_manual?: string | null
          observacion?: string | null
          patente?: string | null
          persona_id?: string | null
          porteria?: string | null
        }
        Update: {
          created_at?: string | null
          empresa?: string | null
          fecha?: string | null
          hora_ingreso?: string | null
          hora_salida?: string | null
          id?: string
          nombre_manual?: string | null
          observacion?: string | null
          patente?: string | null
          persona_id?: string | null
          porteria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_porteria_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "maestro_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      maestro_personas: {
        Row: {
          apellido: string
          cargo: string | null
          ciudad: string | null
          created_at: string | null
          direccion: string | null
          dv: string | null
          email: string | null
          empresa: string | null
          fecha_ingreso: string | null
          fecha_nacimiento: string | null
          fono: string | null
          id: string
          nombre: string
          patente_default: string | null
          rut: string | null
          tipo: string | null
        }
        Insert: {
          apellido: string
          cargo?: string | null
          ciudad?: string | null
          created_at?: string | null
          direccion?: string | null
          dv?: string | null
          email?: string | null
          empresa?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          fono?: string | null
          id?: string
          nombre: string
          patente_default?: string | null
          rut?: string | null
          tipo?: string | null
        }
        Update: {
          apellido?: string
          cargo?: string | null
          ciudad?: string | null
          created_at?: string | null
          direccion?: string | null
          dv?: string | null
          email?: string | null
          empresa?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          fono?: string | null
          id?: string
          nombre?: string
          patente_default?: string | null
          rut?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      registro_viajes: {
        Row: {
          created_at: string
          hito: string
          id: string
          latitud: number | null
          longitud: number | null
          notas: string | null
          servicio_id: string
        }
        Insert: {
          created_at?: string
          hito: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          notas?: string | null
          servicio_id: string
        }
        Update: {
          created_at?: string
          hito?: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          notas?: string | null
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_viajes_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_asignados"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_asignados: {
        Row: {
          bono_tipo_vehiculo: string | null
          carga: string | null
          chofer_id: string | null
          created_at: string
          destino: string | null
          estado: Database["public"]["Enums"]["viaje_status"]
          fecha: string
          id: string
          origen: string | null
          peoneta_id: string | null
          tipo_servicio: string
          vehiculo_id: string
        }
        Insert: {
          bono_tipo_vehiculo?: string | null
          carga?: string | null
          chofer_id?: string | null
          created_at?: string
          destino?: string | null
          estado?: Database["public"]["Enums"]["viaje_status"]
          fecha?: string
          id?: string
          origen?: string | null
          peoneta_id?: string | null
          tipo_servicio: string
          vehiculo_id: string
        }
        Update: {
          bono_tipo_vehiculo?: string | null
          carga?: string | null
          chofer_id?: string | null
          created_at?: string
          destino?: string | null
          estado?: Database["public"]["Enums"]["viaje_status"]
          fecha?: string
          id?: string
          origen?: string | null
          peoneta_id?: string | null
          tipo_servicio?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_asignados_chofer_id_fkey"
            columns: ["chofer_id"]
            isOneToOne: false
            referencedRelation: "maestro_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_asignados_peoneta_id_fkey"
            columns: ["peoneta_id"]
            isOneToOne: false
            referencedRelation: "maestro_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_asignados_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_vehiculos: {
        Row: {
          aprobado_por: string | null
          combustible_retorno: number | null
          combustible_salida: number | null
          comentarios_admin: string | null
          created_at: string | null
          danos_retorno_notas: string | null
          danos_salida_notas: string | null
          estado_solicitud: string
          fecha_fin: string
          fecha_inicio: string
          foto_tablero_retorno: string | null
          foto_tablero_salida: string | null
          fotos_danos_retorno: string[] | null
          fotos_danos_salida: string[] | null
          glosa_motivo: string | null
          id: string
          km_retorno: number | null
          km_salida: number | null
          limpieza: string | null
          motivo: string
          updated_at: string | null
          usuario_id: string | null
          vehiculo_id: string | null
        }
        Insert: {
          aprobado_por?: string | null
          combustible_retorno?: number | null
          combustible_salida?: number | null
          comentarios_admin?: string | null
          created_at?: string | null
          danos_retorno_notas?: string | null
          danos_salida_notas?: string | null
          estado_solicitud?: string
          fecha_fin: string
          fecha_inicio: string
          foto_tablero_retorno?: string | null
          foto_tablero_salida?: string | null
          fotos_danos_retorno?: string[] | null
          fotos_danos_salida?: string[] | null
          glosa_motivo?: string | null
          id?: string
          km_retorno?: number | null
          km_salida?: number | null
          limpieza?: string | null
          motivo: string
          updated_at?: string | null
          usuario_id?: string | null
          vehiculo_id?: string | null
        }
        Update: {
          aprobado_por?: string | null
          combustible_retorno?: number | null
          combustible_salida?: number | null
          comentarios_admin?: string | null
          created_at?: string | null
          danos_retorno_notas?: string | null
          danos_salida_notas?: string | null
          estado_solicitud?: string
          fecha_fin?: string
          fecha_inicio?: string
          foto_tablero_retorno?: string | null
          foto_tablero_salida?: string | null
          fotos_danos_retorno?: string[] | null
          fotos_danos_salida?: string[] | null
          glosa_motivo?: string | null
          id?: string
          km_retorno?: number | null
          km_salida?: number | null
          limpieza?: string | null
          motivo?: string
          updated_at?: string | null
          usuario_id?: string | null
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_vehiculos_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_vehiculos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "maestro_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_vehiculos_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          config_sidebar: Json | null
          created_at: string
          dv: string | null
          id: string
          nombre: string
          password: string | null
          rol: Database["public"]["Enums"]["user_role"]
          rut: string | null
        }
        Insert: {
          config_sidebar?: Json | null
          created_at?: string
          dv?: string | null
          id?: string
          nombre: string
          password?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          rut?: string | null
        }
        Update: {
          config_sidebar?: Json | null
          created_at?: string
          dv?: string | null
          id?: string
          nombre?: string
          password?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          rut?: string | null
        }
        Relationships: []
      }
      vehiculos: {
        Row: {
          activo: boolean
          categoria: string | null
          created_at: string
          estado: string | null
          id: string
          id_interno: string | null
          marca: string | null
          modelo: string | null
          patente: string
          reporte_falla_at: string | null
          resolucion_sanitaria: string | null
          tipo: string | null
          ultima_falla: string | null
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          id_interno?: string | null
          marca?: string | null
          modelo?: string | null
          patente: string
          reporte_falla_at?: string | null
          resolucion_sanitaria?: string | null
          tipo?: string | null
          ultima_falla?: string | null
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          id_interno?: string | null
          marca?: string | null
          modelo?: string | null
          patente: string
          reporte_falla_at?: string | null
          resolucion_sanitaria?: string | null
          tipo?: string | null
          ultima_falla?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_admin_v2: { Args: never; Returns: boolean }
      get_service_distance: { Args: { p_servicio_id: string }; Returns: number }
    }
    Enums: {
      user_role:
        | "admin_operaciones"
        | "chofer"
        | "peoneta"
        | "admin"
        | "operaciones"
        | "digitalizador"
        | "portero"
        | "master_admin"
      viaje_status:
        | "pendiente"
        | "en_ruta_origen"
        | "en_origen"
        | "en_ruta_destino"
        | "en_destino"
        | "completado"
        | "pausado_falla"
        | "anulado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: [
        "admin_operaciones",
        "chofer",
        "peoneta",
        "admin",
        "operaciones",
        "digitalizador",
        "portero",
        "master_admin",
      ],
      viaje_status: [
        "pendiente",
        "en_ruta_origen",
        "en_origen",
        "en_ruta_destino",
        "en_destino",
        "completado",
        "pausado_falla",
        "anulado",
      ],
    },
  },
} as const

// Helper types for easier access
export type TableRow<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TableInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TableUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

export type Vehiculo = TableRow<"vehiculos">
export type Usuario = TableRow<"usuarios">
export type Persona = TableRow<"maestro_personas">
export type SolicitudVehiculo = TableRow<"solicitudes_vehiculos">
export type BonoProduccion = TableRow<"bonos_produccion">