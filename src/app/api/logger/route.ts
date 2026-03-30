import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Define path to the CSV file
    const dataDir = path.join(process.cwd(), 'data')
    const filePath = path.join(dataDir, 'registro_servicios.csv')

    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // CSV Headers
    const headers = [
      'Folio',
      'Fecha',
      'Empresa',
      'Planta',
      'Patente',
      'Chofer',
      'Categoria',
      'Cantidad',
      'Unidad',
      'Destino',
      'Contenedor',
      'Salida',
      'Observaciones'
    ]

    const exists = fs.existsSync(filePath)
    
    // Clean and format values for CSV (using semicolon for LatAm Excel)
    const safe = (v: any) => String(v == null ? '' : v).replace(/;/g, ',').replace(/\n/g, ' ').trim()

    const row = [
      safe(data.folio),
      safe(new Date().toLocaleDateString('es-CL')),
      safe(data.empresa),
      safe(data.planta_lugar),
      safe(data.patente),
      safe(data.nombre_conductor),
      safe(data.categoria),
      safe(data.valor),
      safe(data.unidad),
      safe(data.destino_tipo),
      safe(data.contenedor_tipo),
      safe(data.salida_pm),
      safe(data.observaciones)
    ].join(';')

    let content = ''
    if (!exists) {
      // Add UTF-8 BOM for Excel compatibility + Headers
      content = '\uFEFF' + headers.join(';') + '\r\n'
    }
    content += row + '\r\n'

    // Append to file
    fs.appendFileSync(filePath, content, 'utf8')

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Logger API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'registro_servicios.csv')
    
    if (!fs.existsSync(dataFile)) {
      return NextResponse.json({ comprobantes: [] })
    }

    const content = fs.readFileSync(dataFile, 'utf8')
    // Remove BOM if present
    const cleanContent = content.startsWith('\uFEFF') ? content.slice(1) : content
    
    const lines = cleanContent.split('\r\n').filter(l => l.trim() !== '')
    if (lines.length <= 1) return NextResponse.json({ comprobantes: [] })

    const headers = lines[0].split(';')
    const comprobantes = lines.slice(1).map((line, index) => {
      const values = line.split(';')
      const entry: any = { id: `csv-${index}` }
      headers.forEach((h, i) => {
        // Map headers to internal names if needed, or just use lowercase
        const key = h.toLowerCase().replace(/ /g, '_')
        entry[key] = values[i]
      })
      
      // Normalize specific fields for the UI
      return {
        ...entry,
        // UI expects 'folio', 'empresa', 'planta_lugar', 'fecha', 'patente', 'nombre_conductor'
        folio: entry.folio,
        fecha: entry.fecha,
        empresa: entry.empresa,
        planta_lugar: entry.planta,
        patente: entry.patente,
        nombre_conductor: entry.chofer,
        salida_pm: entry.salida,
        observaciones: entry.observaciones,
        categoria: entry.categoria,
        cantidad: entry.cantidad,
        unidad: entry.unidad,
        destino_tipo: entry.destino,
        contenedor_tipo: entry.contenedor
      }
    })

    return NextResponse.json({ comprobantes })

  } catch (error: any) {
    console.error('Logger API GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
