// src/common/responseApi.dto.js

'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResponseApi = void 0;
const openapi = require('@nestjs/swagger');
class ResponseApi {
  constructor(success, statusCode, code, title, message, data) {
    this.success = success;
    this.statusCode = statusCode;
    this.code = code;
    this.title = title;
    this.message = message;
    this.data = data;
  }
  static _OPENAPI_METADATA_FACTORY() {
    return {
      success: { required: true, type: () => Boolean },
      statusCode: { required: true, type: () => Number },
      code: { required: true, type: () => String },
      title: { required: true, type: () => String },
      message: { required: true, type: () => String },
      data: { required: true, nullable: true },
    };
  }
}
exports.ResponseApi = ResponseApi;
//# sourceMappingURL=responseApi.dto.js.map
