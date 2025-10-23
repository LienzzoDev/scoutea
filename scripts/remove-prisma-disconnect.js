#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/players/[id]/scrape/route.ts',
  'src/app/api/admin/populate-scout-data/route.ts',
  'src/app/api/admin/populate-data/route.ts',
  'src/app/api/admin/populate-player-scouts/route.ts',
  'src/app/api/scout/players/[playerId]/route.ts',
  'src/app/api/scout/[id]/reports-detail/route.ts',
  'src/app/api/scout/[id]/portfolio/route.ts',
  'src/app/api/scout/stats/route.ts',
  'src/app/api/scout/reports/route.ts',
  'src/app/api/populate-data/route.ts',
  'src/app/api/reports/[id]/delete/route.ts',
  'src/app/api/reports/[id]/route.ts',
  'src/app/api/populate-scout/[id]/route.ts'
];

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove the finally block with prisma.$disconnect()
  const regex = /\s*} finally {\s*await prisma\.\$disconnect\(\)\s*}\s*$/m;

  if (regex.test(content)) {
    content = content.replace(regex, '\n  }\n}');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
});

console.log('\n✨ Done!');
