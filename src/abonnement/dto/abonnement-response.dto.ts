import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AbonnementServiceResponseDto {
  @ApiProperty({ description: 'ID de la relation' })
  id: number;

  @ApiProperty({ description: 'ID du service' })
  serviceId: number;

  @ApiProperty({ description: 'Nom du service' })
  serviceName?: string;
}

export class AbonnementResponseDto {
  @ApiProperty({ 
    description: 'ID de l\'abonnement',
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
    description: 'Année de l\'abonnement',
    example: 2024
  })
  annee: number;

  @ApiProperty({ 
    description: 'Type d\'abonnement',
    example: 'PREPAYE'
  })
  typeAbonnement: string;

  @ApiProperty({ 
    description: 'Nombre d\'abonnés',
    example: 15000
  })
  nombreAbonnes: number;

  @ApiPropertyOptional({ 
    description: 'Description de l\'abonnement',
    example: 'Abonnement mobile prépayé avec services SMS et données'
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
    description: 'Services associés à l\'abonnement',
    type: [AbonnementServiceResponseDto],
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
  services?: AbonnementServiceResponseDto[];
}
