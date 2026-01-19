import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsIn } from 'class-validator';

export class EffetClubQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de page (0 pour tous les résultats)',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le numéro de page doit être un entier' })
  @Min(0, { message: 'Le numéro de page doit être supérieur ou égal à 0' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page (0 = tous les résultats sans pagination)',
    example: 10,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(0, { message: 'La limite doit être supérieure ou égale à 0' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Champ de tri',
    example: 'annee',
    enum: ['id', 'annee', 'coutReseau', 'coutCommerciaux', 'coutInterconnexion', 'taxe', 'cout', 'createdAt', 'updatedAt']
  })
  @IsOptional()
  @IsIn(['id', 'annee', 'coutReseau', 'coutCommerciaux', 'coutInterconnexion', 'taxe', 'cout', 'createdAt', 'updatedAt'])
  sortBy?: string = 'annee';

  @ApiPropertyOptional({
    description: 'Ordre de tri (asc/desc)',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
