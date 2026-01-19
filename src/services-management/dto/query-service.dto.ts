import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class QueryServiceDto {
  @ApiProperty({
    description: 'Filtrer par nom (recherche partielle)',
    example: 'Mobile',
    required: false,
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({
    description: 'Numéro de page',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page (0 pour tous)',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  limit?: number = 10;
}
