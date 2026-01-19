import { ApiProperty } from '@nestjs/swagger';

export class ParametreResponseDto {
  @ApiProperty({
    description: 'Identifiant unique du paramètre',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Type de paramètre (texte libre)',
    example: 'REGLEMENTAIRE',
    type: 'string',
  })
  type: string;

  @ApiProperty({
    description: 'Redevance FST en francs CFA',
    example: 15000.00,
    type: 'number',
    format: 'decimal',
    nullable: true,
  })
  redevanceFst?: number;

  @ApiProperty({
    description: 'Redevance de Régulation en francs CFA',
    example: 25000.00,
    type: 'number',
    format: 'decimal',
    nullable: true,
  })
  redevanceRegulation?: number;

  @ApiProperty({
    description: 'Droit d\'entrée en francs CFA',
    example: 50000.00,
    type: 'number',
    format: 'decimal',
    nullable: true,
  })
  droitEntree?: number;

  @ApiProperty({
    description: 'Coûts commerciaux en francs CFA',
    example: 35000.00,
    type: 'number',
    format: 'decimal',
    nullable: true,
  })
  coutsCommerciaux?: number;

  @ApiProperty({
    description: 'Taux de TVA en pourcentage',
    example: 18.00,
    type: 'number',
    format: 'decimal',
    nullable: true,
  })
  tva?: number;

  @ApiProperty({
    description: 'Date de création du paramètre',
    example: '2026-01-05T12:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour du paramètre',
    example: '2026-01-05T12:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;

}

export class ParametreStatsDto {
  @ApiProperty({
    description: 'Nombre total de paramètres',
    example: 25,
    type: 'integer',
  })
  totalParametres: number;

  @ApiProperty({
    description: 'Répartition par type de paramètre',
    example: {
      DUREE_MOYENNE: 5,
      QUALITE_SERVICE: 8,
      COUVERTURE: 4,
      DEBIT: 3,
      TARIFICATION: 3,
      REGLEMENTAIRE: 2
    },
    additionalProperties: { type: 'number' },
  })
  repartitionParType: Record<string, number>;

  @ApiProperty({
    description: 'Somme totale des redevances FST',
    example: 450000.00,
    type: 'number',
    format: 'decimal',
  })
  totalRedevanceFst: number;

  @ApiProperty({
    description: 'Somme totale des redevances de régulation',
    example: 625000.00,
    type: 'number',
    format: 'decimal',
  })
  totalRedevanceRegulation: number;

  @ApiProperty({
    description: 'Somme totale des droits d\'entrée',
    example: 1250000.00,
    type: 'number',
    format: 'decimal',
  })
  totalDroitEntree: number;

  @ApiProperty({
    description: 'Somme totale des coûts commerciaux',
    example: 875000.00,
    type: 'number',
    format: 'decimal',
  })
  totalCoutsCommerciaux: number;
}
