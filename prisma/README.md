
# ⭐ DESCRIPTION DU SCHÉMA PRISMA – RAPPORT DE CONCEPTION (Version prête à intégrer)

## 1. Introduction

Le modèle de données de la plateforme de gestion de tontines a été conçu à l’aide du ORM Prisma, permettant une gestion structurée, sécurisée et performante de l’ensemble des informations liées aux utilisateurs, aux comptes, aux cotisations, aux transactions et aux opérations d’audit.
Le fichier schema.prisma représente la structure complète de la base MySQL, comprenant les énumérations métier et les relations entre entités.

L’approche retenue garantit :

- Une forte cohérence des données,
- Une évolutivité du modèle,
- Une traçabilité complète des opérations financières,
- Une optimisation des requêtes grâce aux indexes et contraintes uniques.

## 2. Structure Générale

Le schéma est organisé autour de deux grandes parties :

- Les énumérations, destinées à standardiser toutes les valeurs constantes du système (statuts, rôles, types de transactions…).
- Les modèles (tables), représentant les entités fonctionnelles et leurs relations.

Le générateur Prisma (prisma-client-js) permet la création automatique d’un client typé pour les opérations CRUD, tandis que le datasource configure la connexion au serveur MySQL.

## 3. Énumérations (Enums)

Les enums permettent d’éviter les fautes de saisie et de garantir une cohérence fonctionnelle.

### ✔ UserStatus

Décrit l’état d’un utilisateur dans la plateforme :

- En attente de validation
- Actif
- Suspendu
- Bloqué

### ✔ UserRole

Définit le niveau d’accès :

- Membre (par défaut)
- Gérant
- Administrateur

### ✔ MoyenPaiement

Liste les moyens de paiement utilisés dans la tontine :

- Mobile Money (MOMO)
- Orange Money (OM)
- Système interne

### ✔ TypeTransaction

- Crédit
- Débit

### ✔ TypeAuteurTransaction

- Utilisateur
- Système

### ✔ Fréquence

Utilisée pour définir la périodicité des cotisations :

- Journalier, Hebdomadaire, Mensuel, etc.

### ✔ TypeCompte

- Épargne
- Compte bloqué

### ✔ StatusTransaction

- En attente
- Validée
- Échec

### ✔ CategorieLog

Classification des logs d’audit :

- Sécurité
- Transaction
- Système

## 4. Modèles (Tables principales)

Les enums permettent d’éviter les fautes de saisie et de garantir une cohérence fonctionnelle.

### 🧩 4.1. User

Représente les membres de la plateforme.
Les principales informations stockées sont :

- Informations d’identification (nom, email, téléphone, username),
- Rôle et statut,
- OTPs de connexion / vérification,
- okens de rafraîchissement,
- Date de création et de mise à jour.

Relations :

- Un utilisateur possède plusieurs comptes,
- Plusieurs transactions peuvent être créées par cet utilisateur,
- L’utilisateur peut détenir plusieurs enregistrements d’audit,
- Un utilisateur peut être lié à plusieurs affiliations.

#### User ↔ Affiliation (Relation importante)

Explication :

- Un utilisateur peut avoir 0 ou plusieurs affiliations (codes de parrainage)
- À la création d'un user :
- - Le système génère automatiquement un premier code d'affiliation au format PAY00...
- - Ce code est unique et stocké dans la table Affiliation
- - L'utilisateur peut ultérieurement créer d'autres codes d'affiliation.

#### User ↔ Compte (Relation système)

Explication :

- Un user peut avoir 0 ou plusieurs comptes

### 🧩 4.2. Compte

Il s’agit du compte de tontine appartenant à un utilisateur.
Chaque compte contient :

- Un montant de cotisation,
- Une fréquence,
- Un type de compte (épargne ou bloqué),
- Les pénalités applicables,
- Un solde actualisé,
- Des dates de début/fin,
- Un indicateur de blocage,
- L’état de notification.

Il existe une contrainte unique imposant qu’un même utilisateur ne puisse pas avoir deux comptes avec le même nom.

Relations

- Un compte appartient à un seul utilisateur,
- Un compte possède plusieurs transactions.

#### Compte ↔ Transaction

Explication :

- Un compte peut avoir 0 ou plusieurs transactions
- Les transactions sont créées :
- - Lors des cotisations de l'utilisateur
- - Lors des opérations système (frais, intérêts, etc.)
- - Lors des transferts entre comptes

### 🧩 4.3. Transaction

Chaque transaction représente un mouvement financier sur un compte.
Les informations enregistrées comprennent :

- Le montant,
- Le type de transaction (débit / crédit),
- Le moyen de paiement,
- L’auteur (utilisateur ou système),
- Le statut,
- La date de création et de mise à jour.

Relations

- Une transaction est liée à un compte,
- Une transaction peut être initiée par un utilisateur ou générée automatiquement par le système.

### 🧩 4.4. Parametre

Table centrale permettant de gérer les règles métier :

- Taux minimums des pénalités,
- Frais d’entretien,
- Fréquence d’entretien,
- Activation/désactivation des entretiens automatiques.

Cette table facilite le paramétrage dynamique du système sans modification de code.

#### Impact sur les calculs

- Calcul des pénalités : Les taux penaliteRetardMin et penaliteRetardMax influencent directement le calcul des pénalités sur retards de paiement
- Frais automatiques : Si entretienAuto = true, le système applique automatiquement les fraisEntretien selon la frequenceEntretien
- Flexibilité : Modification des paramètres sans recodage

### 🧩 4.5. JournalAudit

Permet de suivre toutes les opérations sensibles effectuées dans le système.
Chaque log indique :

- L’utilisateur concerné,
- L’action exécutée,
- Les détails techniques,
- La catégorie (sécurité, transaction, système),
- L’adresse IP,
- La date de l’événement.

Cet audit assure la traçabilité complète des opérations pour répondre aux exigences de sécurité.

#### Traçabilité garantie pour

- ✅ Toutes les actions de chaque utilisateur
- ✅ Les opérations système automatiques
- ✅ Les transactions financières
- ✅ Les modifications de paramètres
- ✅ Les connexions/déconnexions

### 🧩 4.6. Affiliation

Gère le système de parrainage et de codes d’affiliation.
Chaque code est unique et rattaché à un utilisateur.
Un historisation complète est assurée grâce aux champs createdAt et updatedAt.

## 5. Gestion des relations

Le schéma établit différents types de relations entre les modèles :

### ✔ One-to-Many

- Un utilisateur → plusieurs comptes
- Un compte → plusieurs transactions

### ✔ Optional Relations

- Une transaction peut avoir un auteur (mais pas obligatoire)
- Un journal peut être associé ou non à un utilisateur
- Une affiliation peut être liée ou non à un utilisateur

### ✔ Cascade Rules

Les règles de suppression sont configurées pour garantir la cohérence :

- Suppression d’un utilisateur → suppression automatique de ses comptes, transactions, affiliations et audits.

## 6. Optimisations

Afin de maximiser la performance de MySQL et Prisma, plusieurs optimisations ont été intégrées :

### ✔ Indexes sur

- Les identifiants,
- Les clés étrangères,
- Les champs sensibles (username, status, typeTransaction…),
→ Permettant d’accélérer les requêtes massives.

### ✔ Contraintes uniques

- Code d’affiliation,
- Combinaison nom + propriétaire pour les comptes.

### ✔ Types SQL adaptés

- Decimal(20,2) pour les valeurs monétaires,
- VarChar(191) optimisé pour MySQL InnoDB (compatibilité index UTF8).

## 7. FLUX D'INITIALISATION D'UN UTILISATEUR

![Flux](/logo.png "FLUX D'INITIALISATION D'UN UTILISATEUR")

## 8. Conclusion

Le schéma Prisma mis en place constitue la fondation technique de la plateforme de tontine.
Il est robuste, sécurisé, scalable et totalement conforme aux règles métier définies. Grâce à Prisma, ce modèle garantit une synchronisation fiable avec la base MySQL et permet une évolution future du système sans contrainte majeure.
