import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChiffreAffaireServiceResponseDto {
  @ApiProperty({ description: 'ID de la relation' })
  id: number;

  @ApiProperty({ description: 'ID du service' })
  serviceId: number;

  @ApiProperty({ description: 'Nom du service' })
  serviceName?: string;
}

export class ChiffreAffaireResponseDto {
  @ApiProperty({ 
    description: 'ID du chiffre d\'affaire',
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
    description: 'Année du chiffre d\'affaire',
    example: 2024
  })
  annee: number;

  @ApiProperty({ 
    description: 'Montant du chiffre d\'affaire',
    example: '150000.75'
  })
  chiffreAffaire: string;

  @ApiPropertyOptional({ 
    description: 'Description du chiffre d\'affaire',
    example: 'Chiffre d\'affaire 2024 incluant tous les services mobiles'
  })
  description?: string;

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

  @ApiProperty({ 
    description: 'Services associés au chiffre d\'affaire',
    type: [ChiffreAffaireServiceResponseDto],
    example: [
      {
        id: 1,
        serviceId: 1,
        serviceName: 'Appels voix'
      },
      {
        id: 2,
        serviceId: 2,
        serviceName: 'SMS'
      }
    ]
  })
  services?: ChiffreAffaireServiceResponseDto[];
}
