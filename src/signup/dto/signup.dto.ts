// src/signup/dto/signup.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceAdditionelDto {
  @ApiProperty({
    description: 'ID du service additionnel',
    example: 1,
  })
  @IsInt()
  serviceId: number;
}

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "Le nom d'utilisateur (username)",
    example: 'jdupont',
  })
  readonly username: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: "L'email de l'utilisateur (champ unique)",
    example: 'jean.dupont@minepia.cm',
  })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "Le mot de passe de l'utilisateur",
    example: 'SecurePass123!',
  })
  readonly password: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "La civilité de l'utilisateur",
    example: 'M.',
    required: false,
  })
  readonly civilite?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Le prénom de l'utilisateur",
    example: 'Jean',
    required: false,
  })
  readonly firstName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Le nom de famille de l'utilisateur",
    example: 'Dupont',
    required: false,
  })
  readonly lastName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Le numéro de téléphone de l'utilisateur",
    example: '+237690123456',
    required: false,
  })
  readonly phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Le numéro de l'utilisateur",
    example: 'USR001',
    required: false,
  })
  readonly numero?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "La fonction de l'utilisateur",
    example: 'Développeur',
    required: false,
  })
  readonly fonction?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    description: "L'ID du service principal",
    example: 3,
    required: false,
  })
  readonly idService?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    description: "L'ID du rôle",
    example: 1,
    required: false,
  })
  readonly idRole?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    description: "L'ID du correspondant",
    example: 5,
    required: false,
  })
  readonly idCorrespondant?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAdditionelDto)
  @ApiProperty({
    description: 'Liste des services additionnels',
    example: [
      { serviceId: 1 },
      { serviceId: 2 },
    ],
    required: false,
    type: [ServiceAdditionelDto],
  })
  readonly servicesAdditionel?: ServiceAdditionelDto[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: "Indique si l'utilisateur est actif",
    example: true,
    required: false,
  })
  readonly isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: "Indique si l'utilisateur est signataire",
    example: false,
    required: false,
  })
  readonly isSignataire?: boolean;
}

