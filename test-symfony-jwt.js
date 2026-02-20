// Script de test pour valider le token JWT Symfony
// Usage: node test-symfony-jwt.js

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Token fourni par l'application Symfony
const symfonyToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3NzE1NzgxNjEsImV4cCI6MTc3MTY2NDU2MSwicm9sZXMiOlsiUk9MRV9BRE1JTiIsIlJPTEVfVVNFUiJdLCJ1c2VybmFtZSI6InRlc3QxIiwiaWQiOjF9.Az4ItNyh-22Vt7-i7-yPunR5-KtTHjUPV5tIYcJmh4vftZDI_Hd0ao5bQWmPCD6Gcnwl2siUL1Xy6ANO4Lu-DZmJF9nhFTAsR5BlPo9Afez5hLRYYEZdYacuaXwCnIb5av6POXTfGeq8mZAwm6zpqrCoZgSTdW2QSEau0fvnMv_IDXDqVvIyfKbpxF5nyCFYJp2EVzxyjbXLKJl3-j0xlv3vdwCBrdOcmqQFUPXf5Lhu5gvenRtnMezXokvyxedf6U1RCknJ1Qxug9iyl5K1JNYu3s1KP6IqcSJy13-1SRsmlqqlID3lo4886mhRZQwaNvd3VyNaxeF6j8g9iAFYmZ4l7bK5WR5plFm1nIMDub6ekzaw3JV5DYy3XYmiuaRzxH1lSpFltJzzHM1fhKm_hcp7osMameImz7jjebtWH_BIzbYYpRBsV5A7I38-rr9eL035sNsUd1X-jJnFDCzsXYx6WdJae5SpPukaGIexgxr_5lPlPjnM8AdeWoMR0yY7je89DDFQnLOf2dgzeKWOgC7HDoLnk1FqGYmNjBTN-BCXPXFMg02Ui07kpL-PkhT-9OP8PClrw8gxPATnFGg6-CDQumP8Ot3DXIGyjlmF1RwNC9I8QzxO8VIzOQSG0mNcemJVv8UNy8aXaPp6cHJLgjsGHmywwP01HALoH14sKYM';

// Charger la clé publique
const publicKeyPath = path.resolve(__dirname, 'jwt-symfony-public.pem');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

console.log('🔐 Test de validation du token JWT Symfony\n');
console.log('═══════════════════════════════════════════════════════\n');

// 1. Décoder le token sans vérification (pour voir le contenu)
console.log('📋 Contenu du token (sans vérification) :');
const decoded = jwt.decode(symfonyToken, { complete: true });
console.log(JSON.stringify(decoded, null, 2));
console.log('\n');

// 2. Vérifier et décoder le token avec la clé publique
try {
  console.log('✅ Vérification de la signature avec la clé publique...\n');
  
  const verified = jwt.verify(symfonyToken, publicKey, {
    algorithms: ['RS256']
  });
  
  console.log('✅ TOKEN VALIDE ! Signature vérifiée avec succès.\n');
  console.log('📦 Payload vérifié :');
  console.log(JSON.stringify(verified, null, 2));
  console.log('\n');
  
  // 3. Afficher les informations formatées
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Informations extraites du token :');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`👤 Username     : ${verified.username}`);
  console.log(`🆔 User ID      : ${verified.id}`);
  console.log(`🔑 Roles        : ${verified.roles.join(', ')}`);
  console.log(`📅 Émis le      : ${new Date(verified.iat * 1000).toLocaleString('fr-FR')}`);
  console.log(`⏰ Expire le    : ${new Date(verified.exp * 1000).toLocaleString('fr-FR')}`);
  
  // Vérifier si le token est expiré
  const now = Math.floor(Date.now() / 1000);
  const isExpired = verified.exp < now;
  
  if (isExpired) {
    console.log(`\n⚠️  ATTENTION : Ce token est expiré !`);
  } else {
    const remainingTime = verified.exp - now;
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    console.log(`\n✅ Token valide encore ${hours}h ${minutes}min`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ CONFIGURATION RÉUSSIE !');
  console.log('═══════════════════════════════════════════════════════');
  console.log('L\'application NestJS peut maintenant accepter les tokens');
  console.log('générés par l\'application Symfony.');
  console.log('\n💡 Configuration dans .env :');
  console.log('JWT_PUBLIC_KEY_PATH=./jwt-symfony-public.pem');
  console.log('JWT_PRIVATE_KEY_PATH=./jwt-symfony-private.pem');
  console.log('JWT_PRIVATE_KEY_PASSPHRASE=votre-passphrase-si-necessaire');
  
} catch (error) {
  console.error('❌ ERREUR lors de la vérification du token :');
  console.error(error.message);
  console.error('\n');
  
  if (error.name === 'TokenExpiredError') {
    console.log('⚠️  Le token a expiré. C\'est normal si le token date de février 2026.');
    console.log('   Pour tester avec un token valide, générez-en un nouveau depuis Symfony.');
  } else if (error.name === 'JsonWebTokenError') {
    console.log('⚠️  Erreur de signature. Vérifiez que la clé publique est correcte.');
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('🧪 Test terminé');
console.log('═══════════════════════════════════════════════════════\n');
