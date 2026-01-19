import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TraficDto {
  @ApiPropertyOptional({ 
    description: 'Part de marché pour le trafic (en pourcentage)',
    example: '45.25'
  })
  partMarcheTrafic?: string;

  @ApiPropertyOptional({ 
    description: 'Indice IHH pour le trafic',
    example: '2850.75'
  })
  ihhTrafic?: string;

  @ApiPropertyOptional({ 
    description: 'Indique si le marché est concentré pour le trafic (IHH > 2000)',
    example: true
  })
  isConcentreTrafic?: boolean;
}

class AbonnementDto {
  @ApiPropertyOptional({ 
    description: 'Part de marché pour les abonnés (en pourcentage)',
    example: '48.90'
  })
  partMarcheAbonnes?: string;

  @ApiPropertyOptional({ 
    description: 'Indice IHH pour les abonnés',
    example: '2650.25'
  })
  ihhAbonne?: string;

  @ApiPropertyOptional({ 
    description: 'Indique si le marché est concentré pour les abonnés (IHH > 2000)',
    example: false
  })
  isConcentreAbonne?: boolean;
}

class ChiffreAffaireDto {
  @ApiPropertyOptional({ 
    description: 'Part de marché pour le chiffre d\'affaires (en pourcentage)',
    example: '52.75'
  })
  partMarcheChiffreAffaire?: string;

  @ApiPropertyOptional({ 
    description: 'Indice IHH pour le chiffre d\'affaires',
    example: '3100.50'
  })
  ihhChiffreAffaire?: string;

  @ApiPropertyOptional({ 
    description: 'Indique si le marché est concentré pour le chiffre d\'affaires (IHH > 2000)',
    example: true
  })
  isConcentreChiffreAffaire?: boolean;
}

export class PartMarcheResponseDto {
  @ApiProperty({ 
    description: 'ID de la part de marché',
    example: 1
  })
  id: number;

  @ApiProperty({ 
    description: 'ID de l\'opérateur',
    example: 1
  })
  operateurId: number;

  @ApiProperty({ 
    description: 'Nom de l\'opérateur',
    example: 'Orange Cameroun'
  })
  operateurName?: string;

  @ApiProperty({ 
    description: 'Année de la part de marché',
    example: 2024
  })
  annee: number;

  @ApiPropertyOptional({ 
    description: 'Données relatives au trafic',
    type: TraficDto
  })
  trafic?: TraficDto;

  @ApiPropertyOptional({ 
    description: 'Données relatives aux abonnements',
    type: AbonnementDto
  })
  abonnement?: AbonnementDto;

  @ApiPropertyOptional({ 
    description: 'Données relatives au chiffre d\'affaires',
    type: ChiffreAffaireDto
  })
  chiffreAffaire?: ChiffreAffaireDto;

  @ApiPropertyOptional({ 
    description: 'Somme totale du trafic pour l\'année',
    example: '125000.50'
  })
  sommeTrafic?: string;

  @ApiPropertyOptional({ 
    description: 'Somme totale des abonnements pour l\'année',
    example: '15000000.00'
  })
  sommeAbonnement?: string;

  @ApiPropertyOptional({ 
    description: 'Somme totale du chiffre d\'affaires pour l\'année',
    example: '85000000.00'
  })
  sommeChiffreAffaire?: string;

  @ApiProperty({ 
    description: 'Date de création',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Date de mise à jour',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}
