import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTypeAppelDto {
  @ApiProperty({
    description: 'Libellé du type d\'appel',
    example: 'Appel national',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @IsString({ message: 'Le libellé doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le libellé ne peut pas dépasser 255 caractères' })
  libelle: string;

  @ApiProperty({
    description: 'Description du type d\'appel',
    example: 'Appels effectués vers des numéros nationaux',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;

  @ApiProperty({
    description: 'Catégorie du type d\'appel',
    example: 'Fixe',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'La catégorie est obligatoire' })
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La catégorie ne peut pas dépasser 100 caractères' })
  categorie: string;
}

export class CreateTypeAppelBodyDto {
  @ApiProperty({
    description: 'Un type d\'appel ou une liste de types d\'appel à créer',
    oneOf: [
      { $ref: '#/components/schemas/CreateTypeAppelDto' },
      { type: 'array', items: { $ref: '#/components/schemas/CreateTypeAppelDto' } }
    ],
    examples: {
      single: {
        summary: 'Créer un seul type d\'appel',
        value: {
          libelle: 'Appel national',
          description: 'Appels effectués vers des numéros nationaux',
          categorie: 'Fixe'
        }
      },
      multiple: {
        summary: 'Créer plusieurs types d\'appel',
        value: [
          {
            libelle: 'Appel national',
            description: 'Appels effectués vers des numéros nationaux',
            categorie: 'Fixe'
          },
          {
            libelle: 'Appel international',
            description: 'Appels effectués vers des numéros internationaux',
            categorie: 'Mobile'
          }
        ]
      }
    }
  })
  data: CreateTypeAppelDto | CreateTypeAppelDto[];
}
