const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Fonction utilitaire pour faire des requêtes avec gestion d'erreur
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Erreur ${method} ${url}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Variables globales pour le test
let authToken = '';

// Test de l'API de désarchivage
async function testUnarchiveAPI() {
  console.log('\n🧪 === TEST API DÉSARCHIVAGE ===\n');

  // 1. Connexion
  console.log('1️⃣ Connexion...');
  const loginResult = await makeRequest('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });

  if (!loginResult.success) {
    console.log('❌ Échec de connexion');
    return;
  }

  authToken = loginResult.data.data.accessToken;
  console.log('✅ Connexion réussie');

  const headers = { Authorization: `Bearer ${authToken}` };

  // 2. Récupérer des éléments archivés pour les tests
  console.log('\n2️⃣ Récupération d\'éléments archivés...');

  // Récupérer courriers archivés
  const courriersArchivesResult = await makeRequest('GET', '/courrier?isArchive=true&page=1&limit=3', null, headers);
  const transmissionsArchiveesResult = await makeRequest('GET', '/traitement/transmissions?isArchive=true&page=1&limit=2', null, headers);
  
  let idCourriers = [];
  let idTransmissions = [];
  let idSalle = 1;
  let idCoffre = 1;

  if (courriersArchivesResult.success && courriersArchivesResult.data.data?.courriers?.length > 0) {
    idCourriers = courriersArchivesResult.data.data.courriers.map(c => c.id);
    console.log(`✅ ${idCourriers.length} courrier(s) archivé(s) trouvé(s): [${idCourriers.join(', ')}]`);
  }

  if (transmissionsArchiveesResult.success && transmissionsArchiveesResult.data.data?.transmissions?.length > 0) {
    idTransmissions = transmissionsArchiveesResult.data.data.transmissions.map(t => t.id);
    console.log(`✅ ${idTransmissions.length} transmission(s) archivée(s) trouvée(s): [${idTransmissions.join(', ')}]`);
  }

  if (idCourriers.length === 0 && idTransmissions.length === 0) {
    console.log('⚠️ Aucun élément archivé trouvé pour le test. Création d\'une archive d\'abord...');
    
    // Créer une archive pour les tests
    const courriersResult = await makeRequest('GET', '/courrier?page=1&limit=2', null, headers);
    const transmissionsResult = await makeRequest('GET', '/traitement/transmissions?page=1&limit=2', null, headers);

    if (courriersResult.success && courriersResult.data.data?.courriers?.length > 0) {
      idCourriers = courriersResult.data.data.courriers.slice(0, 2).map(c => c.id);
    }

    if (transmissionsResult.success && transmissionsResult.data.data?.transmissions?.length > 0) {
      idTransmissions = transmissionsResult.data.data.transmissions.slice(0, 1).map(t => t.id);
    }

    // Créer l'archive
    const createArchiveResult = await makeRequest('POST', '/archive', {
      idCourriers,
      idTransmissions,
      idSalle,
      idCoffre
    }, headers);

    if (createArchiveResult.success) {
      console.log(`✅ Archive créée avec ${idCourriers.length} courrier(s) et ${idTransmissions.length} transmission(s)`);
    } else {
      console.log('❌ Échec de création de l\'archive pour les tests');
      return;
    }
  }

  // 3. Test de désarchivage complet
  console.log('\n3️⃣ Test: Désarchivage complet...');
  
  const unarchiveData = {
    idCourriers: idCourriers.slice(0, Math.min(2, idCourriers.length)),
    idTransmissions: idTransmissions.slice(0, Math.min(1, idTransmissions.length)),
    idSalle,
    idCoffre
  };

  console.log('📋 Données de désarchivage:', unarchiveData);

  const unarchiveResult = await makeRequest('POST', '/archive/unarchive', unarchiveData, headers);
  
  if (unarchiveResult.success) {
    console.log('✅ Désarchivage réussi !');
    console.log('📊 Résultat:', unarchiveResult.data.data);
    console.log('💬 Message:', unarchiveResult.data.message);
  } else {
    console.log('❌ Échec du désarchivage');
  }

  // 4. Vérification des statuts après désarchivage
  console.log('\n4️⃣ Vérification des statuts après désarchivage...');
  
  // Vérifier les courriers
  for (const courrierId of unarchiveData.idCourriers) {
    const courrierResult = await makeRequest('GET', `/courrier/${courrierId}`, null, headers);
    if (courrierResult.success) {
      const courrier = courrierResult.data.data;
      console.log(`📧 Courrier ${courrierId}: statut="${courrier.statut}", isArchive=${courrier.isArchive}, statutArchive=${courrier.statutArchive || 'null'}`);
    }
  }

  // Vérifier les transmissions
  for (const transmissionId of unarchiveData.idTransmissions) {
    const transmissionResult = await makeRequest('GET', `/traitement/transmission/${transmissionId}`, null, headers);
    if (transmissionResult.success) {
      const transmission = transmissionResult.data.data;
      console.log(`📨 Transmission ${transmissionId}: statut="${transmission.statut}", isArchive=${transmission.isArchive}, statutArchive=${transmission.statutArchive || 'null'}`);
    }
  }

  // 5. Test d'erreurs
  console.log('\n5️⃣ Test des cas d\'erreur...');
  
  // Test sans éléments
  const emptyUnarchiveResult = await makeRequest('POST', '/archive/unarchive', {
    idCourriers: [],
    idTransmissions: [],
    idCourriersDepart: [],
    idSalle,
    idCoffre
  }, headers);
  
  if (!emptyUnarchiveResult.success) {
    console.log('✅ Erreur attendue pour désarchivage vide:', emptyUnarchiveResult.error.message || 'Validation échouée');
  }

  // Test avec salle inexistante
  const invalidSalleResult = await makeRequest('POST', '/archive/unarchive', {
    idCourriers: [9999],
    idSalle: 9999,
    idCoffre
  }, headers);
  
  if (!invalidSalleResult.success) {
    console.log('✅ Erreur attendue pour salle inexistante:', invalidSalleResult.error.message || 'Salle non trouvée');
  }

  console.log('\n🏁 === FIN DU TEST DÉSARCHIVAGE ===\n');
}

// Exécution du test
testUnarchiveAPI();