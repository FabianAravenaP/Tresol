import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { env } from '@/lib/config'

// Whitelist of allowed tables for proxy access to prevent arbitrary DB access
const ALLOWED_TABLES = [
  'usuarios',
  'servicios',
  'servicios_asignados',
  'vehiculos',
  'historial_mecanico',
  'notificaciones',
  'activos',
  'ingresos_porteria',
  'cocina_recetas',
  'cocina_ingredientes',
  'cocina_minutas',
  'cocina_elecciones',
  'cocina_inventario',
  'maestro_personas',
  'solicitudes_vehiculos',
  'vehiculos_menores'
] as const


const proxySchema = z.object({
  table: z.enum(ALLOWED_TABLES as unknown as [string, ...string[]]),
  method: z.enum(['select', 'insert', 'update', 'delete']),
  data: z.any(),
  match: z.record(z.string(), z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
       return NextResponse.json({ error: 'Faltan variables de entorno de Supabase' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await request.json()
    const result_validation = proxySchema.safeParse(body)
    
    if (!result_validation.success) {
      return NextResponse.json({ 
        error: 'Solicitud inválida o tabla no permitida', 
        details: result_validation.error.format() 
      }, { status: 400 })
    }

    const { table, data, method, match } = result_validation.data
    const query = supabase.from(table)
    let result: { data?: any; error?: any }

    switch (method) {
      case 'select':
        let q = query.select(typeof data === 'string' ? data : '*')
        if (match) {
          Object.entries(match).forEach(([key, value]) => {
            q = q.eq(key, value)
          })
        }
        result = await q
        break

      case 'insert':
        // Logic for specific tables if needed
        const dataToInsert = Array.isArray(data) ? data : [data]
        if (table === 'servicios_asignados') {
          dataToInsert.forEach((item: any) => {
            if (!item.tipo_servicio) item.tipo_servicio = 'RETIRO'
          })
        }
        if (table === 'solicitudes_vehiculos') {
          // Users can only insert new PENDING requests — prevent state manipulation
          dataToInsert.forEach((item: any) => {
            if (item.estado_solicitud && item.estado_solicitud !== 'PENDIENTE') {
              item.estado_solicitud = 'PENDIENTE'
            }
            // Strip fields that only admins should set
            delete item.aprobado_por
            delete item.comentarios_admin
          })
        }
        result = await query.insert(dataToInsert).select()
        break

      case 'update':
        if (!match) return NextResponse.json({ error: 'Update requiere match' }, { status: 400 })
        result = await query.update(data).match(match).select()
        break

      case 'delete':
        if (!match || Object.keys(match).length === 0) {
           return NextResponse.json({ error: 'Delete requiere match de seguridad' }, { status: 400 })
        }
        let dq = query.delete()
        Object.entries(match).forEach(([key, value]) => {
          dq = dq.eq(key, value)
        })
        result = await dq
        break

      default:
        return NextResponse.json({ error: 'Método no soportado' }, { status: 405 })
    }

    if (result.error) {
       console.error(`Proxy DB Error [${method} on ${table}]:`, result.error)
       return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Proxy Fatal Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}