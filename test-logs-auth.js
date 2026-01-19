// Script de test complet avec authentification
// Remplacez les valeurs par vos vraies credentials

const baseUrl = 'http://localhost:3000';

// 1. ÉTAPE : Connexion pour obtenir le token
const loginData = {
  email: "admin@example.com", // Remplacez par votre email
  numero: "123456789",        // Remplacez par votre numéro  
  password: "password123"     // Remplacez par votre mot de passe
};

console.log('🔐 Étape 1: Connexion...');
console.log(`POST ${baseUrl}/auth/login`);
console.log('Body:', JSON.stringify(loginData, null, 2));

console.log('\n📋 Instructions:');
console.log('1. Copiez ce JSON et faites une requête POST sur /auth/login');
console.log('2. Récupérez le token de la réponse');
console.log('3. Utilisez le token dans les headers: Authorization: Bearer VOTRE_TOKEN');

console.log('\n🧪 Étape 2: Testez les endpoints de logs avec le token:');
console.log(`GET ${baseUrl}/logs`);
console.log(`GET ${baseUrl}/logs/stats`);
console.log(`POST ${baseUrl}/logs (avec un body JSON)`);

console.log('\n📦 Exemple de body pour créer un log:');
const logExample = {
  action: "TEST_API",
  module: "SYSTEM", 
  level: "INFO",
  description: "Test via script",
  metadata: {
    source: "manual_test",
    userId: 1
  }
};
console.log(JSON.stringify(logExample, null, 2));

console.log('\n✅ Si vous voyez une réponse JSON au lieu d\'une erreur 500, c\'est que ça marche !');
