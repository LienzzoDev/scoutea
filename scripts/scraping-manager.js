#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const config = require('./scraping-config')

const prisma = new PrismaClient()

class ScrapingManager {
  constructor() {
    this.stats = {
      total: 0,
      processed: 0,
      withAgent: 0,
      withProfile: 0,
      errors: 0,
      startTime: null
    }
  }

  async run() {
    try {
      console.log('🚀 Iniciando Scraping Manager...')
      this.stats.startTime = new Date()
      
      // 1. Verificar estado inicial
      await this.checkInitialState()
      
      // 2. Ejecutar scraping
      await this.executeScraping()
      
      // 3. Mostrar resumen final
      await this.showFinalSummary()
      
    } catch (error) {
      console.error('❌ Error en Scraping Manager:', error)
    } finally {
      await prisma.$disconnect()
    }
  }

  async checkInitialState() {
    console.log('\n📊 Verificando estado inicial...')
    
    const players = await prisma.jugador.findMany({
      select: {
        url_trfm_advisor: true
      }
    })
    
    this.stats.total = players.length
    this.stats.withAgent = players.filter(p => p.url_trfm_advisor && p.url_trfm_advisor.includes('/berater/')).length
    this.stats.withProfile = players.filter(p => p.url_trfm_advisor && p.url_trfm_advisor.includes('/profil/spieler/')).length
    
    const withoutInfo = players.filter(p => !p.url_trfm_advisor).length
    
    console.log(`  Total de jugadores: ${this.stats.total}`)
    console.log(`  Con agente: ${this.stats.withAgent}`)
    console.log(`  Solo con perfil: ${this.stats.withProfile}`)
    console.log(`  Sin información: ${withoutInfo}`)
    
    if (withoutInfo === 0) {
      console.log('✅ Todos los jugadores ya tienen información')
      process.exit(0)
    }
  }

  async executeScraping() {
    console.log('\n🔍 Ejecutando scraping...')
    
    const { execSync } = require('child_process')
    
    try {
      execSync('node scripts/scrape-agent-urls.js', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutos timeout
      })
      console.log('✅ Scraping completado exitosamente')
    } catch (error) {
      console.error('❌ Error durante el scraping:', error.message)
      this.stats.errors++
    }
  }

  async showFinalSummary() {
    console.log('\n📈 Resumen final...')
    
    const players = await prisma.jugador.findMany({
      select: {
        url_trfm_advisor: true
      }
    })
    
    const finalWithAgent = players.filter(p => p.url_trfm_advisor && p.url_trfm_advisor.includes('/berater/')).length
    const finalWithProfile = players.filter(p => p.url_trfm_advisor && p.url_trfm_advisor.includes('/profil/spieler/')).length
    const finalWithoutInfo = players.filter(p => !p.url_trfm_advisor).length
    
    console.log(`  Con agente: ${finalWithAgent} (${this.stats.withAgent} → ${finalWithAgent})`)
    console.log(`  Solo con perfil: ${finalWithProfile} (${this.stats.withProfile} → ${finalWithProfile})`)
    console.log(`  Sin información: ${finalWithoutInfo}`)
    
    const newAgents = finalWithAgent - this.stats.withAgent
    const newProfiles = finalWithProfile - this.stats.withProfile
    
    console.log(`\n🎯 Mejoras obtenidas:`)
    console.log(`  Nuevos agentes: ${newAgents}`)
    console.log(`  Nuevos perfiles: ${newProfiles}`)
    
    if (this.stats.startTime) {
      const duration = new Date() - this.stats.startTime
      console.log(`  Tiempo total: ${Math.round(duration / 1000)}s`)
    }
    
    console.log('\n🎉 Scraping Manager completado!')
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const manager = new ScrapingManager()
  manager.run()
}

module.exports = ScrapingManager
