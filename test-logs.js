// Test rapide pour vérifier les logs
const fetch = require('node-fetch');

async function testLogs() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // 1. Test création d'un log
    console.log('🧪 Test 1: Création d'un log...');
    const createResponse = await fetch(`${baseUrl}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-token-here' // Remplacer par un vrai token
      },
      body: JSON.stringify({
        action: 'TEST_LOG',
        module: 'SYSTEM',
        level: 'INFO',
        description: 'Test de création de log',
        metadata: {
          testField: 'testValue',
          entityId: 123
        }
      })
    });
    
    const createData = await createResponse.json();
    console.log('✅ Réponse création:', JSON.stringify(createData, null, 2));
    
    // 2. Test récupération des logs
    console.log('\n🧪 Test 2: Récupération des logs...');
    const getResponse = await fetch(`${baseUrl}/logs?page=1&limit=5`, {
      headers: {
        'Authorization': 'Bearer your-token-here' // Remplacer par un vrai token
      }
    });
    
    const getData = await getResponse.json();
    console.log('✅ Réponse récupération:', JSON.stringify(getData, null, 2));
    
    // 3. Test statistiques
    console.log('\n🧪 Test 3: Statistiques des logs...');
    const statsResponse = await fetch(`${baseUrl}/logs/stats`, {
      headers: {
        'Authorization': 'Bearer your-token-here' // Remplacer par un vrai token
      }
    });
    
    const statsData = await statsResponse.json();
    console.log('✅ Réponse statistiques:', JSON.stringify(statsData, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Lancer le test
testLogs();
