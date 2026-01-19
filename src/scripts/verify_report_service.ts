
import { prisma } from '@/lib/db'
import { ReportService } from '@/lib/services/report-service'

async function main() {
  console.log('🔄 Testing ReportService.searchReports with includeOrphans: true')

  const result = await ReportService.searchReports({
    page: 1,
    limit: 50,
    filters: {
      includeOrphans: true
    }
  })

  console.log(`📊 Total reports found: ${result.total}`)
  
  const orphanReports = result.reports.filter(r => r.player === null || r.id_player === null)
  console.log(`👻 Orphan reports found in result: ${orphanReports.length}`)

  if (orphanReports.length > 0) {
    console.log('✅ Success: Orphan reports are now included.')
    orphanReports.forEach(r => {
      console.log(`   - ID: ${r.id_report} | Player: ${r.player?.player_name || 'N/A'}`)
    })
  } else {
    console.log('❌ Failure: No orphan reports found (check if they actually exist in DB).')
  }
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect())
