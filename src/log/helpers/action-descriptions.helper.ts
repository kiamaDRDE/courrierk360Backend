// src/log/helpers/action-descriptions.helper.ts

/**
 * Helper pour comprendre les descriptions d'action automatiques
 * Utilisé pour documenter les messages générés par le LoggingInterceptor
 */

export interface ActionExample {
  method: string;
  url: string;
  description: string;
  example: string;
}

/**
 * Exemples de descriptions d'action générées automatiquement
 * Ces exemples montrent aux développeurs frontend ce qu'ils peuvent attendre
 * comme messages dans les logs
 */
export const ACTION_DESCRIPTIONS_EXAMPLES: ActionExample[] = [
  // Opérations CRUD de base
  {
    method: 'GET',
    url: '/operateur',
    description: 'Liste des entités',
    example: 'Liste des opérateurs'
  },
  {
    method: 'GET',
    url: '/operateur/123',
    description: 'Consultation d\'une entité spécifique',
    example: 'Consultation d\'opérateur'
  },
  {
    method: 'POST',
    url: '/operateur',
    description: 'Création d\'une nouvelle entité',
    example: 'Création d\'opérateur'
  },
  {
    method: 'PATCH',
    url: '/operateur/123',
    description: 'Modification d\'une entité',
    example: 'Modification d\'opérateur'
  },
  {
    method: 'DELETE',
    url: '/operateur/123',
    description: 'Suppression d\'une entité',
    example: 'Suppression d\'opérateur'
  },

  // Opérations d'authentification
  {
    method: 'POST',
    url: '/auth/login',
    description: 'Connexion utilisateur',
    example: 'Connexion utilisateur'
  },
  {
    method: 'POST',
    url: '/auth/logout',
    description: 'Déconnexion utilisateur',
    example: 'Déconnexion utilisateur'
  },
  {
    method: 'POST',
    url: '/auth/refresh',
    description: 'Renouvellement du token',
    example: 'Renouvellement du token'
  },

  // Opérations spécialisées
  {
    method: 'GET',
    url: '/operateur/stats',
    description: 'Consultation des statistiques',
    example: 'Consultation des statistiques d\'opérateur'
  },
  {
    method: 'GET',
    url: '/operateur/export',
    description: 'Export des données',
    example: 'Export des données d\'opérateur'
  },
  {
    method: 'POST',
    url: '/offre/123/calculer-effet-club',
    description: 'Actions spécialisées avec ID',
    example: 'Calcul de l\'effet club pour offre'
  },

  // Opérations par lot
  {
    method: 'PATCH',
    url: '/structure-tarifaire',
    description: 'Modification multiple',
    example: 'Modification multiple de structure tarifaires'
  },
  {
    method: 'DELETE',
    url: '/logs/cleanup',
    description: 'Nettoyage/maintenance',
    example: 'Nettoyage des anciens logs'
  },

  // Gestion des mots de passe
  {
    method: 'POST',
    url: '/forgot-password/request',
    description: 'Demande de réinitialisation',
    example: 'Demande de réinitialisation de mot de passe'
  },
  {
    method: 'POST',
    url: '/forgot-password/reset',
    description: 'Réinitialisation effective',
    example: 'Réinitialisation de mot de passe'
  },
  {
    method: 'PATCH',
    url: '/user/password',
    description: 'Modification de mot de passe',
    example: 'Modification du mot de passe d\'utilisateur'
  },
];

/**
 * Mapping des entités vers leurs noms lisibles
 * Utilisé pour normaliser les noms dans les descriptions
 */
export const ENTITY_READABLE_NAMES: Record<string, string> = {
  'auth': 'authentification',
  'signup': 'inscription',
  'user': 'utilisateur',
  'operateur': 'opérateur',
  'offre': 'offre',
  'structure-tarifaire': 'structure tarifaire',
  'avantage': 'avantage',
  'service': 'service',
  'tarif-interconnexion': 'tarif d\'interconnexion',
  'type-appel': 'type d\'appel',
  'type-operateur': 'type d\'opérateur',
  'option': 'option',
  'consommation-moyenne': 'consommation moyenne',
  'trafic': 'trafic',
  'abonnement': 'abonnement',
  'chiffre-affaire': 'chiffre d\'affaires',
  'ihh': 'IHH',
  'caracteristique': 'caractéristique',
  'parametre': 'paramètre',
  'forgot-password': 'mot de passe oublié',
};

/**
 * Patterns d'URL reconnus par le système
 * Aide les développeurs à comprendre comment leurs routes seront interprétées
 */
export const URL_PATTERNS = [
  {
    pattern: 'GET /entity',
    description: 'Liste des {entity}s',
    note: 'Récupération de la liste complète'
  },
  {
    pattern: 'GET /entity/:id',
    description: 'Consultation de {entity}',
    note: 'Affichage des détails d\'un élément spécifique'
  },
  {
    pattern: 'GET /entity/stats',
    description: 'Consultation des statistiques de {entity}',
    note: 'Données statistiques et métriques'
  },
  {
    pattern: 'GET /entity/export',
    description: 'Export des données de {entity}',
    note: 'Génération de fichier d\'export (CSV, JSON, etc.)'
  },
  {
    pattern: 'POST /entity',
    description: 'Création de {entity}',
    note: 'Ajout d\'un nouvel élément'
  },
  {
    pattern: 'POST /entity/:id/action',
    description: 'Action {action} sur {entity}',
    note: 'Actions spécialisées (calculer, activer, etc.)'
  },
  {
    pattern: 'PATCH /entity/:id',
    description: 'Modification de {entity}',
    note: 'Mise à jour d\'un élément existant'
  },
  {
    pattern: 'PATCH /entity',
    description: 'Modification multiple de {entity}s',
    note: 'Mise à jour par lot'
  },
  {
    pattern: 'DELETE /entity/:id',
    description: 'Suppression de {entity}',
    note: 'Suppression d\'un élément spécifique'
  },
  {
    pattern: 'DELETE /entity/cleanup',
    description: 'Nettoyage des anciens {entity}s',
    note: 'Maintenance et nettoyage'
  },
];

/**
 * Fonction utilitaire pour obtenir des exemples de descriptions
 * selon un critère spécifique
 */
export function getExamplesByMethod(method: string): ActionExample[] {
  return ACTION_DESCRIPTIONS_EXAMPLES.filter(example => 
    example.method.toUpperCase() === method.toUpperCase()
  );
}

/**
 * Fonction utilitaire pour obtenir des exemples de descriptions
 * selon une entité spécifique
 */
export function getExamplesByEntity(entity: string): ActionExample[] {
  return ACTION_DESCRIPTIONS_EXAMPLES.filter(example => 
    example.url.includes(`/${entity}`)
  );
}

/**
 * Guide pour les développeurs frontend
 */
export const FRONTEND_DEVELOPER_GUIDE = {
  title: 'Guide des Messages d\'Action Automatiques',
  description: 'Ce système génère automatiquement des descriptions d\'action claires basées sur les requêtes HTTP',
  
  howItWorks: [
    '1. Chaque requête HTTP est interceptée automatiquement',
    '2. La méthode HTTP (GET, POST, PATCH, DELETE) et l\'URL sont analysées',
    '3. Un message d\'action clair est généré en français',
    '4. Le log est enregistré avec toutes les métadonnées pertinentes',
  ],
  
  benefits: [
    '✅ Messages compréhensibles par tous les utilisateurs',
    '✅ Pas besoin d\'ajouter du code de logging manuel',
    '✅ Cohérence dans toute l\'application',
    '✅ Support automatique des nouvelles routes',
    '✅ Informations détaillées pour le debugging',
  ],
  
  logStructure: {
    description: 'Structure des logs générés automatiquement',
    fields: {
      id: 'Identifiant unique du log',
      userId: 'ID de l\'utilisateur qui a effectué l\'action',
      action: 'Code d\'action technique (enum)',
      module: 'Module concerné (enum)',
      level: 'Niveau du log (INFO, SUCCESS, WARNING, ERROR)',
      description: 'Message d\'action généré automatiquement',
      ipAddress: 'Adresse IP de la requête',
      metadata: {
        method: 'Méthode HTTP',
        url: 'URL complète',
        statusCode: 'Code de réponse HTTP',
        duration: 'Durée en millisecondes',
        userAgent: 'Navigateur/client utilisé',
        requestSize: 'Taille de la requête',
        responseSize: 'Taille de la réponse',
      },
      createdAt: 'Date/heure de création',
      user: 'Informations de l\'utilisateur',
    },
  },
};
