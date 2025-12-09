
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting scout report count synchronization...')

  try {
    // 1. Get all scouts
    const scouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        scout_name: true,
        total_reports: true,
        original_reports: true
      }
    })

    console.log(`📊 Found ${scouts.length} scouts. Checking counts...`)

    let updatedCount = 0
    
    for (const scout of scouts) {
      // 2. Count actual reports
      const actualTotalReports = await prisma.reporte.count({
        where: { scout_id: scout.id_scout }
      })

      const actualOriginalReports = await prisma.reporte.count({
        where: { 
          scout_id: scout.id_scout,
          report_type: 'original'
        }
      })

      // 3. Compare and update if necessary
      const needsUpdate = 
        scout.total_reports !== actualTotalReports || 
        scout.original_reports !== actualOriginalReports

      if (needsUpdate) {
        console.log(`⚠️  Mismatch for ${scout.scout_name || scout.id_scout}:`)
        console.log(`   - Total: Stored ${scout.total_reports} vs Actual ${actualTotalReports}`)
        console.log(`   - Original: Stored ${scout.original_reports} vs Actual ${actualOriginalReports}`)

        await prisma.scout.update({
          where: { id_scout: scout.id_scout },
          data: {
            total_reports: actualTotalReports,
            original_reports: actualOriginalReports
          }
        })
        
        console.log(`✅ Updated ${scout.scout_name}`)
        updatedCount++
      }
    }

    console.log('-----------------------------------')
    console.log(`🏁 Synchronization complete.`)
    console.log(`📝 Updated ${updatedCount} scouts.`)

  } catch (error) {
    console.error('❌ Error during synchronization:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
