// src/common/filters/httpException.filter.js

'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require('@nestjs/common');
const responseApi_dto_1 = require('../responseApi.dto');
let HttpExceptionFilter = class HttpExceptionFilter {
  catch(exception, host) {
    const response = host.switchToHttp().getResponse();
    let status;
    let message;
    if (exception instanceof common_1.HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message =
        typeof errorResponse === 'string'
          ? errorResponse
          : errorResponse.message || exception.message;
    } else {
      status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }
    const errorResponse = this.buildErrorResponse(exception, status, message);
    response.status(status).json(errorResponse);
  }
  buildErrorResponse(exception, statusCode, message) {
    const title = exception?.name || 'Error';
    const code =
      statusCode === 200 || statusCode === 201 ? 'success' : 'failure';
    const success = statusCode === 200 || statusCode === 201;
    return new responseApi_dto_1.ResponseApi(
      success,
      statusCode,
      code,
      title,
      message,
      [],
    );
  }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate(
  [(0, common_1.Catch)()],
  HttpExceptionFilter,
);
//# sourceMappingURL=httpException.filter.js.map
