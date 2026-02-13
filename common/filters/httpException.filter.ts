// // src/common/filters/httpException.filter.ts

// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpException,
//   HttpStatus,
// } from '@nestjs/common';
// import { Response } from 'express';
// import { ResponseApi } from '../responseApi.dto';

// @Catch()
// export class HttpExceptionFilter implements ExceptionFilter {
//   catch(exception: any, host: ArgumentsHost) {
//     const response = host.switchToHttp().getResponse<Response>();

//     let status: number;
//     let message: string;

//     if (exception instanceof HttpException) {
//       // Si l'exception est une HttpException, on récupère son statut et son message
//       status = exception.getStatus();
//       const errorResponse = exception.getResponse();
//       message =
//         typeof errorResponse === 'string'
//           ? errorResponse
//           : (errorResponse as any).message || exception.message;
//     } else {
//       // Si l'exception n'est pas une HttpException, c'est une erreur serveur (500)
//       status = HttpStatus.INTERNAL_SERVER_ERROR;
//       message = 'Internal server error';
//     }

//     const errorResponse = this.buildErrorResponse(exception, status, message);

//     response.status(status).json(errorResponse);
//   }

//   private buildErrorResponse(
//     exception: any,
//     statusCode: number,
//     message: string,
//   ): ResponseApi<any> {
//     const title = exception?.name || 'Error';
//     const code =
//       statusCode === 200 || statusCode === 201 ? 'success' : 'failure';
//     const success = statusCode === 200 || statusCode === 201;

//     return new ResponseApi(
//       success,
//       statusCode,
//       code,
//       title,
//       message,
//       [], // Tableau vide pour "data"
//     );
//   }
// }


// src/common/filters/httpException.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';

interface ApiResponse {
  success: boolean;
  statusCode: number;
  code: string;
  title: string;
  message: string;
  data?: any;
  errors?: any;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number;
    let message: string | string[];
    let title: string;
    let code: string;
    let errors: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      // Extraire le message (peut être string ou objet)
      if (typeof errorResponse === 'string') {
        message = errorResponse;
        title = exception.name || 'Error';
      } else if (typeof errorResponse === 'object') {
        // Si le formatteur de réponse a déjà été utilisé
        if ('success' in errorResponse && 'title' in errorResponse) {
          return response.status(200).json(errorResponse);
        }

        message = (errorResponse as any).message || exception.message;
        title = (errorResponse as any).title || exception.name || 'Error';
        errors = (errorResponse as any).errors;
      } else {
        message = exception.message;
        title = exception.name || 'Error';
      }

      // Déterminer le code en fonction du type d'exception
      code = this.getErrorCode(exception, status);
    } else {
      // Erreur non HTTP (erreur serveur)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception?.message || 'Une erreur inattendue s\'est produite.';
      title = 'Erreur serveur';
      code = 'server_error';
      errors = {
        message: exception?.message || null,
        stack: exception?.stack || null,
        name: exception?.name || null,
      };

      console.error('❌ Erreur non gérée:', exception);
    }

    // Construire la réponse standardisée
    const errorResponse = this.buildErrorResponse(
      status,
      code,
      title,
      Array.isArray(message) ? message.join(', ') : message,
      errors,
    );

    // ⚠️ Retourner toujours HTTP 200 avec le vrai statut dans le body
    response.status(200).json(errorResponse);
  }

  private getErrorCode(exception: HttpException, status: number): string {
    // Mapper les exceptions aux codes
    if (exception instanceof BadRequestException) {
      return 'validation_error';
    }
    if (exception instanceof UnauthorizedException) {
      return 'unauthorized';
    }
    if (exception instanceof ForbiddenException) {
      return 'forbidden';
    }
    if (exception instanceof NotFoundException) {
      return 'not_found';
    }
    if (exception instanceof ConflictException) {
      return 'conflict';
    }
    if (exception instanceof InternalServerErrorException) {
      return 'server_error';
    }

    // Mapper par code de statut si aucun type spécifique
    const codeMap: { [key: number]: string } = {
      400: 'bad_request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not_found',
      409: 'conflict',
      422: 'unprocessable_entity',
      500: 'server_error',
      502: 'bad_gateway',
      503: 'service_unavailable',
    };

    return codeMap[status] || 'error';
  }

  private buildErrorResponse(
    statusCode: number,
    code: string,
    title: string,
    message: string,
    errors?: any,
  ): ApiResponse {
    const response: ApiResponse = {
      success: false,
      statusCode,
      code,
      title,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }
}
