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
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseApi } from '../responseApi.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      // Si l'exception est une HttpException, on récupère son statut et son message
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message =
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as any).message || exception.message;
    } else {
      // Si l'exception n'est pas une HttpException, c'est une erreur serveur (500)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    // ✅ On construit la réponse normalisée
    const errorResponse = this.buildErrorResponse(exception, status, message);

    // ⚠️ On renvoie TOUJOURS HTTP 200
    response.status(200).json(errorResponse);
  }

  private buildErrorResponse(
    exception: any,
    statusCode: number,
    message: string,
  ): ResponseApi<any> {
    const title = exception?.name || 'Error';
    const code =
      statusCode === 200 || statusCode === 201 ? 'success' : 'failure';
    const success = statusCode === 200 || statusCode === 201;

    return new ResponseApi(
      success,
      statusCode, // <-- ton vrai statut logique
      code,
      title,
      message,
      [], // data vide
    );
  }
}
