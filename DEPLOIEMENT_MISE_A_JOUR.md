# Guide de Déploiement - Mise à jour du serveur

## 📋 Étapes pour appliquer les mises à jour après `git pull`

### 1️⃣ Connexion au serveur

```bash
ssh root@IP_DU_SERVEUR
# Entrer le mot de passe
cd /var/www/tontine/api
```

### 2️⃣ Vérifier les changements récupérés

```bash
git status
git log --oneline -5  # Voir les 5 derniers commits
```

### 3️⃣ Installer les dépendances (si package.json a changé)

```bash
npm install
```

### 4️⃣ **IMPORTANT : Appliquer les migrations Prisma**

Comme vous avez créé une nouvelle table `tarifs_interconnexion`, il faut appliquer la migration :

```bash
# Appliquer les migrations en production
npx prisma migrate deploy

# Régénérer le client Prisma
npx prisma generate
```

**⚠️ ATTENTION :** La migration va supprimer les colonnes `tarif_interconnection` et `annee` de la table `operateurs`. Si vous avez des données importantes, sauvegardez-les d'abord !

### 5️⃣ Compiler le projet TypeScript

```bash
npm run build
```

### 6️⃣ Redémarrer l'application avec PM2

```bash
# Redémarrer l'application
pm2 restart tontine-api --update-env

# Ou si l'app n'existe pas encore
pm2 start dist/src/main.js --name tontine-api

# Sauvegarder la configuration PM2
pm2 save
```

### 7️⃣ Vérifier que l'application fonctionne

```bash
# Voir les logs en temps réel
pm2 logs tontine-api

# Vérifier le statut
pm2 status

# Tester l'API
curl http://localhost:3001/api
```

### 8️⃣ Tester les nouveaux endpoints

```bash
# Tester l'endpoint de la nouvelle API tarif-interconnexion
curl -X GET http://localhost:3001/tarif-interconnexion \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Commandes complètes (copier-coller)

```bash
# Sur le serveur
cd /var/www/tontine/api

# Récupérer les dernières mises à jour (déjà fait)
git pull origin manuella

# Installer les dépendances
npm install

# Appliquer les migrations de base de données
npx prisma migrate deploy
npx prisma generate

# Compiler le projet
npm run build

# Redémarrer l'application
pm2 restart tontine-api --update-env

# Voir les logs
pm2 logs tontine-api --lines 50

# Sauvegarder la configuration PM2
pm2 save
```

---

## 🚨 Résolution des problèmes courants

### Problème 1 : Erreur de migration Prisma

**Erreur :** `Migration failed: Column 'tarif_interconnection' not found`

**Solution :**
```bash
# Vérifier l'état de la base de données
npx prisma migrate status

# Si nécessaire, réinitialiser (⚠️ PERTE DE DONNÉES)
npx prisma migrate reset  # NE PAS FAIRE EN PRODUCTION !

# En production, appliquer uniquement les nouvelles migrations
npx prisma migrate deploy
```

### Problème 2 : Port déjà utilisé

**Erreur :** `EADDRINUSE: address already in use :::3001`

**Solution :**
```bash
# Trouver le processus qui utilise le port 3001
lsof -i :3001

# Tuer le processus
kill -9 PID_DU_PROCESSUS

# Ou arrêter PM2 puis redémarrer
pm2 stop tontine-api
pm2 start tontine-api
```

### Problème 3 : Erreurs de compilation TypeScript

**Solution :**
```bash
# Nettoyer et recompiler
rm -rf dist node_modules
npm install
npm run build
```

### Problème 4 : Variables d'environnement manquantes

**Solution :**
```bash
# Vérifier le fichier .env
cat .env

# S'assurer que DATABASE_URL, SECRET_KEY, etc. sont définis
nano .env
```

---

## 📊 Vérifier que la nouvelle table existe

```bash
# Connexion à MySQL
mysql -u root -p
use patnuc_segmentation;

# Vérifier que la table existe
SHOW TABLES;

# Voir la structure de la nouvelle table
DESCRIBE tarifs_interconnexion;

# Vérifier que les anciennes colonnes ont été supprimées
DESCRIBE operateurs;

# Quitter MySQL
exit;
```

---

## 🎯 Créer les premiers tarifs d'interconnexion

Une fois l'application redémarrée, vous devez créer les tarifs pour vos opérateurs existants :

```bash
# Exemple : Créer un tarif pour MTN en 2025
curl -X POST http://localhost:3001/tarif-interconnexion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "operateurId": 1,
    "annee": 2025,
    "tarif": 25.50,
    "description": "Tarif MTN 2025"
  }'
```

Ou utilisez Swagger UI : `http://VOTRE_IP:3001/api`

---

## 📝 Checklist de déploiement

- [ ] `git pull origin manuella` ✅ (déjà fait)
- [ ] `npm install`
- [ ] `npx prisma migrate deploy`
- [ ] `npx prisma db push --force-reset`
- [ ] `npx prisma generate`
- [ ] `npm run build`
- [ ] `pm2 restart tontine-api --update-env`
- [ ] `pm2 logs tontine-api` (vérifier les erreurs)
- [ ] `pm2 save`
- [ ] Tester l'API : `http://VOTRE_IP:3001/api`
- [ ] Créer les tarifs d'interconnexion pour les opérateurs existants
- [ ] Tester la création d'offres et le calcul de l'effet club

---

## 🔗 URLs importantes

- **API Documentation (Swagger):** `http://VOTRE_IP:3001/api`
- **Health Check:** `http://VOTRE_IP:3001/`
- **Nouvelle API Tarifs:** `http://VOTRE_IP:3001/tarif-interconnexion`

---

## 💾 Sauvegarde avant migration (recommandé)

```bash
# Sauvegarder la base de données
mysqldump -u root -p patnuc_segmentation > backup_$(date +%Y%m%d_%H%M%S).sql

# Si problème, restaurer avec :
# mysql -u root -p patnuc_segmentation < backup_20251216_xxxxx.sql
```

---

## 📞 Support

En cas de problème, vérifiez les logs :
```bash
pm2 logs tontine-api --lines 100
```

Ou consultez le guide de migration : `MIGRATION_TARIF_INTERCONNEXION.md`
