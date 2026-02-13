# 🚀 Déploiement avec Nginx sur Ubuntu - API Segmentation PATNUC

## 📋 Prérequis (déjà installés)

- ✅ Ubuntu 20.04 ou supérieur
- ✅ Node.js 18.x ou supérieur
- ✅ MySQL 8.x
- ✅ Nginx
- ✅ PM2 (si pas installé : `npm install -g pm2`)

---

## 🔧 Étape 1 : Préparer MySQL

### 1.1 Se connecter à MySQL

```bash
mysql -u root -p
```

### 1.2 Créer la base de données et l'utilisateur

```sql
-- Créer la base de données
CREATE DATABASE IF NOT EXISTS patnuc_segmentation 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur
CREATE USER IF NOT EXISTS 'patnuc_user'@'localhost' 
IDENTIFIED BY 'Patnuc2025!';

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON patnuc_segmentation.* TO 'patnuc_user'@'localhost';
GRANT SELECT ON mysql.* TO 'patnuc_user'@'localhost';

-- Appliquer
FLUSH PRIVILEGES;

-- Quitter
EXIT;
```

---

## 📦 Étape 2 : Déployer l'application

### 2.1 Aller dans le dossier du projet

```bash
cd /var/www/html/patnuc_segmentation
```

### 2.2 Installer les dépendances

```bash
npm install --production
```

### 2.3 Créer le fichier .env

```bash
nano .env
```

Contenu du fichier :

```env
# Environnement
NODE_ENV=production

# Base de données
DATABASE_URL="mysql://patnuc_user:Patnuc2025!@localhost:3306/patnuc_segmentation"

# JWT Secrets (CHANGEZ CES VALEURS !)
JWT_SECRET="changez_ce_secret_jwt_production_2025_ultra_securise"
JWT_REFRESH_SECRET="changez_ce_refresh_secret_jwt_production_2025_ultra_securise"

# Port (NE PAS UTILISER 80 ou 443, Nginx s'en charge)
PORT=3000

# Frontend URL
FRONTEND_URL="http://192.162.69.149:8082"
```

Sauvegarder : `CTRL+X`, puis `Y`, puis `ENTRÉE`

### 2.4 Générer Prisma Client

```bash
npx prisma generate
```

### 2.5 Créer les tables de la base de données

```bash
npx prisma db push
```

Ou si vous avez les migrations :

```bash
npx prisma migrate deploy
```

### 2.6 Compiler le projet

```bash
npm run build
```

### 2.7 Démarrer avec PM2

```bash
# Démarrer l'application
pm2 start dist/src/main.js --name patnuc_segmentation

# Configurer le démarrage automatique au boot
pm2 startup
pm2 save

# Vérifier que ça fonctionne
pm2 status
pm2 logs patnuc_segmentation
```

---

## 🌐 Étape 3 : Configurer Nginx

### 3.1 Créer le fichier de configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/patnuc_segmentation
```

### 3.2 Ajouter la configuration

**Option A : Sans nom de domaine (avec IP)**

```nginx
server {
    listen 80;
    server_name 192.162.69.149;  # Remplacez par votre IP

    # Logs
    access_log /var/log/nginx/patnuc_segmentation-access.log;
    error_log /var/log/nginx/patnuc_segmentation-error.log;

    # Taille max des requêtes
    client_max_body_size 50M;

    # Proxy vers l'application Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Option B : Avec nom de domaine**

```nginx
server {
    listen 80;
    server_name api.patnuc.com www.api.patnuc.com;  # Votre domaine

    # Logs
    access_log /var/log/nginx/patnuc_segmentation-access.log;
    error_log /var/log/nginx/patnuc_segmentation-error.log;

    # Taille max des requêtes
    client_max_body_size 50M;

    # Proxy vers l'application Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Sauvegarder : `CTRL+X`, puis `Y`, puis `ENTRÉE`

### 3.3 Activer le site

```bash
# Créer un lien symbolique
sudo ln -s /etc/nginx/sites-available/patnuc_segmentation /etc/nginx/sites-enabled/

# Tester la configuration Nginx
sudo nginx -t
```

Vous devriez voir :
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3.4 Redémarrer Nginx

```bash
sudo systemctl restart nginx
```

### 3.5 Vérifier le statut de Nginx

```bash
sudo systemctl status nginx
```

---

## 🔥 Étape 4 : Configurer le Firewall (UFW)

```bash
# Autoriser Nginx
sudo ufw allow 'Nginx Full'

# Autoriser SSH (important !)
sudo ufw allow OpenSSH

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

---

## ✅ Étape 5 : Vérifier le déploiement

### 5.1 Tester depuis le serveur

```bash
curl http://localhost:3000
```

### 5.2 Tester depuis un navigateur

Ouvrez : `http://votre_ip_ou_domaine`

Vous devriez voir la documentation Swagger ! 🎉

---

## 🔒 Étape 6 : Configurer HTTPS avec Let's Encrypt (Optionnel mais recommandé)

### 6.1 Installer Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Obtenir un certificat SSL

```bash
sudo certbot --nginx -d api.patnuc.com -d www.api.patnuc.com
```

Suivez les instructions. Certbot configurera automatiquement Nginx pour HTTPS.

### 6.3 Tester le renouvellement automatique

```bash
sudo certbot renew --dry-run
```

### 6.4 Accéder à votre API en HTTPS

`https://api.patnuc.com` 🔒

---

## 🔄 Étape 7 : Mise à jour du code (après modifications)

### 7.1 Sur le serveur

```bash
cd /var/www/html/patnuc_segmentation

# Récupérer les dernières modifications
git pull origin manuella

# Réinstaller les dépendances (si package.json a changé)
npm install --production

# Appliquer les migrations (si la BD a changé)
npx prisma db push

# Régénérer le Prisma Client
npx prisma generate

# Recompiler
npm run build

npx nest build

# Redémarrer l'application
pm2 start npm --name "courrierk360-backend" -- start

pm2 restart courrierk360-backend

# Vérifier les logs
pm2 logs courrierk360-backend
```

---

## 📝 Commandes utiles

### PM2

```bash
pm2 list                             # Liste des applications
pm2 status                           # Statut
pm2 logs courrierk360-backend         # Voir les logs en temps réel
pm2 logs courrierk360-backend --lines 100  # 100 dernières lignes
pm2 restart courrierk360-backend      # Redémarrer
pm2 stop courrierk360-backend         # Arrêter
pm2 delete courrierk360-backend       # Supprimer
pm2 monit                            # Monitoring en temps réel
```

### Nginx

```bash
sudo systemctl status nginx     # Statut
sudo systemctl restart nginx    # Redémarrer
sudo systemctl stop nginx       # Arrêter
sudo systemctl start nginx      # Démarrer
sudo nginx -t                   # Tester la config
sudo tail -f /var/log/nginx/courrierk360-backend-error.log  # Voir les erreurs
```

### Base de données

```bash
# Se connecter
mysql -u patnuc_user -p

# Voir les tables
mysql -u courrierk360_user -p -e "USE courrierk360-backend; SHOW TABLES;"

# Backup
mysqldump -u courrierk360_user -p courrierk360-backend > backup_$(date +%Y%m%d).sql

# Restaurer
mysql -u courrierk360_user -p courrierk360-backend < backup_20251212.sql
```

# DATABASE_URL="mysql://courrierk360_user:Courrier2025@127.0.0.1:3306/courrierk360"

---

## 🐛 Résolution de problèmes

### Erreur 502 Bad Gateway

**Cause** : L'application Node.js ne répond pas.

**Solution** :
```bash
# Vérifier que l'app tourne
pm2 status

# Voir les logs
pm2 logs courrierk360-backend

# Redémarrer
pm2 restart courrierk360-backend
```

### Erreur 504 Gateway Timeout

**Cause** : L'application est trop lente.

**Solution** : Augmenter le timeout dans Nginx :
```bash
sudo nano /etc/nginx/sites-available/courrierk360-backend
```

Ajouter dans le bloc `location /` :
```nginx
proxy_connect_timeout 600;
proxy_send_timeout 600;
proxy_read_timeout 600;
send_timeout 600;
```

Puis redémarrer Nginx :
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### L'application ne démarre pas

**Vérifier les logs** :
```bash
pm2 logs courrierk360-backend --lines 50
```

**Vérifier le fichier .env** :
```bash
cat .env
```

**Vérifier la connexion MySQL** :
```bash
mysql -u patnuc_user -p -e "SELECT 1;"
```

### Port 3000 déjà utilisé

**Trouver le processus** :
```bash
lsof -i :3000
```

**Tuer le processus** :
```bash
kill -9 PID
```

---

## 📊 Structure finale

```
/var/www/html/patnuc_segmentation/
├── dist/                  # Code compilé
├── node_modules/          # Dépendances
├── prisma/
│   ├── schema.prisma      # Schéma de BD
│   └── migrations/        # Migrations
├── src/                   # Code source
├── .env                   # Variables d'environnement
├── package.json
└── tsconfig.json
```

---

## ✅ Checklist de déploiement

- [ ] MySQL installé et configuré
- [ ] Utilisateur `patnuc_user` créé avec permissions
- [ ] Base de données `patnuc_segmentation` créée
- [ ] Projet cloné dans `/var/www/html/patnuc_segmentation`
- [ ] Dépendances installées (`npm install --production`)
- [ ] Fichier `.env` configuré
- [ ] Prisma Client généré (`npx prisma generate`)
- [ ] Tables créées (`npx prisma db push`)
- [ ] Projet compilé (`npm run build`)
- [ ] Application démarrée avec PM2
- [ ] PM2 configuré pour démarrage auto (`pm2 startup` + `pm2 save`)
- [ ] Nginx configuré (`/etc/nginx/sites-available/patnuc_segmentation`)
- [ ] Site Nginx activé (lien symbolique)
- [ ] Configuration Nginx testée (`sudo nginx -t`)
- [ ] Nginx redémarré (`sudo systemctl restart nginx`)
- [ ] Firewall configuré (UFW)
- [ ] API accessible depuis le navigateur
- [ ] HTTPS configuré avec Let's Encrypt (optionnel)
- [ ] Backup automatique de la BD configuré (recommandé)

---

## 🎯 URLs finales

- **Sans HTTPS** : `http://votre_ip` ou `http://api.patnuc.com`
- **Avec HTTPS** : `https://api.patnuc.com`
- **Documentation Swagger** : `http://votre_ip/` ou `https://api.patnuc.com/`

---

## 📞 Support

Pour toute question :
- 📧 Email : support@patnuc.com
- 🐛 Issues : https://github.com/kiamaDRDE/patnuc_segmentation/issues

---

Bon déploiement ! 🚀
