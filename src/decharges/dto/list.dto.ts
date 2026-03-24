import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListDechargeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Terme de recherche (décharge + courrier départ + destinataire + projet)',
    example: 'PROJET RH',
  })
  @IsOptional()
  @IsString({ message: 'search doit être une chaîne de caractères' })
  search?: string;
}
