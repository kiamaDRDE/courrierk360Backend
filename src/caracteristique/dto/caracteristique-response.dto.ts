import { ApiProperty } from '@nestjs/swagger';

export class CaracteristiqueResponseDto {
  @ApiProperty({
    description: 'ID unique de la caractéristique',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID de l\'offre associée',
    example: 1,
  })
  offreId: number;

  @ApiProperty({
    description: 'Type de caractéristique',
    example: 'DUREE_MOYENNE',
    enum: ['DUREE_MOYENNE', 'QUALITE_SERVICE', 'COUVERTURE', 'DEBIT'],
  })
  type: string;

  @ApiProperty({
    description: 'Durée moyenne des appels On-net (en secondes)',
    example: 180.50,
  })
  onNet: number;

  @ApiProperty({
    description: 'Durée moyenne des appels Off-net (en secondes)',
    example: 145.75,
  })
  offNet: number;

  @ApiProperty({
    description: 'Durée moyenne des appels International (en secondes)',
    example: 95.25,
  })
  international: number;

  @ApiProperty({
    description: 'Durée moyenne des appels Roaming (en secondes)',
    example: 120.80,
  })
  roaming: number;

  @ApiProperty({
    description: 'Date de création',
    example: '2025-01-05T21:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2025-01-05T21:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Informations de l\'offre associée',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      nom: { type: 'string', example: 'Forfait Premium 5G' },
      typeOffre: { type: 'string', example: 'Postpayé' },
      operateur: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          nom: { type: 'string', example: 'Orange Cameroun' },
          code: { type: 'string', example: 'ORC' },
        }
      }
    }
  })
  offre?: {
    id: number;
    nom: string;
    typeOffre: string;
    operateur: {
      id: number;
      nom: string;
      code: string;
    };
  };
}
