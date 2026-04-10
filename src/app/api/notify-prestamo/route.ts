import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL_TO) {
    // Email not configured — fail silently so the main flow is unaffected
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    const body = await request.json()
    const { solicitante, vehiculo, motivo, glosa, fecha_inicio, fecha_fin } = body

    const vehiculoStr = vehiculo ? `${vehiculo.patente} — ${vehiculo.marca} ${vehiculo.modelo}` : 'Sin preferencia (asignar al aprobar)'
    const glosaHtml = (motivo === 'PERSONAL' && glosa)
      ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Glosa</td><td style="padding:6px 0;font-weight:700;">${glosa}</td></tr>`
      : ''

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#116CA2;padding:32px 40px;border-radius:16px 16px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-0.5px;">
            Nueva Solicitud de Vehículo
          </h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;font-weight:600;">
            Requiere revisión y aprobación en el panel admin.
          </p>
        </div>

        <div style="padding:32px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;">Solicitante</td>
              <td style="padding:6px 0;font-weight:700;font-size:14px;">${solicitante}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Vehículo</td>
              <td style="padding:6px 0;font-weight:700;font-size:14px;">${vehiculoStr}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Motivo</td>
              <td style="padding:6px 0;font-weight:700;font-size:14px;">${motivo}</td>
            </tr>
            ${glosaHtml}
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Retiro</td>
              <td style="padding:6px 0;font-weight:700;font-size:14px;">${fecha_inicio}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Devolución</td>
              <td style="padding:6px 0;font-weight:700;font-size:14px;">${fecha_fin}</td>
            </tr>
          </table>

          <div style="margin-top:28px;padding-top:24px;border-top:1px solid #f1f5f9;">
            <a
              href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tresol.vercel.app'}/admin/vehiculos_menores"
              style="display:inline-block;background:#116CA2;color:#ffffff;padding:14px 28px;border-radius:12px;font-weight:900;font-size:13px;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;"
            >
              Revisar en el Panel Admin
            </a>
          </div>

          <p style="margin-top:24px;font-size:11px;color:#9ca3af;">
            Tresol ERP · Notificación automática del módulo de Préstamo de Vehículos
          </p>
        </div>
      </div>
    `

    const recipients = process.env.NOTIFY_EMAIL_TO!
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)

    await resend.emails.send({
      from: process.env.NOTIFY_EMAIL_FROM || 'Tresol ERP <noreply@tresol.cl>',
      to: recipients,
      subject: `[Tresol] Nueva solicitud de vehículo — ${solicitante}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notify-prestamo] Error sending email:', err)
    // Don't propagate — the loan request already succeeded
    return NextResponse.json({ ok: true, error: 'Email failed silently' })
  }
}
