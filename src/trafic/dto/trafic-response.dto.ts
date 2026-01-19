import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TraficServiceResponseDto {
  @ApiProperty({ 
    description: 'ID de la relation trafic-service',
    example: 1
  })
  id: number;

  @ApiProperty({ 
    description: 'ID du service',
    example: 3
  })
  serviceId: number;

  @ApiProperty({ 
    description: 'Nom du service',
    example: 'SMS'
  })
  serviceName?: string;
}

export class TraficAutreOperateurResponseDto {
  @ApiProperty({ 
    description: 'ID de la relation trafic-opérateur',
    example: 1
  })
  id: number;

  @ApiProperty({ 
    description: 'ID de l\'autre opérateur',
    example: 2
  })
  autreOperateurId: number;

  @ApiProperty({ 
    description: 'Nom de l\'autre opérateur',
    example: 'Orange Cameroun'
  })
  autreOperateurName?: string;
}

export class TraficResponseDto {
  @ApiProperty({ 
    description: 'ID unique du trafic',
    example: 1
  })
  id: number;

  @ApiProperty({ 
    description: 'ID de l\'opérateur principal',
    example: 1
  })
  operateurId: number;

  @ApiProperty({ 
    description: 'Nom de l\'opérateur principal',
    example: 'MTN Cameroun'
  })
  operateurName?: string;

  @ApiProperty({ 
    description: 'Année du trafic',
    example: 2024
  })
  annee: number;

  @ApiProperty({ 
    description: 'Type de trafic',
    example: 'ENTRANT',
    enum: ['ENTRANT', 'SORTANT', 'TRANSIT', 'INTERNE']
  })
  typeTrafic: string;

  @ApiProperty({ 
    description: 'Volume du trafic en unités',
    example: '15000.75'
  })
  volume: string;

  @ApiPropertyOptional({ 
    description: 'Description du trafic',
    example: 'Trafic Q4 2024 - Voix, SMS et Data depuis opérateurs partenaires'
  })
  description?: string;

  @ApiProperty({ 
    description: 'Date de création',
    example: '2024-12-03T10:30:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Date de dernière mise à jour',
    example: '2024-12-03T14:45:00.000Z'
  })
  updatedAt: Date;

  @ApiProperty({ 
    description: 'Services associés au trafic',
    type: [TraficServiceResponseDto],
    example: [
      {
        id: 1,
        serviceId: 1,
        serviceName: 'Voix'
      },
      {
        id: 2,
        serviceId: 3,
        serviceName: 'SMS'
      },
      {
        id: 3,
        serviceId: 5,
        serviceName: 'Data'
      }
    ]
  })
  services?: TraficServiceResponseDto[];

  @ApiProperty({ 
    description: 'Autres opérateurs impliqués dans le routage',
    type: [TraficAutreOperateurResponseDto],
    example: [
      {
        id: 1,
        autreOperateurId: 2,
        autreOperateurName: 'Orange Cameroun'
      },
      {
        id: 2,
        autreOperateurId: 4,
        autreOperateurName: 'Nexttel'
      }
    ]
  })
  autresOperateurs?: TraficAutreOperateurResponseDto[];
}
