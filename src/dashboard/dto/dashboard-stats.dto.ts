import { ApiProperty } from '@nestjs/swagger';

export class OperatorStatsDto {
  @ApiProperty({ description: 'ID de l\'opérateur', example: 1 })
  operatorId: number;

  @ApiProperty({ description: 'Nom de l\'opérateur', example: 'MTN' })
  name: string;

  @ApiProperty({ description: 'Chiffre d\'affaires de l\'opérateur', example: 160000000 })
  revenue: number;

  @ApiProperty({ description: 'Nombre d\'abonnés de l\'opérateur', example: 5800000 })
  subscribers: number;

  @ApiProperty({ description: 'Volume de trafic en minutes', example: 98000000 })
  minutes: number;

  @ApiProperty({ description: 'Couleur associée à l\'opérateur', example: '#06B6D4' })
  color: string;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Année sélectionnée', example: 2025 })
  year: number;

  @ApiProperty({ description: 'Chiffre d\'affaires total', example: 380000000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Nombre total d\'abonnés', example: 13700000 })
  totalSubscribers: number;

  @ApiProperty({ description: 'Volume total de trafic en minutes', example: 216000000 })
  totalMinutes: number;

  @ApiProperty({
    description: 'Statistiques par opérateur',
    type: [OperatorStatsDto],
    example: [
      {
        operatorId: 1,
        name: 'MTN',
        revenue: 160000000,
        subscribers: 5800000,
        minutes: 98000000,
        color: '#06B6D4'
      }
    ]
  })
  operatorStats: OperatorStatsDto[];
}

export class AvailableYearsDto {
  @ApiProperty({ 
    description: 'Liste des années disponibles', 
    example: [2020, 2021, 2022, 2023, 2024, 2025],
    type: [Number]
  })
  availableYears: number[];

  @ApiProperty({ description: 'Année courante', example: 2025 })
  currentYear: number;
}

export class DashboardStatsQueryDto {
  @ApiProperty({ 
    description: 'Année pour les statistiques (optionnel)', 
    example: 2025,
    required: false
  })
  year?: number;
}
