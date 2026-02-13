// src/notification/dto/create-notification.dto.ts

import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNotificationDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsString()
  type: string;

  @IsOptional()
  data?: any;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return [];
    if (Array.isArray(value)) return value.map((v) => Number(v));
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((v) => Number(v)) : [];
    } catch {
      return String(value)
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isInteger(v) && v > 0);
    }
  })
  @IsArray()
  user_ids?: number[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return [];
    if (Array.isArray(value)) return value.map((v) => Number(v));
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((v) => Number(v)) : [];
    } catch {
      return String(value)
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isInteger(v) && v > 0);
    }
  })
  @IsArray()
  service_ids?: number[];
}
