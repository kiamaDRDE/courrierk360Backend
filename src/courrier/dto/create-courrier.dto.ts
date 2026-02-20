import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PieceJointeDto {
  @ApiProperty({
    description: 'Intitulé de la pièce jointe',
    example: 'Justificatif de domicile',
  })
  @IsNotEmpty({ message: 'L\'intitulé de la pièce jointe est obligatoire' })
  @IsString({ message: 'L\'intitulé doit être une chaîne de caractères' })
  intitule: string;
}

export class CreateCourrierDto {
  @ApiProperty({
    description: 'Référence du courrier (générée automatiquement si non renseignée)',
    required: false,
    example: '2026-02-001',
  })
  @IsOptional()
  @IsString({ message: 'La référence doit être une chaîne de caractères' })
  reference?: string;

  @ApiProperty({
    description: 'Objet du courrier',
    required: false,
    example: 'Demande de renseignements',
  })
  @IsOptional()
  @IsString({ message: 'L\'objet doit être une chaîne de caractères' })
  objet?: string;

  @ApiProperty({
    description: 'Priorité du courrier',
    example: 'Urgent',
  })
  @IsNotEmpty({ message: 'La priorité est obligatoire' })
  @IsString({ message: 'La priorité doit être une chaîne de caractères' })
  priorite: string;

  @ApiProperty({
    description: 'Date d\'arrivée du courrier',
    example: '2026-02-12T10:30:00.000Z',
  })
  @IsNotEmpty({ message: 'La date d\'arrivée est obligatoire' })
  @IsString({ message: 'La date d\'arrivée doit être une chaîne de caractères' })
  dateArrivee: string;

  @ApiProperty({
    description: 'Catégorie du courrier',
    example: 'Administratif',
  })
  @IsNotEmpty({ message: 'La catégorie est obligatoire' })
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  categorie: string;

  @ApiProperty({
    description: 'Civilité de l\'expéditeur',
    required: false,
    example: 'Monsieur',
  })
  @IsOptional()
  @IsString({ message: 'La civilité doit être une chaîne de caractères' })
  civilite?: string;

  @ApiProperty({
    description: 'Téléphone de l\'expéditeur',
    required: false,
    example: '+237123456789',
  })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  telephone?: string;

  @ApiProperty({
    description: 'Email de l\'expéditeur',
    required: false,
    example: 'contact@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email?: string;

  @ApiProperty({
    description: 'Adresse de l\'expéditeur',
    required: false,
    example: '123 Rue de la Paix, Yaoundé',
  })
  @IsOptional()
  @IsString({ message: 'L\'adresse doit être une chaîne de caractères' })
  adresse?: string;

  @ApiProperty({
    description: 'ID de la provenance (correspondant)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID de provenance doit être un entier' })
  idProvenance?: number;

  @ApiProperty({
    description: 'Classe du courrier',
    required: false,
    example: 'Normal',
  })
  @IsOptional()
  @IsString({ message: 'La classe du courrier doit être une chaîne de caractères' })
  classeCourrier?: string;

  @ApiProperty({
    description: 'ID du type de courrier',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID du type de courrier doit être un entier' })
  idTypeCourrier?: number;

  @ApiProperty({
    description: 'Commentaire sur le courrier',
    required: false,
    example: 'Document reçu en bon état',
  })
  @IsOptional()
  @IsString({ message: 'Le commentaire doit être une chaîne de caractères' })
  commentaire?: string;

  @ApiProperty({
    description: 'ID du service destinataire',
    required: true,
    example: 1,
  })
  @IsNotEmpty({ message: 'L\'ID du service est obligatoire' })
  @Type(() => Number)
  @IsInt({ message: 'L\'ID du service doit être un entier' })
  idService: number;

  @ApiProperty({
    description: 'Type de transfert',
    required: false,
    example: 'Direct',
  })
  @IsOptional()
  @IsString({ message: 'Le type de transfert doit être une chaîne de caractères' })
  typeTransfert?: string;

  @ApiProperty({
    description: 'Le courrier est-il confidentiel ?',
    required: false,
    default: false,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    console.log('🔍 Transform isConfidentiel - Valeur reçue:', { value, type: typeof value });
    if (typeof value === 'boolean') {
      console.log('✅ Déjà boolean, retour:', value);
      return value;
    }
    if (typeof value === 'number') {
      const result = value === 1;
      console.log('🔢 Number, retour:', result);
      return result;
    }
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      console.log('📝 String après trim/lower:', v);
      if (v === 'false' || v === '0' || v === '') {
        console.log('❌ Détecté comme FALSE');
        return false;
      }
      if (v === 'true' || v === '1') {
        console.log('✅ Détecté comme TRUE');
        return true;
      }
      console.log('⚠️ String non reconnu, retour false par défaut');
      return false;
    }
    console.log('⚠️ Type non géré, retour false par défaut');
    return false;
  })
  @IsBoolean({ message: 'isConfidentiel doit être un booléen' })
  isConfidentiel?: boolean;

  @ApiProperty({
    description: 'Nombre de pièces jointes (par défaut 1)',
    required: false,
    default: 1,
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le nombre de pièces jointes doit être un entier' })
  nombrePieceJointe?: number;

  @ApiProperty({
    description: 'Liste des intitulés des pièces jointes (JSON stringifié)',
    required: false,
    example: JSON.stringify([
      { intitule: 'Justificatif de domicile' },
      { intitule: 'Pièce d\'identité' },
    ]),
  })
  @IsOptional()
  @IsString({ message: 'piecesJointesData doit être une chaîne de caractères JSON' })
  piecesJointesData?: string;

  @ApiProperty({
    description: 'Envoyer les notifications (email et SMS) pour ce courrier',
    required: false,
    default: false,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    console.log('🔍 Transform sendNotification - Valeur reçue:', { value, type: typeof value });
    if (typeof value === 'boolean') {
      console.log('✅ Déjà boolean, retour:', value);
      return value;
    }
    if (typeof value === 'number') {
      const result = value === 1;
      console.log('🔢 Number, retour:', result);
      return result;
    }
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      console.log('📝 String après trim/lower:', v);
      if (v === 'false' || v === '0' || v === '') {
        console.log('❌ Détecté comme FALSE');
        return false;
      }
      if (v === 'true' || v === '1') {
        console.log('✅ Détecté comme TRUE');
        return true;
      }
      console.log('⚠️ String non reconnu, retour false par défaut');
      return false;
    }
    console.log('⚠️ Type non géré, retour false par défaut');
    return false;
  })
  @IsBoolean({ message: 'sendNotification doit être un booléen' })
  sendNotification?: boolean;
}
