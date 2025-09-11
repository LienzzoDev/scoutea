#!/usr/bin/env node

const { exec } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('🚀 Scraping Manager - Scoutea')
console.log('='.repeat(50))

function showMenu() {
  console.log('\n📋 Opciones disponibles:')
  console.log('1. Probar con jugador específico')
  console.log('2. Probar con múltiples jugadores')
  console.log('3. Ejecutar scraping completo')
  console.log('4. Verificar progreso')
  console.log('5. Verificar datos extraídos')
  console.log('6. Debug de página')
  console.log('0. Salir')
  console.log('')
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`)
  console.log('─'.repeat(40))
  
  return new Promise((resolve, reject) => {
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`)
        reject(error)
      } else {
        console.log(stdout)
        if (stderr) console.error(stderr)
        resolve()
      }
    })
    
    // Mostrar output en tiempo real
    child.stdout.on('data', (data) => {
      process.stdout.write(data)
    })
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data)
    })
  })
}

async function main() {
  try {
    while (true) {
      showMenu()
      const choice = await askQuestion('Selecciona una opción (0-6): ')
      
      switch (choice) {
        case '1':
          const playerName = await askQuestion('Ingresa el nombre del jugador: ')
          if (playerName.trim()) {
            await runCommand(
              `node scripts/scrape-player-data.js "${playerName}"`,
              `Probando con ${playerName}`
            )
          }
          break
          
        case '2':
          await runCommand(
            'node scripts/test-multiple-players.js',
            'Probando con múltiples jugadores'
          )
          break
          
        case '3':
          const confirm = await askQuestion('¿Iniciar scraping completo? (s/n): ')
          if (confirm.toLowerCase() === 's' || confirm.toLowerCase() === 'y') {
            await runCommand(
              'node scripts/run-scraping-manager.js',
              'Ejecutando scraping completo'
            )
          }
          break
          
        case '4':
          await runCommand(
            'node scripts/run-scraping-manager.js --check',
            'Verificando progreso'
          )
          break
          
        case '5':
          await runCommand(
            'node scripts/verify-scraping-data.js',
            'Verificando datos extraídos'
          )
          break
          
        case '6':
          const debugPlayer = await askQuestion('Ingresa el nombre del jugador para debug: ')
          if (debugPlayer.trim()) {
            await runCommand(
              `node scripts/debug-player-page.js "${debugPlayer}"`,
              `Debug de ${debugPlayer}`
            )
          }
          break
          
        case '0':
          console.log('\n👋 ¡Hasta luego!')
          rl.close()
          process.exit(0)
          break
          
        default:
          console.log('❌ Opción no válida. Intenta de nuevo.')
      }
      
      if (choice !== '0') {
        await askQuestion('\nPresiona Enter para continuar...')
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    rl.close()
  }
}

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 ¡Hasta luego!')
  rl.close()
  process.exit(0)
})

main()
