import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateTraitementDto {
  @ApiPropertyOptional({
    description: 'ID du courrier à traiter',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID du courrier doit être un entier' })
  idCourrier?: number;

  @ApiPropertyOptional({
    description: 'ID du service destinataire',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID du service doit être un entier' })
  idService?: number;

  @ApiPropertyOptional({
    description: 'Date d\'instruction',
    example: '2026-02-12T14:30:00.000Z',
  })
  @IsOptional()
  @IsString({ message: 'La date d\'instruction doit être une chaîne de caractères' })
  dateInstruction?: string;

  @ApiPropertyOptional({
    description: 'Type de transfert',
    example: 'Pour traitement',
  })
  @IsOptional()
  @IsString({ message: 'Le type de transfert doit être une chaîne de caractères' })
  typeTransfert?: string;

  @ApiPropertyOptional({
    description: 'Instruction ou commentaire',
    example: 'Veuillez traiter ce dossier en urgence',
  })
  @IsOptional()
  @IsString({ message: 'L\'instruction doit être une chaîne de caractères' })
  instruction?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'émetteur',
    example: 3,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return Number(value);
  })
  @IsInt({ message: 'L\'ID de l\'émetteur doit être un entier' })
  idEmetteur?: number;

  @ApiPropertyOptional({
    description: 'IDs des services en copie (JSON stringifié)',
    example: '[3,5,7]',
  })
  @IsOptional()
  @IsString({ message: 'structuresCopie doit être une chaîne JSON' })
  structuresCopie?: string;

  @ApiPropertyOptional({
    description: 'Délai de traitement en jours',
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le délai de traitement doit être un entier' })
  delaiTraitement?: number;

  @ApiPropertyOptional({
    description: 'Nombre de pièces jointes',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le nombre de pièces jointes doit être un entier' })
  nombrePieceJointe?: number;

  @ApiPropertyOptional({
    description: 'Liste des intitulés des pièces jointes (JSON stringifié)',
    example: '[{"intitule":"Document justificatif"},{"intitule":"Annexe technique"}]',
  })
  @IsOptional()
  @IsString({ message: 'piecesJointesData doit être une chaîne de caractères JSON' })
  piecesJointesData?: string;

  @ApiPropertyOptional({
    description: 'Envoyer les notifications (email et SMS) pour cette transmission',
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
