import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const content = formData.get('content') as string
    const filename = formData.get('filename') as string

    if (!content || !filename) {
      return new NextResponse("Faltan parámetros de descarga", { status: 400 })
    }

    // Force strict headers for an attachment download
    const response = new NextResponse(content)
    response.headers.set('Content-Type', 'text/csv; charset=utf-8')
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response
  } catch (error: any) {
    console.error('Error en API de descarga:', error)
    return new NextResponse("Error interno del servidor", { status: 500 })
  }
}
