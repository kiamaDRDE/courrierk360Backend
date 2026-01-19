// src/common/responseApi.dto.d.ts

export declare class ResponseApi<T> {
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
  );
}
