export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
       throw new Error('Supabase environment variables are missing in production environment.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const rawBody = await request.json();
    const { table, data, method, match } = rawBody as { 
      table: string; 
      data: any; 
      method: string; 
      match?: Record<string, string> 
    };

    const query = supabase.from(table)
    let result: { data?: unknown; error?: { message: string } | null }

    if (method === 'insert') {
      if (table === 'servicios_asignados') {
        const dataArray = Array.isArray(data) ? data : [data];
        dataArray.forEach((item: { tipo_servicio?: string }) => {
          if (!item.tipo_servicio) item.tipo_servicio = 'RETIRO';
        });
        result = await query.insert(dataArray).select()
      } else {
        result = await query.insert(data as Record<string, unknown>).select()
      }
    } else if (method === 'update') {
      if (!match) throw new Error("Update requiere match")
      result = await query.update(data as Record<string, unknown>).match(match).select()
    } else if (method === 'select') {
      let q = query.select((data as string) || '*')
      if (match) {
        Object.entries(match).forEach(([key, value]) => {
          q = q.eq(key, value)
        })
      }
      result = await q
    } else if (method === 'delete') {
      let q = query.delete()
      if (match && Object.keys(match).length > 0) {
        Object.entries(match).forEach(([key, value]) => {
          q = q.eq(key, value)
        })
      } else {
        q = q.neq('id', '00000000-0000-0000-0000-000000000000')
      }
      result = await q
    } else {
      throw new Error("Método no soportado")
    }

    const dataArray = Array.isArray(result.data) ? (result.data as unknown[]) : (result.data ? [result.data] : []);
    const dataLength = dataArray.length;
    console.log(`Proxy success [${method}] on [${table}]:`, dataLength, 'items');

    if (result.error) throw result.error

    return NextResponse.json({ success: true, data: result.data })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Proxy API error:', errorMsg)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}