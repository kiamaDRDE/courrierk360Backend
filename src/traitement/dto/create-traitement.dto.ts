import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PieceJointeDto {
  @ApiProperty({
    description: 'Intitulé de la pièce jointe',
    example: 'Document justificatif',
  })
  @IsNotEmpty({ message: 'L\'intitulé de la pièce jointe est obligatoire' })
  @IsString({ message: 'L\'intitulé doit être une chaîne de caractères' })
  intitule: string;
}

export class CreateTraitementDto {
  @ApiProperty({
    description: 'ID du courrier à traiter (obligatoire)',
    example: 1,
  })
  @IsNotEmpty({ message: 'L\'ID du courrier est obligatoire' })
  @Type(() => Number)
  @IsInt({ message: 'L\'ID du courrier doit être un entier' })
  idCourrier: number;

  @ApiProperty({
    description: 'ID du service destinataire (obligatoire)',
    example: 2,
  })
  @IsNotEmpty({ message: 'L\'ID du service est obligatoire' })
  @Type(() => Number)
  @IsInt({ message: 'L\'ID du service doit être un entier' })
  idService: number;

  @ApiProperty({
    description: 'Date d\'instruction (obligatoire)',
    example: '2026-02-12T14:30:00.000Z',
  })
  @IsNotEmpty({ message: 'La date d\'instruction est obligatoire' })
  @IsString({ message: 'La date d\'instruction doit être une chaîne de caractères' })
  dateInstruction: string;

  @ApiProperty({
    description: 'Type de transfert (obligatoire)',
    example: 'Pour traitement',
  })
  @IsNotEmpty({ message: 'Le type de transfert est obligatoire' })
  @IsString({ message: 'Le type de transfert doit être une chaîne de caractères' })
  typeTransfert: string;

  @ApiProperty({
    description: 'Instruction ou commentaire',
    required: false,
    example: 'Veuillez traiter ce dossier en urgence',
  })
  @IsOptional()
  @IsString({ message: 'L\'instruction doit être une chaîne de caractères' })
  instruction?: string;

  @ApiProperty({
    description: 'ID de l\'émetteur (par défaut l\'utilisateur connecté)',
    required: false,
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID de l\'émetteur doit être un entier' })
  idEmetteur?: number;

  @ApiProperty({
    description: 'IDs des services en copie (JSON stringifié)',
    required: false,
    example: JSON.stringify([3, 5, 7]),
  })
  @IsOptional()
  @IsString({ message: 'structuresCopie doit être une chaîne JSON' })
  structuresCopie?: string;

  @ApiProperty({
    description: 'Délai de traitement en jours',
    required: false,
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le délai de traitement doit être un entier' })
  delaiTraitement?: number;

  @ApiProperty({
    description: 'Nombre de pièces jointes (par défaut 0)',
    required: false,
    default: 0,
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le nombre de pièces jointes doit être un entier' })
  nombrePieceJointe?: number;

  @ApiProperty({
    description: 'Liste des intitulés des pièces jointes (JSON stringifié)',
    required: false,
    example: JSON.stringify([
      { intitule: 'Document justificatif' },
      { intitule: 'Annexe technique' },
    ]),
  })
  @IsOptional()
  @IsString({ message: 'piecesJointesData doit être une chaîne de caractères JSON' })
  piecesJointesData?: string;

  @ApiProperty({
    description: 'Envoyer les notifications (email et SMS) pour cette transmission',
    required: false,
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'sendNotification doit être un booléen' })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === '1';
    }
    return false;
  })
  sendNotification?: boolean;
}
