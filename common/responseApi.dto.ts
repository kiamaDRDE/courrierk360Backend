// // src/common/responseApi.dto.ts

// export class ResponseApi<T> {
//   success: boolean;
//   statusCode: number;
//   code: string;
//   title: string;
//   message: string;
//   data: T | null;

//   constructor(
//     success: boolean,
//     statusCode: number,
//     code: string,
//     title: string,
//     message: string,
//     data: T | null,
//   ) {
//     this.success = success;
//     this.statusCode = 200;
//     this.code = code;
//     this.title = title;
//     this.message = message;
//     this.data = data;
//   }
// }

// src/common/responseApi.dto.ts

export class ResponseApi<T> {
  success: boolean;
  statusCode: number;
  code: string;
  title: string;
  message: string;
  data: T | null;

  constructor(
    success: boolean,
    statusCode: number,
    code: string,
    title: string,
    message: string,
    data: T | null,
  ) {
    this.success = success;
    this.statusCode = statusCode; // ✅ garder le vrai code interne ici
    this.code = code;
    this.title = title;
    this.message = message;
    this.data = data;
  }
}
