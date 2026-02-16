// src/common/search.service.ts

import { Injectable } from '@nestjs/common';

/**
 * Configuration pour la recherche sur une table
 */
export interface SearchConfig {
  /** Champs de type string à rechercher */
  stringFields?: string[];
  
  /** Champs de type number à rechercher (recherche exacte) */
  numberFields?: string[];
  
  /** Champs de type date à rechercher */
  dateFields?: string[];
  
  /** Relations à inclure dans le résultat */
  relations?: Record<string, boolean | object>;
  
  /** Filtres supplémentaires à appliquer (ex: isDelete: false) */
  baseFilters?: Record<string, any>;
}

@Injectable()
export class SearchService {
  /**
   * Construit une clause WHERE Prisma pour la recherche
   * @param searchTerm - Terme de recherche
   * @param config - Configuration de recherche pour la table
   * @returns Clause WHERE Prisma
   */
  buildSearchWhere(searchTerm: string | undefined, config: SearchConfig): any {
    const where: any = {};

    // Appliquer les filtres de base
    if (config.baseFilters) {
      Object.assign(where, config.baseFilters);
    }

    // Si pas de terme de recherche, retourner juste les filtres de base
    if (!searchTerm || searchTerm.trim() === '') {
      return where;
    }

    const trimmedSearch = searchTerm.trim();
    const searchConditions: any[] = [];

    // Recherche sur les champs string (LIKE/contains)
    if (config.stringFields && config.stringFields.length > 0) {
      config.stringFields.forEach((field) => {
        searchConditions.push({
          [field]: {
            contains: trimmedSearch,
            // Note: mode: 'insensitive' n'est pas supporté par MySQL, seulement PostgreSQL
          },
        });
      });
    }

    // Recherche sur les champs number (égalité exacte si le terme est un nombre)
    if (config.numberFields && config.numberFields.length > 0) {
      const numericValue = Number(trimmedSearch);
      if (!isNaN(numericValue)) {
        config.numberFields.forEach((field) => {
          searchConditions.push({
            [field]: numericValue,
          });
        });
      }
    }

    // Si on a des conditions de recherche, les combiner avec OR
    if (searchConditions.length > 0) {
      where.OR = searchConditions;
    }

    return where;
  }

  /**
   * Construit les options d'inclusion Prisma pour les relations
   * @param config - Configuration de recherche
   * @returns Options include pour Prisma
   */
  buildInclude(config: SearchConfig): any {
    return config.relations || {};
  }

  /**
   * Nettoie et normalise le terme de recherche
   * @param searchTerm - Terme de recherche brut
   * @returns Terme de recherche nettoyé
   */
  sanitizeSearchTerm(searchTerm: string | undefined): string | undefined {
    if (!searchTerm) return undefined;
    
    const trimmed = searchTerm.trim();
    if (trimmed === '') return undefined;
    
    return trimmed;
  }

  /**
   * Vérifie si un terme de recherche est valide
   * @param searchTerm - Terme de recherche
   * @param minLength - Longueur minimale (par défaut 1)
   * @returns true si valide
   */
  isValidSearchTerm(searchTerm: string | undefined, minLength: number = 1): boolean {
    if (!searchTerm) return false;
    return searchTerm.trim().length >= minLength;
  }
}
