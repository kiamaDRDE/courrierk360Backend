import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class StatistiqueQueryDto {
  @ApiPropertyOptional({ description: 'Date de début (createdAt)', example: '2026-01-01' })
  @IsOptional()
  @IsString()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin (createdAt)', example: '2026-02-12' })
  @IsOptional()
  @IsString()
  dateFin?: string;

  @ApiPropertyOptional({ description: 'Priorité', example: 'haute' })
  @IsOptional()
  @IsString()
  priorite?: string;

  @ApiPropertyOptional({ description: 'Confidentiel (true/false)', example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isConfidentiel?: boolean;

  @ApiPropertyOptional({ description: 'Service ID', example: 446 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceId?: number;
}
