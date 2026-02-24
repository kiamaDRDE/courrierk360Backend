// Test d'envoi d'email simple
const nodemailer = require('nodemailer');

async function testSimpleEmail() {
  console.log('🧪 Test d\'envoi d\'email simple...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kiamadrde@gmail.com',
      pass: 'jyqkjhovvrdmujrs',
    },
    logger: true,
    debug: true,
  });

  try {
    // Test avec des vraies adresses Gmail
    const testEmails = [
      'manudouanla9@gmail.com',
      'kiamadrde@gmail.com', // votre propre adresse pour test
    ];

    for (let i = 0; i < testEmails.length; i++) {
      const email = testEmails[i];
      console.log(`📧 Envoi ${i + 1}/${testEmails.length} vers ${email}`);
      
      const info = await transporter.sendMail({
        from: {
          name: 'TEST KIAMA',
          address: 'kiamadrde@gmail.com',
        },
        to: email,
        subject: '🧪 Test Email Simple - ' + new Date().toLocaleString(),
        html: `
          <h2>Test d'envoi d'email</h2>
          <p>Ceci est un test simple d'envoi d'email depuis le serveur.</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Destinataire:</strong> ${email}</p>
          <p>Si vous recevez ce message, l'envoi fonctionne !</p>
        `,
        headers: {
          'X-Mailer': 'Test KIAMA v1.0',
          'X-Priority': '3',
        }
      });

      console.log(`✅ Email envoyé à ${email}`);
      console.log(`📨 MessageId: ${info.messageId}`);
      console.log(`📤 Response: ${info.response}`);
      
      // Attendre 5 secondes entre chaque envoi
      if (i < testEmails.length - 1) {
        console.log('⏳ Attente 5 secondes...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('🎉 Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    transporter.close();
  }
}

testSimpleEmail();