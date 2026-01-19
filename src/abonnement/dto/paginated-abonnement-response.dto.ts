import { ApiProperty } from '@nestjs/swagger';
import { AbonnementResponseDto } from './abonnement-response.dto';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Page actuelle' })
  currentPage: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  itemsPerPage: number;

  @ApiProperty({ description: 'Nombre total d\'éléments' })
  totalItems: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;

  @ApiProperty({ description: 'Y a-t-il une page précédente' })
  hasPreviousPage: boolean;

  @ApiProperty({ description: 'Y a-t-il une page suivante' })
  hasNextPage: boolean;
}

export class PaginatedAbonnementResponseDto {
  @ApiProperty({ 
    description: 'Liste des abonnements',
    type: [AbonnementResponseDto]
  })
  data: AbonnementResponseDto[];

  @ApiProperty({ 
    description: 'Métadonnées de pagination',
    type: PaginationMetaDto
  })
  meta: PaginationMetaDto;
}
