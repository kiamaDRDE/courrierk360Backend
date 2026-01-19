#!/bin/bash

echo "=== Déploiement de l'application sur Ubuntu ==="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "Erreur: package.json non trouvé. Assurez-vous d'être dans le répertoire du projet."
    exit 1
fi

echo "1. Installation des dépendances..."
npm install

echo "2. Installation des dépendances de production..."
npm install --omit=dev

echo "3. Génération du client Prisma..."
npx prisma@6.19.1 generate

echo "4. Synchronisation de la base de données..."
npx prisma@6.19.1 db push

echo "5. Construction de l'application..."
npm run build

echo "6. Vérification que le dossier public a été copié..."
if [ -d "dist/public" ]; then
    echo "✅ Dossier public copié avec succès"
else
    echo "⚠️  Copie manuelle du dossier public..."
    cp -r public dist/public
fi

echo "=== Déploiement terminé avec succès ==="
echo "Pour démarrer l'application: npm run start:prod"
