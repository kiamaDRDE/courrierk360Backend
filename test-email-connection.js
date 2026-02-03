/**
 * Script de test pour vérifier la connexion email Gmail
 * et l'envoi de messages
 */

const nodemailer = require('nodemailer');

async function testEmailConnection() {
  console.log('='.repeat(80));
  console.log('TEST DE CONNEXION EMAIL GMAIL');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Configuration du transporteur (identique à celle du code)
    console.log('📧 Configuration du transporteur Gmail...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ppatnuc@gmail.com',
        pass: 'jyqkjhovvrdmujrs', // Mot de passe d'application
      },
    });

    console.log('✅ Transporteur créé\n');

    // Vérifier la connexion
    console.log('🔌 Vérification de la connexion au serveur Gmail...');
    await transporter.verify();
    console.log('✅ Connexion au serveur Gmail réussie!\n');

    // Envoyer un email de test
    console.log('📤 Envoi d\'un email de test...');
    const testEmail = {
      from: 'ppatnuc@gmail.com',
      to: 'ppatnuc@gmail.com', // Envoi à soi-même pour test
      subject: 'Test de connexion - ' + new Date().toLocaleString(),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🧪 Email de test</h2>
          <p>Cet email confirme que le service d'envoi fonctionne correctement.</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Statut:</strong> ✅ Configuration OK</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(testEmail);
    
    console.log('✅ Email de test envoyé avec succès!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ TOUS LES TESTS ONT RÉUSSI');
    console.log('='.repeat(80));
    console.log('Le système d\'email est opérationnel.');
    console.log('Si vous ne recevez toujours pas les OTP, vérifiez:');
    console.log('  1. Le dossier spam/courrier indésirable');
    console.log('  2. Les logs de l\'application backend');
    console.log('  3. Les paramètres de sécurité du compte Gmail');

  } catch (error) {
    console.error('❌ ERREUR DÉTECTÉE:');
    console.error('');
    console.error('Type:', error.constructor.name);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('');
    
    if (error.code === 'EAUTH') {
      console.error('⚠️  PROBLÈME D\'AUTHENTIFICATION GMAIL');
      console.error('');
      console.error('Solutions possibles:');
      console.error('  1. Vérifier que le mot de passe d\'application est correct');
      console.error('  2. Générer un nouveau mot de passe d\'application:');
      console.error('     https://myaccount.google.com/apppasswords');
      console.error('  3. S\'assurer que la validation en 2 étapes est activée sur le compte');
      console.error('  4. Vérifier que l\'accès aux applications moins sécurisées n\'est pas bloqué');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('⚠️  PROBLÈME DE CONNEXION RÉSEAU');
      console.error('');
      console.error('Solutions possibles:');
      console.error('  1. Vérifier la connexion internet');
      console.error('  2. Vérifier si un pare-feu bloque les connexions sortantes');
      console.error('  3. Essayer avec un autre réseau');
    }
    
    console.error('');
    console.error('Stack trace complète:');
    console.error(error.stack);
    
    process.exit(1);
  }
}

// Exécuter le test
console.log('Démarrage du test...\n');
testEmailConnection();
