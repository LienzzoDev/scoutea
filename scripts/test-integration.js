// 🧪 SCRIPT DE PRUEBA DE INTEGRACIÓN
// ✅ PROPÓSITO: Verificar que la API consolidada funciona correctamente
// ✅ BENEFICIO: Detectar problemas antes de que los usuarios los vean

const { spawn } = require('child_process')

async function testIntegration() {
  console.log('🧪 Iniciando pruebas de integración...')
  console.log('=' .repeat(50))
  
  // 🚀 INICIAR SERVIDOR DE DESARROLLO
  console.log('🚀 Iniciando servidor de desarrollo...')
  const server = spawn('pnpm', ['run', 'dev'], {
    stdio: 'pipe',
    detached: false
  })
  
  // 🕒 ESPERAR A QUE EL SERVIDOR ESTÉ LISTO
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Ready') || output.includes('started server')) {
        console.log('✅ Servidor iniciado correctamente')
        resolve()
      }
    })
    
    // Timeout de seguridad
    setTimeout(resolve, 10000)
  })
  
  // 🧪 EJECUTAR PRUEBAS
  const tests = [
    {
      name: 'Página principal',
      url: 'http://localhost:3000',
      expectedStatus: 200
    },
    {
      name: 'API Players (sin auth)',
      url: 'http://localhost:3000/api/players',
      expectedStatus: 401 // Esperamos error de autenticación
    },
    {
      name: 'API Stats (sin auth)',
      url: 'http://localhost:3000/api/players/stats',
      expectedStatus: 401
    },
    {
      name: 'API Filters (sin auth)',
      url: 'http://localhost:3000/api/players/filters',
      expectedStatus: 401
    }
  ]
  
  let passedTests = 0
  let totalTests = tests.length
  
  for (const test of tests) {
    try {
      console.log(`🧪 Probando: ${test.name}...`)
      
      const response = await fetch(test.url)
      const status = response.status
      
      if (status === test.expectedStatus) {
        console.log(`   ✅ PASS - Status: ${status}`)
        passedTests++
      } else {
        console.log(`   ❌ FAIL - Expected: ${test.expectedStatus}, Got: ${status}`)
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`)
    }
  }
  
  // 📊 RESULTADOS
  console.log('')
  console.log('📊 RESULTADOS DE INTEGRACIÓN')
  console.log('=' .repeat(50))
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`)
  console.log(`📊 Porcentaje de éxito: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todas las pruebas de integración pasaron!')
    console.log('✅ La API consolidada está funcionando correctamente')
  } else {
    console.log('⚠️  Algunas pruebas fallaron, revisar configuración')
  }
  
  // 🛑 DETENER SERVIDOR
  console.log('')
  console.log('🛑 Deteniendo servidor de desarrollo...')
  server.kill('SIGTERM')
  
  // Esperar a que el servidor se cierre
  await new Promise((resolve) => {
    server.on('close', () => {
      console.log('✅ Servidor detenido correctamente')
      resolve()
    })
    
    // Timeout de seguridad
    setTimeout(() => {
      server.kill('SIGKILL')
      resolve()
    }, 5000)
  })
  
  console.log('')
  console.log('🎉 Pruebas de integración completadas.')
  
  return passedTests === totalTests
}

// 🚀 EJECUTAR PRUEBAS
testIntegration()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('💥 Error fatal en pruebas de integración:', error)
    process.exit(1)
  })