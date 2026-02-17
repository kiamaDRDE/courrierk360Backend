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
let courrierTestId = null;
let transmissionTestId = null;

// Test de synchronisation du classement/déclassement
async function testSynchronisationClassement() {
  console.log('\n🧪 === TEST DE SYNCHRONISATION CLASSEMENT/DÉCLASSEMENT ===\n');

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

  // 2. Récupération d'un courrier avec transmissions
  console.log('\n2️⃣ Récupération d\'un courrier avec transmissions...');
  const courriersResult = await makeRequest('GET', '/courrier?page=1&limit=5', null, headers);
  
  if (!courriersResult.success || !courriersResult.data.data.courriers.length) {
    console.log('❌ Aucun courrier trouvé');
    return;
  }

  // Trouver un courrier avec des transmissions
  let courrierAvecTransmissions = null;
  for (const courrier of courriersResult.data.data.courriers) {
    const detailResult = await makeRequest('GET', `/courrier/${courrier.id}`, null, headers);
    if (detailResult.success && detailResult.data.data.transmissions?.length > 0) {
      courrierAvecTransmissions = detailResult.data.data;
      break;
    }
  }

  if (!courrierAvecTransmissions) {
    console.log('❌ Aucun courrier avec transmissions trouvé');
    return;
  }

  courrierTestId = courrierAvecTransmissions.id;
  transmissionTestId = courrierAvecTransmissions.transmissions[0].id;
  
  console.log(`✅ Courrier trouvé: ID=${courrierTestId}, Statut="${courrierAvecTransmissions.statut}", isGeled=${courrierAvecTransmissions.isGeled}`);
  console.log(`✅ Transmission trouvée: ID=${transmissionTestId}, Statut="${courrierAvecTransmissions.transmissions[0].statut}", isGeled=${courrierAvecTransmissions.transmissions[0].isGeled}`);

  // S'assurer que le courrier n'est pas classé
  if (courrierAvecTransmissions.isGeled) {
    console.log('\n🔄 Déclassement du courrier pour les tests...');
    await makeRequest('PATCH', `/courrier/${courrierTestId}/declasser`, null, headers);
  }

  // 3. Test classement d'un courrier (doit classer toutes les transmissions)
  console.log('\n3️⃣ Test: Classement du courrier (doit classer toutes les transmissions)...');
  
  const classementCourrierResult = await makeRequest('PATCH', `/courrier/${courrierTestId}/classer`, null, headers);
  
  if (classementCourrierResult.success) {
    console.log('✅ Courrier classé');
    
    // Vérifier le statut des transmissions
    const verificationResult = await makeRequest('GET', `/courrier/${courrierTestId}`, null, headers);
    if (verificationResult.success) {
      const courrier = verificationResult.data.data;
      console.log(`📊 Courrier après classement: Statut="${courrier.statut}", isGeled=${courrier.isGeled}`);
      
      const transmissionsClassees = courrier.transmissions.filter(t => t.isGeled).length;
      const totalTransmissions = courrier.transmissions.length;
      
      console.log(`📊 Transmissions classées: ${transmissionsClassees}/${totalTransmissions}`);
      
      if (transmissionsClassees === totalTransmissions) {
        console.log('✅ Toutes les transmissions ont été classées automatiquement');
      } else {
        console.log('❌ Certaines transmissions ne sont pas classées');
      }
    }
  } else {
    console.log('❌ Échec du classement du courrier');
  }

  // 4. Test déclassement du courrier (doit déclasser toutes les transmissions)
  console.log('\n4️⃣ Test: Déclassement du courrier (doit déclasser toutes les transmissions)...');
  
  const declassementCourrierResult = await makeRequest('PATCH', `/courrier/${courrierTestId}/declasser`, null, headers);
  
  if (declassementCourrierResult.success) {
    console.log('✅ Courrier déclassé');
    
    // Vérifier le statut des transmissions
    const verificationResult = await makeRequest('GET', `/courrier/${courrierTestId}`, null, headers);
    if (verificationResult.success) {
      const courrier = verificationResult.data.data;
      console.log(`📊 Courrier après déclassement: Statut="${courrier.statut}", isGeled=${courrier.isGeled}`);
      
      const transmissionsDeclassees = courrier.transmissions.filter(t => !t.isGeled).length;
      const totalTransmissions = courrier.transmissions.length;
      
      console.log(`📊 Transmissions déclassées: ${transmissionsDeclassees}/${totalTransmissions}`);
      
      if (transmissionsDeclassees === totalTransmissions) {
        console.log('✅ Toutes les transmissions ont été déclassées automatiquement');
      } else {
        console.log('❌ Certaines transmissions sont encore classées');
      }
    }
  } else {
    console.log('❌ Échec du déclassement du courrier');
  }

  // 5. Test classement d'une transmission (doit classer le courrier)
  console.log('\n5️⃣ Test: Classement d\'une transmission (doit classer le courrier)...');
  
  const classementTransmissionResult = await makeRequest('PATCH', `/traitement/transmission/${transmissionTestId}/classer`, {
    commentairePublic: 'Test de classement transmission',
    commentaireInterne: 'Synchronisation automatique'
  }, headers);
  
  if (classementTransmissionResult.success) {
    console.log('✅ Transmission classée');
    
    // Vérifier le statut du courrier
    const verificationResult = await makeRequest('GET', `/courrier/${courrierTestId}`, null, headers);
    if (verificationResult.success) {
      const courrier = verificationResult.data.data;
      console.log(`📊 Courrier après classement transmission: Statut="${courrier.statut}", isGeled=${courrier.isGeled}`);
      
      if (courrier.isGeled) {
        console.log('✅ Le courrier a été classé automatiquement');
      } else {
        console.log('❌ Le courrier n\'a pas été classé automatiquement');
      }
    }
  } else {
    console.log('❌ Échec du classement de la transmission');
  }

  // 6. Test déclassement d'une transmission (doit déclasser le courrier)
  console.log('\n6️⃣ Test: Déclassement d\'une transmission (doit déclasser le courrier)...');
  
  const declassementTransmissionResult = await makeRequest('PATCH', `/traitement/transmission/${transmissionTestId}/declasser`, null, headers);
  
  if (declassementTransmissionResult.success) {
    console.log('✅ Transmission déclassée');
    
    // Vérifier le statut du courrier
    const verificationResult = await makeRequest('GET', `/courrier/${courrierTestId}`, null, headers);
    if (verificationResult.success) {
      const courrier = verificationResult.data.data;
      console.log(`📊 Courrier après déclassement transmission: Statut="${courrier.statut}", isGeled=${courrier.isGeled}`);
      
      if (!courrier.isGeled) {
        console.log('✅ Le courrier a été déclassé automatiquement');
      } else {
        console.log('❌ Le courrier n\'a pas été déclassé automatiquement');
      }
    }
  } else {
    console.log('❌ Échec du déclassement de la transmission');
  }

  console.log('\n🏁 === FIN DU TEST DE SYNCHRONISATION ===\n');
}

// Exécution du test
testSynchronisationClassement();