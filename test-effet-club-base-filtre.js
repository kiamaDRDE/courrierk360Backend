/**
 * Script de test pour l'API Effet Club Base avec Filtres
 * 
 * Tests:
 * 1. HC + Offnet
 * 2. HP + Offnet
 * 3. HC + Onnet
 * 4. HP + Onnet
 * 5. Validation de l'année
 * 6. Gestion des erreurs
 */

const BASE_URL = 'http://localhost:3000/offre/effet-club-base';

// Remplacez par un token valide
const TOKEN = 'votre-token-ici';

async function testAPI(description, offreId, periode, reseau, annee = null) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${description}`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    let url = `${BASE_URL}/${offreId}?periode=${periode}&reseau=${reseau}`;
    if (annee) {
      url += `&annee=${annee}`;
    }
    
    console.log(`URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('\nRéponse:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Test réussi !');
      
      // Afficher les informations clés
      const { offre, filtres, effetClub } = data.data;
      console.log(`\nOffre: ${offre.nom} (${offre.operateur.nom})`);
      console.log(`Filtres: ${filtres.periode} - ${filtres.reseau} - ${filtres.typeCalcul}`);
      
      // Extraire les champs d'effet club
      const effetClubKeys = Object.keys(effetClub).filter(k => k.startsWith('effetClub'));
      if (effetClubKeys.length > 0) {
        const key = effetClubKeys[0];
        console.log(`Effet Club: ${effetClub[key]}`);
        console.log(`Résultat: ${effetClub[key.replace('effetClub', 'resultat')]}`);
        console.log(`Est Effet Club: ${effetClub[key.replace('effetClub', 'isEffetClub')]}`);
      }
    } else {
      console.log('\n❌ Test échoué !');
    }
    
  } catch (error) {
    console.log('\n❌ Erreur lors du test:');
    console.error(error.message);
  }
}

async function runAllTests() {
  console.log('\n🚀 DÉMARRAGE DES TESTS - API EFFET CLUB BASE AVEC FILTRES');
  console.log('='.repeat(80));
  
  // Test 1: HC + Offnet
  await testAPI('Effet Club Base - HC + Offnet', 1, 'HC', 'Offnet');
  
  // Test 2: HP + Offnet
  await testAPI('Effet Club Base - HP + Offnet', 1, 'HP', 'Offnet');
  
  // Test 3: HC + Onnet
  await testAPI('Effet Club Base - HC + Onnet', 1, 'HC', 'Onnet');
  
  // Test 4: HP + Onnet
  await testAPI('Effet Club Base - HP + Onnet', 1, 'HP', 'Onnet');
  
  // Test 5: Avec validation de l'année
  await testAPI('Effet Club Base - HP + Onnet avec année 2025', 1, 'HP', 'Onnet', 2025);
  
  // Test 6: Période invalide
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST: Erreur - Période invalide');
  console.log(`${'='.repeat(80)}`);
  try {
    const response = await fetch(`${BASE_URL}/1?periode=XX&reseau=Onnet`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error.message);
  }
  
  // Test 7: Réseau invalide
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST: Erreur - Réseau invalide');
  console.log(`${'='.repeat(80)}`);
  try {
    const response = await fetch(`${BASE_URL}/1?periode=HC&reseau=XXX`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error.message);
  }
  
  // Test 8: Offre introuvable
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST: Erreur - Offre introuvable');
  console.log(`${'='.repeat(80)}`);
  try {
    const response = await fetch(`${BASE_URL}/99999?periode=HC&reseau=Onnet`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error.message);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ TOUS LES TESTS TERMINÉS');
  console.log(`${'='.repeat(80)}\n`);
}

// Exécuter les tests
runAllTests();
