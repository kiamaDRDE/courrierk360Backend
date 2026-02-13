// src/common/pagination.service.ts

import { Injectable } from '@nestjs/common';
import { PaginationMeta, PaginatedResult } from './interfaces/pagination.interface';

@Injectable()
export class PaginationService {
  /**
   * Calcule les métadonnées de pagination
   * @param page - Numéro de la page actuelle (commence à 1)
   * @param limit - Nombre d'éléments par page
   * @param total - Nombre total d'éléments
   * @returns Métadonnées de pagination complètes
   */
  createPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.min(page, totalPages || 1);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    const nextPage = hasNextPage ? currentPage + 1 : null;
    const previousPage = hasPreviousPage ? currentPage - 1 : null;
    const startIndex = (currentPage - 1) * limit;
    const endIndex = Math.min(startIndex + limit - 1, total - 1);

    return {
      currentPage,
      itemsPerPage: limit,
      totalItems: total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage,
      previousPage,
      startIndex,
      endIndex,
    };
  }

  /**
   * Calcule l'offset pour la requête Prisma
   * @param page - Numéro de la page
   * @param limit - Nombre d'éléments par page
   * @returns L'offset (skip) pour Prisma
   */
  getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Crée un résultat paginé complet
   * @param items - Liste des éléments
   * @param page - Numéro de la page
   * @param limit - Nombre d'éléments par page
   * @param total - Nombre total d'éléments
   * @returns Résultat paginé avec items et métadonnées
   */
  createPaginatedResult<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResult<T> {
    const pagination = this.createPaginationMeta(page, limit, total);

    return {
      items,
      pagination,
    };
  }

  /**
   * Valide les paramètres de pagination
   * @param page - Numéro de la page
   * @param limit - Nombre d'éléments par page
   * @returns Les paramètres validés et corrigés
   */
  validatePaginationParams(
    page?: number,
    limit?: number,
  ): { page: number; limit: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(Math.max(1, limit || 10), 100);

    return {
      page: validatedPage,
      limit: validatedLimit,
    };
  }

  /**
   * Génère des liens de pagination (utile pour les APIs RESTful)
   * @param baseUrl - URL de base
   * @param page - Numéro de la page actuelle
   * @param limit - Nombre d'éléments par page
   * @param total - Nombre total d'éléments
   * @returns Liens de pagination
   */
  createPaginationLinks(
    baseUrl: string,
    page: number,
    limit: number,
    total: number,
  ): {
    first: string;
    previous: string | null;
    current: string;
    next: string | null;
    last: string;
  } {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.min(page, totalPages || 1);

    const buildUrl = (p: number) => `${baseUrl}?page=${p}&limit=${limit}`;

    return {
      first: buildUrl(1),
      previous: currentPage > 1 ? buildUrl(currentPage - 1) : null,
      current: buildUrl(currentPage),
      next: currentPage < totalPages ? buildUrl(currentPage + 1) : null,
      last: buildUrl(totalPages || 1),
    };
  }
}
