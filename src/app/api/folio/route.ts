import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Simple file-based lock mechanism to prevent race conditions during increments
const LOCK_FILE = path.join(process.cwd(), 'data', 'folio.lock')
const FOLIO_FILE = path.join(process.cwd(), 'data', 'last_folio.txt')
const INITIAL_FOLIO = 212192

async function acquireLock() {
  const start = Date.now()
  while (fs.existsSync(LOCK_FILE)) {
    if (Date.now() - start > 5000) throw new Error('Lock timeout')
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  fs.writeFileSync(LOCK_FILE, process.pid.toString())
}

function releaseLock() {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE)
  }
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    await acquireLock()

    let currentFolio = INITIAL_FOLIO
    if (fs.existsSync(FOLIO_FILE)) {
      const content = fs.readFileSync(FOLIO_FILE, 'utf8').trim()
      currentFolio = parseInt(content, 10) + 1
    }

    // Save the new folio
    fs.writeFileSync(FOLIO_FILE, currentFolio.toString(), 'utf8')
    
    releaseLock()

    return NextResponse.json({ folio: currentFolio })

  } catch (error: any) {
    releaseLock()
    console.error('Folio API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
