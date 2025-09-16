const fs = require('fs');
const path = require('path');

function findMockPlayerIds() {
  console.log('🔍 Buscando IDs de jugadores mock en el código...\n');

  const problematicPatterns = [
    // Patrones que pueden indicar IDs mock
    /player\.id(?!_player)/g,  // player.id (sin _player)
    /\/member\/player\/\$\{[^}]*\.id\}/g,  // URLs con .id
    /Array\.from.*id:\s*i/g,  // Arrays generados con id: i
    /id:\s*\d+/g,  // id: número simple
  ];

  const filesToCheck = [
    'src/app/member/scout/[id]/page.tsx',
    'src/app/member/search/page.tsx',
    'src/components/player/PlayerTable.tsx',
    'src/components/layout/member-navbar.tsx',
    'src/app/admin/jugadores/page.tsx'
  ];

  let foundIssues = false;

  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📄 Revisando: ${filePath}`);
      
      problematicPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`  ⚠️  Patrón ${index + 1} encontrado: ${matches.length} coincidencias`);
          matches.forEach(match => {
            console.log(`    - ${match}`);
          });
          foundIssues = true;
        }
      });
      
      // Buscar líneas específicas con problemas
      const lines = content.split('\n');
      lines.forEach((line, lineNum) => {
        if (line.includes('player.id') && !line.includes('player.id_player')) {
          console.log(`  🚨 Línea ${lineNum + 1}: ${line.trim()}`);
          foundIssues = true;
        }
        if (line.includes('/member/player/') && line.includes('.id}') && !line.includes('.id_player}')) {
          console.log(`  🚨 Línea ${lineNum + 1}: ${line.trim()}`);
          foundIssues = true;
        }
      });
      
      console.log(`  ✅ Revisión completada\n`);
    } else {
      console.log(`  ❌ Archivo no encontrado: ${filePath}\n`);
    }
  });

  if (!foundIssues) {
    console.log('🎉 No se encontraron problemas con IDs de jugadores mock!');
  } else {
    console.log('⚠️  Se encontraron posibles problemas. Revisa los archivos mencionados.');
  }

  // Mostrar IDs válidos para referencia
  console.log('\n📋 IDs válidos para testing:');
  const validIds = [
    'cmfmeeqfb0001zweuke6bhyhp - Lionel Messi (RW)',
    'cmfmeeqgg0005zweuz9xrsvg0 - Erling Haaland (ST)',
    'cmfmeeqgb0002zweuhotgu0so - Luka Modric (CM)',
    'cmfmeeqgg0006zweuwi52syzd - Kevin De Bruyne (AM)',
    'cmfmeeqge0003zweuhorp7o1t - Kylian Mbappé (LW)',
    'cmfmeeqgf0004zweu8ncmex9l - Virgil van Dijk (CB)',
    'cmfmeeqgh0007zweu3607ildx - Thibaut Courtois (GK)',
    'cmfmeeq840000zweu3mconhte - Pedri González (CM)'
  ];

  validIds.forEach(id => {
    console.log(`  - ${id}`);
  });
}

findMockPlayerIds();