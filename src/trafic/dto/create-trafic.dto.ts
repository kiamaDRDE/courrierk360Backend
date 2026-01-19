import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, ValidateNested, IsDecimal } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTraficServiceDto {
  @ApiProperty({ 
    description: 'ID du service associé au trafic',
    example: 1
  })
  @IsNumber()
  serviceId: number;
}

export class CreateTraficAutreOperateurDto {
  @ApiProperty({ 
    description: 'ID de l\'autre opérateur impliqué dans le routage',
    example: 2
  })
  @IsNumber()
  autreOperateurId: number;
}

export class CreateTraficDto {
  @ApiProperty({ 
    description: 'ID de l\'opérateur principal',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  operateurId: number;

  @ApiProperty({ 
    description: 'Année du trafic', 
    example: 2024 
  })
  @IsNumber()
  @IsNotEmpty()
  annee: number;

  @ApiProperty({ 
    description: 'Type de trafic', 
    example: 'ENTRANT',
    enum: ['ENTRANT', 'SORTANT', 'TRANSIT', 'INTERNE']
  })
  @IsString()
  @IsNotEmpty()
  typeTrafic: string;

  @ApiProperty({ 
    description: 'Volume du trafic en unités', 
    type: 'string',
    example: '1500.75' 
  })
  @Transform(({ value }) => value.toString())
  @IsNotEmpty()
  volume: string;

  @ApiProperty({ 
    description: 'Liste des services associés au trafic',
    type: [CreateTraficServiceDto],
    example: [
      { serviceId: 1 },
      { serviceId: 3 },
      { serviceId: 5 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTraficServiceDto)
  services: CreateTraficServiceDto[];

  @ApiPropertyOptional({ 
    description: 'Liste des autres opérateurs impliqués dans le routage du trafic',
    type: [CreateTraficAutreOperateurDto],
    example: [
      { autreOperateurId: 2 },
      { autreOperateurId: 4 }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTraficAutreOperateurDto)
  autresOperateurs?: CreateTraficAutreOperateurDto[];
}
