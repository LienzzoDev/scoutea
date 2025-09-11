#!/usr/bin/env node

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function setupDatabase() {
  console.log('🗄️  Configuración de la Base de Datos Neon')
  console.log('==========================================\n')

  console.log('📋 Para obtener la URL de tu base de datos Neon:')
  console.log('1. Ve a https://console.neon.tech')
  console.log('2. Selecciona tu proyecto')
  console.log('3. Ve a "Connection Details"')
  console.log('4. Copia la "Connection String"')
  console.log('')

  const databaseUrl = await question('🔗 Ingresa la URL de la base de datos (postgresql://...): ')
  
  if (!databaseUrl.startsWith('postgresql://')) {
    console.log('❌ La URL debe empezar con "postgresql://"')
    rl.close()
    return
  }

  // Actualizar el archivo .env
  const fs = require('fs')
  const path = require('path')
  const envPath = path.join(process.cwd(), '.env')

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // Reemplazar las URLs de la base de datos
    envContent = envContent.replace(
      'DATABASE_URL="postgresql://username:password@host:port/database"',
      `DATABASE_URL="${databaseUrl}"`
    )
    
    envContent = envContent.replace(
      'DIRECT_URL="postgresql://username:password@host:port/database"',
      `DIRECT_URL="${databaseUrl}"`
    )
    
    fs.writeFileSync(envPath, envContent)
    console.log('✅ URLs de base de datos actualizadas en .env')
  }

  console.log('\n🎉 Configuración completada!')
  console.log('📋 Próximos pasos:')
  console.log('1. Ejecutar: pnpm run db:push')
  console.log('2. Verificar que la migración se haya aplicado correctamente')

  rl.close()
}

setupDatabase().catch(console.error)
