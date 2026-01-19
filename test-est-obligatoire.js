import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000';

// Note: Dans un vrai test, vous auriez besoin d'un token d'authentification valide
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testStructureTarifaireAvecEstObligatoire() {
  console.log('🧪 Test du champ estObligatoire dans StructureTarifaire\n');

  // Test 1: Créer une structure obligatoire
  console.log('📝 Test 1: Création d\'une structure tarifaire obligatoire');
  const createObligatoire = {
    nom: 'Structure Test Obligatoire',
    valeur: 25.50,
    estObligatoire: true
  };

  console.log('Données envoyées:', JSON.stringify(createObligatoire, null, 2));
  console.log('Curl équivalent:');
  console.log(`curl -X POST ${API_BASE_URL}/structure-tarifaire \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${TEST_TOKEN}" \\
  -d '${JSON.stringify(createObligatoire)}'`);
  
  // Test 2: Créer une structure non obligatoire
  console.log('\n📝 Test 2: Création d\'une structure tarifaire non obligatoire');
  const createNonObligatoire = {
    nom: 'Structure Test Non Obligatoire',
    valeur: 15.75,
    estObligatoire: false
  };

  console.log('Données envoyées:', JSON.stringify(createNonObligatoire, null, 2));
  console.log('Curl équivalent:');
  console.log(`curl -X POST ${API_BASE_URL}/structure-tarifaire \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${TEST_TOKEN}" \\
  -d '${JSON.stringify(createNonObligatoire)}'`);

  // Test 3: Créer une structure sans spécifier estObligatoire (doit être false par défaut)
  console.log('\n📝 Test 3: Création sans spécifier estObligatoire (défaut false)');
  const createDefaut = {
    nom: 'Structure Test Défaut',
    valeur: 10.00
  };

  console.log('Données envoyées:', JSON.stringify(createDefaut, null, 2));
  console.log('Curl équivalent:');
  console.log(`curl -X POST ${API_BASE_URL}/structure-tarifaire \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${TEST_TOKEN}" \\
  -d '${JSON.stringify(createDefaut)}'`);

  // Test 4: Créer plusieurs structures avec différentes valeurs
  console.log('\n📝 Test 4: Création multiple avec différentes valeurs estObligatoire');
  const createMultiple = [
    {
      nom: 'Structure Multiple 1',
      valeur: 20.00,
      estObligatoire: true
    },
    {
      nom: 'Structure Multiple 2',
      valeur: 30.00,
      estObligatoire: false
    },
    {
      nom: 'Structure Multiple 3',
      valeur: 40.00
      // estObligatoire non spécifié = false par défaut
    }
  ];

  console.log('Données envoyées:', JSON.stringify(createMultiple, null, 2));
  console.log('Curl équivalent:');
  console.log(`curl -X POST ${API_BASE_URL}/structure-tarifaire \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${TEST_TOKEN}" \\
  -d '${JSON.stringify(createMultiple)}'`);

  // Test 5: Requête GET avec filtre estObligatoire=true
  console.log('\n📋 Test 5: Récupération des structures obligatoires uniquement');
  console.log('Curl équivalent:');
  console.log(`curl -X GET "${API_BASE_URL}/structure-tarifaire?estObligatoire=true" \\
  -H "Authorization: Bearer ${TEST_TOKEN}"`);

  // Test 6: Requête GET avec filtre estObligatoire=false
  console.log('\n📋 Test 6: Récupération des structures non obligatoires uniquement');
  console.log('Curl équivalent:');
  console.log(`curl -X GET "${API_BASE_URL}/structure-tarifaire?estObligatoire=false" \\
  -H "Authorization: Bearer ${TEST_TOKEN}"`);

  // Test 7: Mise à jour d'une structure pour changer estObligatoire
  console.log('\n✏️ Test 7: Mise à jour du champ estObligatoire');
  const updateData = {
    estObligatoire: true
  };

  console.log('Données envoyées:', JSON.stringify(updateData, null, 2));
  console.log('Curl équivalent (remplacer {id} par l\'ID réel):');
  console.log(`curl -X PATCH ${API_BASE_URL}/structure-tarifaire/{id} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${TEST_TOKEN}" \\
  -d '${JSON.stringify(updateData)}'`);

  console.log('\n📚 Documentation Swagger disponible sur:');
  console.log(`${API_BASE_URL}/structure-tarifaire-doc`);
  
  console.log('\n✅ Tests configurés ! Utilisez ces commandes curl avec votre token d\'authentification pour tester.');
}

testStructureTarifaireAvecEstObligatoire().catch(console.error);
