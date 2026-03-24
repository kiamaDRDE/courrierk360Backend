import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListDechargeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'ID du courrier départ (obligatoire)',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'idCourrierDepart doit être un entier' })
  @Min(1, { message: 'idCourrierDepart doit être >= 1' })
  idCourrierDepart?: number;

  @ApiPropertyOptional({
    description:
      'Terme de recherche (décharge + courrier départ + destinataire + projet)',
    example: 'PROJET RH',
  })
  @IsOptional()
  @IsString({ message: 'search doit être une chaîne de caractères' })
  search?: string;
}
