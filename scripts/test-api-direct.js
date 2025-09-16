const fetch = require('node-fetch');

async function testAPIDirect() {
  console.log('🌐 Probando API directamente...\n');

  const testPlayerId = 'cmfmeeqfb0001zweuke6bhyhp'; // Lionel Messi
  const apiUrl = `http://localhost:3000/api/players/${testPlayerId}`;

  try {
    console.log(`📡 Llamando a: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log(`✅ Response received`);
    console.log(`📋 Player Name: ${data.player_name || 'MISSING'}`);
    console.log(`📋 Player ID: ${data.id_player || 'MISSING'}`);
    console.log(`📋 Position: ${data.position_player || 'MISSING'}`);
    console.log(`📋 Age: ${data.age || 'MISSING'}`);
    console.log(`📋 Team: ${data.team_name || 'MISSING'}`);

    // Mostrar estructura completa (primeros campos)
    console.log('\n📦 Response structure (first 10 keys):');
    const keys = Object.keys(data).slice(0, 10);
    keys.forEach(key => {
      const value = data[key];
      const type = typeof value;
      const preview = type === 'string' ? `"${value}"` : 
                     type === 'object' && value !== null ? '[Object]' : 
                     String(value);
      console.log(`  ${key}: ${type} = ${preview}`);
    });

    console.log(`\n📊 Total fields: ${Object.keys(data).length}`);

  } catch (error) {
    console.error('❌ Error calling API:', error.message);
  }
}

testAPIDirect()
  .catch(console.error);