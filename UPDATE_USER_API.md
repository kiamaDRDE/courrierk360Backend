# API de Mise à Jour des Utilisateurs

## 🔄 Nouvelle fonctionnalité : PATCH /signup/:id

### Description
Permet de mettre à jour partiellement les informations d'un utilisateur existant.

### Endpoint
**PATCH** `http://localhost:3000/signup/:id`

### Paramètres URL
- `id` (number, required) : L'identifiant de l'utilisateur à modifier

### Corps de la requête (tous les champs sont optionnels)

```json
{
  "nom": "Jean Dupont Modifié",
  "email": "nouveau.email@example.com",
  "numero": "+237688888888",
  "fonction": "Développeur Senior",
  "password": "nouveauMotDePasse123",
  "role": "SUPER_ADMIN"
}
```

### Champs modifiables
- `nom` (string, optionnel) : Nouveau nom
- `email` (string, optionnel) : Nouvel email (doit être unique)
- `numero` (string, optionnel) : Nouveau numéro
- `fonction` (string, optionnel) : Nouvelle fonction
- `password` (string, optionnel) : Nouveau mot de passe (sera haché automatiquement)
- `role` (enum, optionnel) : Nouveau rôle (UTILISATEUR ou SUPER_ADMIN)

### Réponses

#### ✅ Succès (200)
```json
{
  "success": true,
  "statusCode": 201,
  "code": "success",
  "title": "Mise à jour utilisateur",
  "message": "Utilisateur mis à jour avec succès.",
  "data": {
    "id": 1,
    "nom": "Jean Dupont Modifié",
    "email": "nouveau.email@example.com",
    "numero": "+237688888888",
    "fonction": "Développeur Senior",
    "role": "SUPER_ADMIN",
    "createdAt": "2025-12-12T10:41:24.000Z",
    "updatedAt": "2025-12-12T12:00:00.000Z"
  }
}
```

#### ❌ Utilisateur non trouvé (404)
```json
{
  "success": false,
  "statusCode": 404,
  "code": "failure",
  "title": "NotFoundException",
  "message": "Utilisateur non trouvé.",
  "data": []
}
```

#### ❌ Email déjà utilisé (400)
```json
{
  "success": false,
  "statusCode": 400,
  "code": "failure",
  "title": "BadRequestException",
  "message": "Cet email est déjà utilisé par un autre utilisateur.",
  "data": []
}
```

### Exemples d'utilisation

#### 1. Modifier uniquement le nom et la fonction
```bash
curl -X PATCH http://localhost:3000/signup/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Jean Dupont Modifié",
    "fonction": "Développeur Senior"
  }'
```

#### 2. Changer l'email et le rôle
```bash
curl -X PATCH http://localhost:3000/signup/1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau.email@example.com",
    "role": "SUPER_ADMIN"
  }'
```

#### 3. Changer uniquement le mot de passe
```bash
curl -X PATCH http://localhost:3000/signup/1 \
  -H "Content-Type: application/json" \
  -d '{
    "password": "nouveauMotDePasseSecurise123"
  }'
```

#### 4. Mise à jour complète
```bash
curl -X PATCH http://localhost:3000/signup/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Jean Dupont",
    "email": "jean.dupont.new@example.com",
    "numero": "+237677777777",
    "fonction": "Architecte Logiciel",
    "password": "superSecure456",
    "role": "UTILISATEUR"
  }'
```

### Fonctionnalités
- ✅ Mise à jour partielle (on ne met à jour que les champs fournis)
- ✅ Validation de l'unicité de l'email
- ✅ Hachage automatique du nouveau mot de passe
- ✅ Vérification de l'existence de l'utilisateur
- ✅ Retour des données sans le mot de passe
- ✅ Mise à jour automatique du champ `updatedAt`

### Routes disponibles maintenant

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/signup` | Créer un utilisateur |
| PATCH | `/signup/:id` | Mettre à jour un utilisateur |

### Documentation Swagger
La nouvelle route est automatiquement documentée dans Swagger :
- 📚 **http://localhost:3000** - Documentation interactive

Vous pouvez tester directement depuis Swagger avec les exemples fournis ! 🚀
