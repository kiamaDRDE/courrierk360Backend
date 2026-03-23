import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListProjetQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Terme de recherche (id ou name)',
    example: 'digitalisation',
  })
  @IsOptional()
  @IsString({ message: 'search doit être une chaîne de caractères' })
  search?: string;
}
