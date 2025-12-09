import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Resetting sequence only...')

  try {
    // 1. Get max ID
    const maxIdResult = await prisma.$queryRawUnsafe<{max: number}[]>(`SELECT MAX("displayId") as max FROM "equipos"`)
    const maxId = maxIdResult[0]?.max || 0
    console.log(`Max ID is ${maxId}`)

    // 2. Reset sequence
    // We use quotes to preserve case sensitivity: "equipos_displayId_seq"
    await prisma.$executeRawUnsafe(`SELECT setval('"equipos_displayId_seq"', ${maxId + 1}, false);`)
    console.log(`Sequence "equipos_displayId_seq" reset successfully to ${maxId + 1}.`)

  } catch (error) {
    console.error('Error resetting sequence:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
