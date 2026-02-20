// Script de vérification des éléments critiques pour l'envoi d'email
const fs = require('fs');
const path = require('path');

function checkBuildRequirements() {
    console.log('🔍 Vérification des éléments critiques pour l\'envoi d\'email...\n');
    
    let hasErrors = false;
    
    // 1. Vérifier les templates HTML
    const templatesPath = path.join(__dirname, 'src', 'mailer', 'templates');
    const requiredTemplates = [
        'courrier-accuse-reception.html',
        'courrier-notification-service.html'
    ];
    
    console.log('📧 Templates d\'email :');
    requiredTemplates.forEach(template => {
        const templatePath = path.join(templatesPath, template);
        if (fs.existsSync(templatePath)) {
            console.log(`  ✅ ${template}`);
        } else {
            console.log(`  ❌ ${template} - MANQUANT !`);
            hasErrors = true;
        }
    });
    
    // 2. Vérifier le logo
    const logoPath = path.join(__dirname, 'public', 'logo.png');
    console.log('\n🖼️  Assets :');
    if (fs.existsSync(logoPath)) {
        console.log('  ✅ logo.png');
    } else {
        console.log('  ❌ logo.png - MANQUANT !');
        console.log('  ⚠️  Les emails seront envoyés sans logo');
    }
    
    // 3. Vérifier les variables d'environnement critiques
    console.log('\n🔧 Variables d\'environnement :');
    const requiredEnvVars = [
        'JWT_SECRET',
        'DATABASE_URL'
    ];
    
    requiredEnvVars.forEach(envVar => {
        if (process.env[envVar]) {
            console.log(`  ✅ ${envVar}`);
        } else {
            console.log(`  ❌ ${envVar} - MANQUANT !`);
            hasErrors = true;
        }
    });
    
    // 4. Vérifier la structure des dossiers
    console.log('\n📁 Structure des dossiers :');
    const requiredDirs = [
        'public',
        'src/mailer',
        'src/mailer/templates'
    ];
    
    requiredDirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            console.log(`  ✅ ${dir}/`);
        } else {
            console.log(`  ❌ ${dir}/ - MANQUANT !`);
            hasErrors = true;
        }
    });
    
    // 5. Vérifier nodemailer
    console.log('\n📦 Dépendances critiques :');
    try {
        require('nodemailer');
        console.log('  ✅ nodemailer');
    } catch (error) {
        console.log('  ❌ nodemailer - NON INSTALLÉ !');
        hasErrors = true;
    }
    
    console.log('\n' + '='.repeat(50));
    if (hasErrors) {
        console.log('❌ ERREURS DÉTECTÉES ! L\'envoi d\'emails peut échouer en production.');
        console.log('🔧 Actions requises :');
        console.log('   - Copier les templates HTML dans le build');
        console.log('   - Copier les assets (logo.png) dans le build');
        console.log('   - Configurer les variables d\'environnement');
        process.exit(1);
    } else {
        console.log('✅ Tous les éléments critiques sont présents !');
        console.log('📧 L\'envoi d\'emails devrait fonctionner correctement.');
    }
}

checkBuildRequirements();