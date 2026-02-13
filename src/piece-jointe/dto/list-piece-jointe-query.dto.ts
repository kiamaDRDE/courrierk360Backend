import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListPieceJointeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Recherche globale',
    example: 'pdf',
  })
  @IsOptional()
  @IsString({ message: 'search doit être une chaîne de caractères' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Type du parent',
    example: 'courrier',
  })
  @IsOptional()
  @IsString({ message: 'typeParent doit être une chaîne de caractères' })
  typeParent?: string;

  @ApiPropertyOptional({
    description: 'ID du parent',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'idParent doit être un entier' })
  idParent?: number;

  @ApiPropertyOptional({
    description: 'ID de la transmission',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'idTransmission doit être un entier' })
  idTransmission?: number;

  @ApiPropertyOptional({
    description: 'ID du courrier',
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'idCourrier doit être un entier' })
  idCourrier?: number;

  @ApiPropertyOptional({
    description: 'Type MIME',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString({ message: 'type doit être une chaîne de caractères' })
  type?: string;
}
