import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Nom du service',
    example: 'Mobile',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Description du service',
    example: 'Service de télécommunication mobile',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
