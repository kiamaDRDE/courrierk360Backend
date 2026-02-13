// src/classe-courrier/classe-courrier.config.ts

import { SearchConfig } from '../common/search.service';

export const CLASSE_COURRIER_SEARCH_CONFIG: SearchConfig = {
  // Champs de type string où effectuer la recherche
  stringFields: ['nom'],

  // Champs de type number où effectuer la recherche
  numberFields: ['id'],

  // Pas de filtres de base pour cette table
  baseFilters: {},

  // Pas de relations pour cette table
  relations: {},
};
