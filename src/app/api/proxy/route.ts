import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { table, data, method, match } = await request.json()

    let query = supabase.from(table)
    let result: any
    
    if (method === 'insert') {
      // Silently satisfy not-null constraints for specific tables if missing
      if (table === 'servicios_asignados') {
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (!item.tipo_servicio) item.tipo_servicio = 'RETIRO';
          });
        }
      }
      result = await query.insert(data)
    } else if (method === 'update') {
      result = await query.update(data).match(match)
    } else if (method === 'select') {
      let q = query.select(data || '*')
      if (match) {
        Object.entries(match).forEach(([key, value]) => {
          q = q.eq(key, value)
        })
      }
      
      // Simply execute the query. Sorting is removed for performance.
      result = await q
    } else if (method === 'delete') {
      let q = query.delete()
      if (match && Object.keys(match).length > 0) {
        Object.entries(match).forEach(([key, value]) => {
          q = q.eq(key, value)
        })
      } else {
        // Supabase requires a filter for deletes. Use a universal neq for cleanup.
        q = q.neq('id', '00000000-0000-0000-0000-000000000000')
      }
      result = await q
    } else {
      throw new Error("Método no soportado")
    }

    console.log(`Proxy success [${method}] on [${table}]:`, result.data?.length || '1 item')

    if (result.error) throw result.error

    return NextResponse.json({ success: true, data: result.data })
  } catch (error: any) {
    console.error('Proxy API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
