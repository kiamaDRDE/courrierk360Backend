// src/signup/dto/user-query.dto.ts

import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de la page',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page (0 = tous)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrer par nom (recherche partielle)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par email (recherche partielle)',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par numéro de téléphone (recherche partielle)',
    example: '+237',
  })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par ID du rôle',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idRole?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par ID du rôle',
    example: 1,
  })

  @ApiPropertyOptional({
    description: 'Filtrer par ID du service',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idService?: number;

  @ApiPropertyOptional({
    description: 'Filtrer les utilisateurs signataires',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    console.log('🔄 Transform isSignataire - Valeur brute reçue:', value, 'Type:', typeof value);
    if (value === undefined || value === null) {
      console.log('⚠️ Retourne: undefined (null/undefined)');
      return undefined;
    }
    if (typeof value === 'boolean') {
      console.log('✅ Retourne:', value, '(boolean)');
      return value;
    }
    if (typeof value === 'number') {
      const result = value === 1;
      console.log('✅ Retourne:', result, '(number)');
      return result;
    }
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (v === 'true' || v === '1') {
        console.log('✅ Retourne: true (string)');
        return true;
      }
      if (v === 'false' || v === '0') {
        console.log('✅ Retourne: false (string)');
        return false;
      }
    }
    console.log('⚠️ Retourne: undefined (aucune condition)');
    return undefined;
  })
  isSignataire?: any;

  @ApiPropertyOptional({
    description: 'Filtrer par statut actif/inactif',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    console.log('🔄 Transform isActive - Valeur brute reçue:', value, 'Type:', typeof value);
    if (value === undefined || value === null) {
      console.log('⚠️ Retourne: undefined (null/undefined)');
      return undefined;
    }
    if (typeof value === 'boolean') {
      console.log('✅ Retourne:', value, '(boolean)');
      return value;
    }
    if (typeof value === 'number') {
      const result = value === 1;
      console.log('✅ Retourne:', result, '(number)');
      return result;
    }
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (v === 'true' || v === '1') {
        console.log('✅ Retourne: true (string)');
        return true;
      }
      if (v === 'false' || v === '0') {
        console.log('✅ Retourne: false (string)');
        return false;
      }
    }
    console.log('⚠️ Retourne: undefined (aucune condition)');
    return undefined;
  })
  isActive?: any;
}
