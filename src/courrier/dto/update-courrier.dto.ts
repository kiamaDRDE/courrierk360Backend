import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateCourrierDto {
  @ApiPropertyOptional({
    description: 'Référence du courrier (non modifiée sauf changement de mois)',
    example: '2026-02-001',
  })
  @IsOptional()
  @IsString({ message: "La référence doit être une chaîne de caractères" })
  reference?: string;

  @ApiPropertyOptional({
    description: 'Objet du courrier',
    example: 'Demande de renseignements',
  })
  @IsOptional()
  @IsString({ message: "L'objet doit être une chaîne de caractères" })
  objet?: string;

  @ApiPropertyOptional({
    description: 'Priorité du courrier',
    example: 'Urgent',
  })
  @IsOptional()
  @IsString({ message: 'La priorité doit être une chaîne de caractères' })
  priorite?: string;

  @ApiPropertyOptional({
    description: "Date d'arrivée du courrier",
    example: '2026-02-12T10:30:00.000Z',
  })
  @IsOptional()
  @IsString({ message: "La date d'arrivée doit être une chaîne de caractères" })
  dateArrivee?: string;

  @ApiPropertyOptional({
    description: 'Catégorie du courrier',
    example: 'Administratif',
  })
  @IsOptional()
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  categorie?: string;

  @ApiPropertyOptional({
    description: "Civilité de l'expéditeur",
    example: 'Monsieur',
  })
  @IsOptional()
  @IsString({ message: 'La civilité doit être une chaîne de caractères' })
  civilite?: string;

  @ApiPropertyOptional({
    description: "Téléphone de l'expéditeur",
    example: '+237123456789',
  })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  telephone?: string;

  @ApiPropertyOptional({
    description: "Email de l'expéditeur",
    example: 'contact@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: "L'email doit être valide" })
  email?: string;

  @ApiPropertyOptional({
    description: "Adresse de l'expéditeur",
    example: '123 Rue de la Paix, Yaoundé',
  })
  @IsOptional()
  @IsString({ message: "L'adresse doit être une chaîne de caractères" })
  adresse?: string;

  @ApiPropertyOptional({
    description: 'ID de la provenance (correspondant)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'ID de provenance doit être un entier" })
  idProvenance?: number;

  @ApiPropertyOptional({
    description: 'Classe du courrier',
    example: 'Normal',
  })
  @IsOptional()
  @IsString({ message: 'La classe du courrier doit être une chaîne de caractères' })
  classeCourrier?: string;

  @ApiPropertyOptional({
    description: 'ID du type de courrier',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'ID du type de courrier doit être un entier" })
  idTypeCourrier?: number;

  @ApiPropertyOptional({
    description: 'Commentaire sur le courrier',
    example: 'Document reçu en bon état',
  })
  @IsOptional()
  @IsString({ message: 'Le commentaire doit être une chaîne de caractères' })
  commentaire?: string;

  @ApiPropertyOptional({
    description: 'ID du service destinataire',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'ID du service doit être un entier" })
  idService?: number;

  @ApiPropertyOptional({
    description: 'Type de transfert',
    example: 'Direct',
  })
  @IsOptional()
  @IsString({ message: 'Le type de transfert doit être une chaîne de caractères' })
  typeTransfert?: string;

  @ApiPropertyOptional({
    description: 'Le courrier est-il confidentiel ? ',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === '1';
    }
    return false;
  })
  @IsBoolean({ message: 'isConfidentiel doit être un booléen' })
  isConfidentiel?: boolean;

  @ApiPropertyOptional({
    description: 'Nombre de pièces jointes',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le nombre de pièces jointes doit être un entier' })
  nombrePieceJointe?: number;

  @ApiPropertyOptional({
    description: 'Liste des intitulés des pièces jointes (JSON stringifié)',
    example: '[{"intitule":"Justificatif de domicile"},{"intitule":"Pièce d\'identité"}]',
  })
  @IsOptional()
  @IsString({ message: 'piecesJointesData doit être une chaîne de caractères JSON' })
  piecesJointesData?: string;

  @ApiPropertyOptional({
    description: 'Envoyer les notifications (email et SMS) pour ce courrier',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === '1';
    }
    return false;
  })
  @IsBoolean({ message: 'sendNotification doit être un booléen' })
  sendNotification?: boolean;
}
