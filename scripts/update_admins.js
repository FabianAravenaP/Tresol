const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateAdminConfigs() {
  console.log('Fetching administrators...')
  const { data: admins, error: fetchError } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, config_sidebar')
    .in('rol', ['admin', 'master_admin'])

  if (fetchError) {
    console.error('Error fetching admins:', fetchError)
    return
  }

  console.log(`Found ${admins.length} administrators.`)

  const newModule = { id: "activos", name: "Gestión Activos", href: "/activos", type: "status", color: "bg-indigo-500" }

  for (const admin of admins) {
    let currentConfig = admin.config_sidebar || []
    if (!Array.isArray(currentConfig)) currentConfig = []

    const hasActivos = currentConfig.some(item => item.id === 'activos' || item.href === '/activos')

    if (!hasActivos) {
      console.log(`Updating config for ${admin.nombre} (${admin.rol})...`)
      const newConfig = [...currentConfig, newModule]
      
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ config_sidebar: newConfig })
        .eq('id', admin.id)

      if (updateError) {
        console.error(`Error updating ${admin.nombre}:`, updateError)
      } else {
        console.log(`Successfully updated ${admin.nombre}`)
      }
    } else {
      console.log(`Admin ${admin.nombre} already has Activos module.`)
    }
  }

  console.log('Done.')
}

updateAdminConfigs()
