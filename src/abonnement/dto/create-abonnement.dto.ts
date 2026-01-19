import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAbonnementServiceDto {
  @ApiProperty({ 
    description: 'ID du service',
    example: 1
  })
  @IsNumber()
  serviceId: number;
}

export class CreateAbonnementDto {
  @ApiProperty({ 
    description: 'ID de l\'opérateur',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  operateurId: number;

  @ApiProperty({ 
    description: 'Année de l\'abonnement', 
    example: 2024 
  })
  @IsNumber()
  @IsNotEmpty()
  annee: number;

  @ApiProperty({ 
    description: 'Type d\'abonnement',
    example: 'PREPAYE',
    examples: {
      prepaye: {
        value: 'PREPAYE',
        description: 'Abonnement prépayé'
      },
      postpaye: {
        value: 'POSTPAYE',
        description: 'Abonnement postpayé'
      },
      entreprise: {
        value: 'ENTREPRISE',
        description: 'Abonnement entreprise'
      }
    }
  })
  @IsString()
  @IsNotEmpty()
  typeAbonnement: string;

  @ApiProperty({ 
    description: 'Nombre d\'abonnés',
    example: 15000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  nombreAbonnes: number;

  @ApiPropertyOptional({ 
    description: 'Description de l\'abonnement',
    example: 'Abonnement mobile prépayé avec services SMS et données'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Liste des services associés à l\'abonnement',
    type: [CreateAbonnementServiceDto],
    example: [
      { serviceId: 1 },
      { serviceId: 2 },
      { serviceId: 3 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAbonnementServiceDto)
  services: CreateAbonnementServiceDto[];
}
