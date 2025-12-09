
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const scoutName = 'tech lienzzo'
  console.log(`🔍 Searching for scout: ${scoutName}`)

  const scout = await prisma.scout.findFirst({
    where: {
      OR: [
        { scout_name: { contains: scoutName, mode: 'insensitive' } },
        { name: { contains: scoutName, mode: 'insensitive' } }
      ]
    }
  })

  if (!scout) {
    console.log('❌ Scout not found')
    return
  }

  console.log(`✅ Found scout: ${scout.scout_name} (ID: ${scout.id_scout})`)
  console.log(`   Total Reports (DB): ${scout.total_reports}`)

  const reports = await prisma.reporte.findMany({
    where: { scout_id: scout.id_scout },
    include: {
      player: { select: { id_player: true, player_name: true } }
    }
  })

  console.log(`📊 Found ${reports.length} actual reports:`)
  reports.forEach(r => {
    console.log('--------------------------------------------------')
    console.log(`ID: ${r.id_report}`)
    console.log(`Date: ${r.report_date}`)
    console.log(`Status: ${r.report_status}`)
    console.log(`Validation: ${r.report_validation}`)
    console.log(`Type: ${r.report_type}`)
    console.log(`Approval Status: ${r.approval_status}`)
    console.log(`Player: ${r.player?.player_name || 'NULL'} (ID: ${r.id_player})`)
    console.log(`Author: ${r.report_author}`)
    console.log(`Created At: ${r.createdAt}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
