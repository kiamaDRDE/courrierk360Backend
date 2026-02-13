// src/common/response-formatter.service.ts

import { Injectable } from '@nestjs/common';
import { PaginatedResult } from './interfaces/pagination.interface';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  code: string;
  title: string;
  message: string;
  data?: T;
  errors?: any;
}

@Injectable()
export class ResponseFormatterService {
  /**
   * Format une réponse de succès
   * @param data - Les données à retourner
   * @param title - Le titre de la réponse
   * @param message - Le message de la réponse
   * @param statusCode - Le code HTTP (par défaut 200)
   */
  success<T>(
    data: T,
    title: string,
    message: string,
    statusCode: number = 200,
  ): ApiResponse<T> {
    return {
      success: true,
      statusCode,
      code: 'success',
      title,
      message,
      data,
    };
  }

  /**
   * Format une réponse de création réussie
   * @param data - Les données créées
   * @param title - Le titre de la réponse
   * @param message - Le message de la réponse
   */
  created<T>(data: T, title: string, message: string): ApiResponse<T> {
    return {
      success: true,
      statusCode: 201,
      code: 'created',
      title,
      message,
      data,
    };
  }

  /**
   * Format une réponse de mise à jour réussie
   * @param data - Les données mises à jour
   * @param title - Le titre de la réponse
   * @param message - Le message de la réponse
   */
  updated<T>(data: T, title: string, message: string): ApiResponse<T> {
    return {
      success: true,
      statusCode: 200,
      code: 'updated',
      title,
      message,
      data,
    };
  }

  /**
   * Format une réponse de suppression réussie
   * @param title - Le titre de la réponse
   * @param message - Le message de la réponse
   * @param data - Données optionnelles
   */
  deleted<T = any>(title: string, message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      statusCode: 200,
      code: 'deleted',
      title,
      message,
      data,
    };
  }

  /**
   * Format une réponse avec pagination
   * @param paginatedResult - Résultat paginé contenant items et pagination
   * @param title - Le titre de la réponse
   * @param message - Le message de la réponse
   */
  paginated<T>(
    paginatedResult: PaginatedResult<T>,
    title: string,
    message: string,
  ): ApiResponse<PaginatedResult<T>> {
    return {
      success: true,
      statusCode: 200,
      code: 'success',
      title,
      message,
      data: paginatedResult,
    };
  }

  /**
   * Format une réponse d'erreur de validation (400)
   * @param title - Le titre de l'erreur
   * @param message - Le message d'erreur
   * @param errors - Les détails des erreurs de validation
   */
  validationError(
    title: string,
    message: string,
    errors?: any,
  ): ApiResponse {
    return {
      success: false,
      statusCode: 400,
      code: 'validation_error',
      title,
      message,
      errors,
    };
  }

  /**
   * Format une réponse d'erreur non autorisé (401)
   * @param title - Le titre de l'erreur
   * @param message - Le message d'erreur
   */
  unauthorized(title: string, message: string): ApiResponse {
    return {
      success: false,
      statusCode: 401,
      code: 'unauthorized',
      title,
      message,
    };
  }

  /**
   * Format une réponse d'erreur interdit (403)
   * @param title - Le titre de l'erreur
   * @param message - Le message d'erreur
   */
  forbidden(title: string, message: string): ApiResponse {
    return {
      success: false,
      statusCode: 403,
      code: 'forbidden',
      title,
      message,
    };
  }

  /**
   * Format une réponse d'erreur non trouvé (404)
   * @param title - Le titre de l'erreur
   * @param message - Le message d'erreur
   */
  notFound(title: string, message: string): ApiResponse {
    return {
      success: false,
      statusCode: 404,
      code: 'not_found',
      title,
      message,
    };
  }

  /**
   * Format une réponse d'erreur de conflit (409)
   * @param title - Le titre de l'erreur
   * @param message - Le message d'erreur
   */
  conflict(title: string, message: string): ApiResponse {
    return {
      success: false,
      statusCode: 409,
      code: 'conflict',
      title,
      message,
    };
  }

  /**
   * Format une réponse d'erreur serveur (500)
   * @param title - Le titre de l'erreur
   * @param message - Le message d'erreur
   */
  serverError(title: string, message: string): ApiResponse {
    return {
      success: false,
      statusCode: 500,
      code: 'server_error',
      title,
      message,
    };
  }

  /**
   * Format une réponse d'erreur personnalisée
   * @param statusCode - Le code HTTP
   * @param code - Le code d'erreur personnalisé
   * @param title - Le titre de l'erreur
   * @param message - Le message d'erreur
   * @param errors - Les détails optionnels des erreurs
   */
  error(
    statusCode: number,
    code: string,
    title: string,
    message: string,
    errors?: any,
  ): ApiResponse {
    return {
      success: false,
      statusCode,
      code,
      title,
      message,
      errors,
    };
  }
}
