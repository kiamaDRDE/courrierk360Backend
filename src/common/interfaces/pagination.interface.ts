// src/common/interfaces/pagination.interface.ts

export interface PaginationMeta {
  /** Numéro de la page actuelle */
  currentPage: number;

  /** Nombre d'éléments par page */
  itemsPerPage: number;

  /** Nombre total d'éléments */
  totalItems: number;

  /** Nombre total de pages */
  totalPages: number;

  /** Y a-t-il une page suivante ? */
  hasNextPage: boolean;

  /** Y a-t-il une page précédente ? */
  hasPreviousPage: boolean;

  /** Numéro de la page suivante (null si aucune) */
  nextPage: number | null;

  /** Numéro de la page précédente (null si aucune) */
  previousPage: number | null;

  /** Index du premier élément de la page (0-based) */
  startIndex: number;

  /** Index du dernier élément de la page (0-based) */
  endIndex: number;
}

export interface PaginatedResult<T> {
  /** Liste des éléments de la page */
  items: T[];

  /** Métadonnées de pagination */
  pagination: PaginationMeta;
}
