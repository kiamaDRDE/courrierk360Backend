# 📋 Configuration Serveur Actuel - Courrier KIAMA 360

**Date de configuration** : Février 2026  
**IP Serveur** : 185.98.136.192  
**Système** : Ubuntu 20.04+ LTS

---

## 🔧 Logiciels Installés sur le Serveur VPS

### 1. **Système d'exploitation**
- Ubuntu 20.04 ou supérieur (LTS)

### 2. **Runtime & Environnement**
- **Node.js** : Version 18.x ou supérieur
- **npm** : Gestionnaire de paquets Node.js

### 3. **Base de données**
- **MySQL** : Version 8.x
  - Base de données : `patnuc_segmentation` (ou `courrierk360`)
  - Utilisateur : `patnuc_user` (ou `courrierk360_user`)
  - Charset : utf8mb4_unicode_ci
  - Port : 3306

### 4. **Serveur Web**
- **Nginx** : Serveur web / Reverse Proxy
  - Écoute sur le port 80
  - Proxy vers Node.js sur port 3000

### 5. **Process Manager**
- **PM2** : Gestionnaire de processus Node.js
  - Démarrage automatique au boot
  - Monitoring et logs
  - Redémarrage automatique en cas de crash

### 6. **Sécurité**
- **UFW (Uncomplicated Firewall)** : Pare-feu
  - SSH (OpenSSH)
  - HTTP (Nginx Full)

---

## 📦 Application Backend Installée

### **Courrier KIAMA 360 Backend**

**Framework** : NestJS 11.0.1  
**ORM** : Prisma 6.19.1  
**Port interne** : 3000  
**Emplacement** : `/var/www/html/patnuc_segmentation`

#### Dépendances principales installées :
```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/jwt": "^11.0.2",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/platform-express": "^11.1.6",
  "@nestjs/swagger": "^11.2.3",
  "@prisma/client": "^6.19.1",
  "bcryptjs": "^3.0.3",
  "class-validator": "^0.14.1",
  "nodemailer": "^7.0.11",
  "passport-jwt": "^4.0.1",
  "winston": "^3.19.0"
}
```

---

## 🌐 Configuration Nginx Actuelle

### Fichier de configuration
**Emplacement** : `/etc/nginx/sites-available/patnuc_segmentation`  
**Lien symbolique** : `/etc/nginx/sites-enabled/patnuc_segmentation`

### Configuration complète

```nginx
server {
    listen 80;
    server_name 185.98.136.192;  # IP du serveur

    # Logs
    access_log /var/log/nginx/patnuc_segmentation-access.log;
    error_log /var/log/nginx/patnuc_segmentation-error.log;

    # Taille max des requêtes (uploads)
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

### Fonctionnalités activées :
- ✅ Reverse proxy vers Node.js (port 3000)
- ✅ Support WebSocket (Upgrade, Connection headers)
- ✅ Upload de fichiers jusqu'à 50 MB
- ✅ Forwarding des headers client (IP réelle, etc.)
- ✅ Logs séparés (access + erreurs)
- ✅ Cache bypass pour contenu dynamique

---

## 🗄️ Configuration Base de Données MySQL

### Informations de connexion

```env
Host: 127.0.0.1 (localhost)
Port: 3306
Base de données: patnuc_segmentation
Utilisateur: patnuc_user
Charset: utf8mb4_unicode_ci
```

### Privilèges accordés
```sql
GRANT ALL PRIVILEGES ON patnuc_segmentation.* TO 'patnuc_user'@'localhost';
GRANT SELECT ON mysql.* TO 'patnuc_user'@'localhost';
```

---

## 🔐 Configuration Pare-feu (UFW)

### Règles actives

```bash
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

**Ports ouverts** :
- Port 22 : SSH
- Port 80 : HTTP (Nginx)
- Port 443 : HTTPS (si configuré)

---

## 🚀 Configuration PM2

### Application enregistrée

**Nom** : `courrierk360-backend` ou `patnuc_segmentation`  
**Script** : `dist/main.js`  
**Mode** : Production  
**Démarrage auto** : ✅ Activé (via `pm2 startup` + `pm2 save`)

### Commandes PM2 configurées

```bash
pm2 start dist/main.js --name patnuc_segmentation
pm2 startup  # Démarrage automatique au boot
pm2 save     # Sauvegarde de la configuration
```

---

## 📁 Structure des Répertoires

```
/var/www/html/patnuc_segmentation/
├── dist/                      # Code compilé (JavaScript)
│   ├── main.js               # Point d'entrée
│   └── public/               # Fichiers statiques copiés
├── node_modules/             # Dépendances NPM
├── prisma/
│   ├── schema.prisma         # Schéma de base de données
│   └── migrations/           # Migrations (si utilisées)
├── src/                      # Code source TypeScript
│   ├── main.ts
│   ├── app.module.ts
│   └── [modules]/
├── public/                   # Uploads et fichiers statiques
│   ├── courrier/
│   ├── courrier-depart/
│   ├── reponses/
│   └── transmissions/
├── .env                      # Variables d'environnement
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 🔧 Variables d'Environnement (.env)

```env
# Environnement
NODE_ENV=production

# Base de données
DATABASE_URL="mysql://patnuc_user:Patnuc2025!@localhost:3306/patnuc_segmentation"

# JWT Secrets
JWT_SECRET="[secret_securise]"
JWT_REFRESH_SECRET="[secret_securise]"

# Port application
PORT=3000

# Frontend URL
FRONTEND_URL="http://185.98.136.192:8082"
```

---

## 🌍 URLs d'Accès

- **Backend API** : http://185.98.136.192
- **Documentation Swagger** : http://185.98.136.192/
- **Frontend** : http://185.98.136.192:8082 (si installé)

---

## 📊 Logs et Monitoring

### Logs Nginx
- **Access** : `/var/log/nginx/patnuc_segmentation-access.log`
- **Erreurs** : `/var/log/nginx/patnuc_segmentation-error.log`

### Logs Application (PM2)
```bash
pm2 logs patnuc_segmentation          # Temps réel
pm2 logs patnuc_segmentation --lines 100  # 100 dernières lignes
```

### Logs Application (Winston)
- Rotation journalière activée
- Niveaux : INFO, WARNING, ERROR, SUCCESS

---

## 🔄 Processus de Déploiement Utilisé

1. ✅ Installation de Node.js 18.x
2. ✅ Installation de MySQL 8.x
3. ✅ Installation de Nginx
4. ✅ Installation de PM2 (`npm install -g pm2`)
5. ✅ Création base de données et utilisateur MySQL
6. ✅ Clone/Upload du projet dans `/var/www/html/patnuc_segmentation`
7. ✅ Installation dépendances : `npm install --production`
8. ✅ Configuration fichier `.env`
9. ✅ Génération Prisma Client : `npx prisma generate`
10. ✅ Synchronisation base de données : `npx prisma db push`
11. ✅ Compilation TypeScript : `npm run build`
12. ✅ Copie dossier public : `cp -r public dist/public`
13. ✅ Démarrage PM2 : `pm2 start dist/main.js --name patnuc_segmentation`
14. ✅ Configuration PM2 auto-start : `pm2 startup` + `pm2 save`
15. ✅ Configuration Nginx : `/etc/nginx/sites-available/patnuc_segmentation`
16. ✅ Activation site Nginx : lien symbolique vers `sites-enabled`
17. ✅ Test configuration : `sudo nginx -t`
18. ✅ Redémarrage Nginx : `sudo systemctl restart nginx`
19. ✅ Configuration firewall UFW

---

## 🛠️ Commandes de Maintenance

### Redémarrer l'application
```bash
pm2 restart patnuc_segmentation
```

### Voir les logs
```bash
pm2 logs patnuc_segmentation
```

### Redémarrer Nginx
```bash
sudo systemctl restart nginx
```

### Backup base de données
```bash
mysqldump -u patnuc_user -p patnuc_segmentation > backup_$(date +%Y%m%d).sql
```

---

## ✅ État Actuel

- ✅ Serveur opérationnel
- ✅ Backend accessible via http://185.98.136.192
- ✅ Base de données MySQL fonctionnelle
- ✅ Nginx configuré en reverse proxy
- ✅ PM2 avec auto-restart
- ✅ Firewall UFW activé
- ⚠️ HTTPS non configuré (recommandé pour la production)

---

## 📝 Prochaines Étapes Recommandées

1. **Configurer HTTPS avec Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d votre-domaine.com
   ```

2. **Configurer les backups automatiques**
   - Backup quotidien de la base de données
   - Backup des fichiers uploadés

3. **Monitoring avancé**
   - Installation d'outils de monitoring (Prometheus, Grafana)
   - Alertes en cas de problème

4. **Optimisation**
   - Configuration du mode cluster PM2
   - Mise en cache Nginx
   - Compression gzip

---

**Document généré le** : 23 février 2026  
**Serveur** : 185.98.136.192:8081
**Status** : ✅ Production
