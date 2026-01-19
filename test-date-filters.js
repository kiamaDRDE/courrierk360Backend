// Test des filtres de date pour les logs
const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3000';

// Token JWT (vous devez le remplacer par un vrai token)
const token = 'YOUR_JWT_TOKEN_HERE';

async function testDateFilters() {
  console.log('🧪 Test des filtres de date pour les logs...\n');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Tests différents formats de date
  const dateTests = [
    {
      name: 'Format simple - Date du jour',
      startDate: '2026-01-08',
      endDate: '2026-01-08'
    },
    {
      name: 'Format simple - Semaine dernière',
      startDate: '2026-01-01', 
      endDate: '2026-01-07'
    },
    {
      name: 'Format ISO complet',
      startDate: '2026-01-08T00:00:00.000Z',
      endDate: '2026-01-08T23:59:59.999Z'
    },
    {
      name: 'Uniquement date début',
      startDate: '2026-01-01'
    },
    {
      name: 'Uniquement date fin',
      endDate: '2026-01-08'
    }
  ];

  for (const test of dateTests) {
    try {
      console.log(`📅 Test: ${test.name}`);
      
      const params = new URLSearchParams();
      params.append('limit', '5'); // Limiter pour les tests
      
      if (test.startDate) {
        params.append('startDate', test.startDate);
        console.log(`   📍 Date début: ${test.startDate}`);
      }
      
      if (test.endDate) {
        params.append('endDate', test.endDate);
        console.log(`   📍 Date fin: ${test.endDate}`);
      }

      const response = await fetch(`${baseUrl}/logs?${params.toString()}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Succès: ${result.data.logs.length} log(s) trouvé(s)`);
        
        // Afficher les dates des premiers logs pour vérification
        if (result.data.logs.length > 0) {
          console.log(`   📝 Premier log: ${result.data.logs[0].createdAt}`);
        }
      } else {
        const error = await response.json();
        console.log(`   ❌ Erreur: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }
    
    console.log(''); // Ligne vide
  }
}

// Instructions
console.log('🔑 IMPORTANT: Remplacez YOUR_JWT_TOKEN_HERE par un vrai token JWT');
console.log('💡 Étapes:');
console.log('1. Connectez-vous à l\'API pour obtenir un token');
console.log('2. Remplacez la valeur de "token" ci-dessus');
console.log('3. Relancez le script');
console.log('4. Vérifiez que les filtres de date fonctionnent\n');

// Décommenter la ligne suivante après avoir mis le bon token
// testDateFilters();
