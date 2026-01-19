import { ApiProperty } from '@nestjs/swagger';

class OperateurInfoDto {
  @ApiProperty({
    description: 'ID de l\'opérateur',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nom de l\'opérateur',
    example: 'Orange CI',
  })
  nom: string;

  @ApiProperty({
    description: 'Code de l\'opérateur',
    example: 'OCI',
  })
  code: string;
}

export class OffreEffetClubDto {
  @ApiProperty({
    description: 'ID de l\'offre',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nom de l\'offre',
    example: 'Forfait Premium 5G',
  })
  nom: string;

  @ApiProperty({
    description: 'Informations sur l\'opérateur',
    type: OperateurInfoDto,
  })
  operateur: OperateurInfoDto;

  @ApiProperty({
    description: 'Année de l\'offre (basée sur la date de début de validité)',
    example: 2025,
  })
  annee: number;

  @ApiProperty({
    description: 'Date de début de validité de l\'offre',
    example: '2025-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  dateDebutValidite: Date;

  @ApiProperty({
    description: 'Date de fin de validité de l\'offre',
    example: '2025-12-31T23:59:59.000Z',
    type: 'string',
    format: 'date-time',
  })
  dateFinValidite: Date;

  @ApiProperty({
    description: 'Type de l\'offre',
    example: 'Postpayé',
  })
  typeOffre: string;

  @ApiProperty({
    description: 'Statut de l\'offre',
    example: 'Actif',
  })
  statut: string;

  @ApiProperty({
    description: 'Prix Off Net (communication hors réseau)',
    example: 125.50,
    nullable: true,
  })
  prixOffNet: number | null;

  @ApiProperty({
    description: 'Prix On Net (communication réseau)',
    example: 85.30,
    nullable: true,
  })
  prixOnNet: number | null;

  // Tarifs opérateur spécifiques (8 champs)
  @ApiProperty({
    description: 'Tarif Base Opérateur Off Net Heure Creuse',
    example: 75.25,
    nullable: true,
  })
  taBaseOperateurOffnetHC: number | null;

  @ApiProperty({
    description: 'Tarif Base Opérateur Off Net Heure Pleine',
    example: 85.50,
    nullable: true,
  })
  taBaseOperateurOffnetHP: number | null;

  @ApiProperty({
    description: 'Tarif Base Opérateur On Net Heure Creuse',
    example: 65.25,
    nullable: true,
  })
  taBaseOperateurOnnetHC: number | null;

  @ApiProperty({
    description: 'Tarif Base Opérateur On Net Heure Pleine',
    example: 75.50,
    nullable: true,
  })
  taBaseOperateurOnnetHP: number | null;

  @ApiProperty({
    description: 'Tarif Interconnexion Opérateur Off Net Heure Creuse',
    example: 95.25,
    nullable: true,
  })
  taInterOperateurOffnetHC: number | null;

  @ApiProperty({
    description: 'Tarif Interconnexion Opérateur Off Net Heure Pleine',
    example: 105.50,
    nullable: true,
  })
  taInterOperateurOffnetHP: number | null;

  @ApiProperty({
    description: 'Tarif Interconnexion Opérateur On Net Heure Creuse',
    example: 85.25,
    nullable: true,
  })
  taInterOperateurOnnetHC: number | null;

  @ApiProperty({
    description: 'Tarif Interconnexion Opérateur On Net Heure Pleine',
    example: 95.50,
    nullable: true,
  })
  taInterOperateurOnnetHP: number | null;

  // Moyennes des autres opérateurs (8 champs)
  @ApiProperty({
    description: 'Moyenne Base Off Net Heure Creuse des autres opérateurs',
    example: 78.30,
    nullable: true,
  })
  taMoyenBaseOffnetHC: number | null;

  @ApiProperty({
    description: 'Moyenne Base Off Net Heure Pleine des autres opérateurs',
    example: 88.75,
    nullable: true,
  })
  taMoyenBaseOffnetHP: number | null;

  @ApiProperty({
    description: 'Moyenne Base On Net Heure Creuse des autres opérateurs',
    example: 68.30,
    nullable: true,
  })
  taMoyenBaseOnnetHC: number | null;

  @ApiProperty({
    description: 'Moyenne Base On Net Heure Pleine des autres opérateurs',
    example: 78.75,
    nullable: true,
  })
  taMoyenBaseOnnetHP: number | null;

  @ApiProperty({
    description: 'Moyenne Interconnexion Off Net Heure Creuse des autres opérateurs',
    example: 98.30,
    nullable: true,
  })
  taMoyenInterOffnetHC: number | null;

  @ApiProperty({
    description: 'Moyenne Interconnexion Off Net Heure Pleine des autres opérateurs',
    example: 108.75,
    nullable: true,
  })
  taMoyenInterOffnetHP: number | null;

  @ApiProperty({
    description: 'Moyenne Interconnexion On Net Heure Creuse des autres opérateurs',
    example: 88.30,
    nullable: true,
  })
  taMoyenInterOnnetHC: number | null;

  @ApiProperty({
    description: 'Moyenne Interconnexion On Net Heure Pleine des autres opérateurs',
    example: 98.75,
    nullable: true,
  })
  taMoyenInterOnnetHP: number | null;

  // Sommes des tarifs autres opérateurs (8 champs)
  @ApiProperty({
    description: 'Somme Base Off Net Heure Creuse des autres opérateurs',
    example: 234.90,
    nullable: true,
  })
  sommeBaseAutresOperateursOffnetHC: number | null;

  @ApiProperty({
    description: 'Somme Base Off Net Heure Pleine des autres opérateurs',
    example: 266.25,
    nullable: true,
  })
  sommeBaseAutresOperateursOffnetHP: number | null;

  @ApiProperty({
    description: 'Somme Base On Net Heure Creuse des autres opérateurs',
    example: 204.90,
    nullable: true,
  })
  sommeBaseAutresOperateursOnnetHC: number | null;

  @ApiProperty({
    description: 'Somme Base On Net Heure Pleine des autres opérateurs',
    example: 236.25,
    nullable: true,
  })
  sommeBaseAutresOperateursOnnetHP: number | null;

  @ApiProperty({
    description: 'Somme Interconnexion Off Net Heure Creuse des autres opérateurs',
    example: 294.90,
    nullable: true,
  })
  sommeInterAutresOperateursOffnetHC: number | null;

  @ApiProperty({
    description: 'Somme Interconnexion Off Net Heure Pleine des autres opérateurs',
    example: 326.25,
    nullable: true,
  })
  sommeInterAutresOperateursOffnetHP: number | null;

  @ApiProperty({
    description: 'Somme Interconnexion On Net Heure Creuse des autres opérateurs',
    example: 264.90,
    nullable: true,
  })
  sommeInterAutresOperateursOnnetHC: number | null;

  @ApiProperty({
    description: 'Somme Interconnexion On Net Heure Pleine des autres opérateurs',
    example: 296.25,
    nullable: true,
  })
  sommeInterAutresOperateursOnnetHP: number | null;

  @ApiProperty({
    description: 'Nombre d\'autres opérateurs pris en compte dans le calcul',
    example: 3,
    nullable: true,
  })
  nombreAutresOperateurs: number | null;

  // Effets club spécifiques (8 champs)
  @ApiProperty({
    description: 'Effet Club Base Off Net Heure Creuse = (prixOffNet - prixOnNet) - (taBaseOperateurOffnetHC - taMoyenBaseOffnetHC)',
    example: 45.75,
    nullable: true,
  })
  effetClubBaseOffnetHC: number | null;

  @ApiProperty({
    description: 'Effet Club Base Off Net Heure Pleine = (prixOffNet - prixOnNet) - (taBaseOperateurOffnetHP - taMoyenBaseOffnetHP)',
    example: 38.95,
    nullable: true,
  })
  effetClubBaseOffnetHP: number | null;

  @ApiProperty({
    description: 'Effet Club Base On Net Heure Creuse = (prixOffNet - prixOnNet) - (taBaseOperateurOnnetHC - taMoyenBaseOnnetHC)',
    example: 52.15,
    nullable: true,
  })
  effetClubBaseOnnetHC: number | null;

  @ApiProperty({
    description: 'Effet Club Base On Net Heure Pleine = (prixOffNet - prixOnNet) - (taBaseOperateurOnnetHP - taMoyenBaseOnnetHP)',
    example: 47.45,
    nullable: true,
  })
  effetClubBaseOnnetHP: number | null;

  @ApiProperty({
    description: 'Effet Club Interconnexion Off Net Heure Creuse = (prixOffNet - prixOnNet) - (taInterOperateurOffnetHC - taMoyenInterOffnetHC)',
    example: 28.85,
    nullable: true,
  })
  effetClubInterOffnetHC: number | null;

  @ApiProperty({
    description: 'Effet Club Interconnexion Off Net Heure Pleine = (prixOffNet - prixOnNet) - (taInterOperateurOffnetHP - taMoyenInterOffnetHP)',
    example: 24.95,
    nullable: true,
  })
  effetClubInterOffnetHP: number | null;

  @ApiProperty({
    description: 'Effet Club Interconnexion On Net Heure Creuse = (prixOffNet - prixOnNet) - (taInterOperateurOnnetHC - taMoyenInterOnnetHC)',
    example: 35.25,
    nullable: true,
  })
  effetClubInterOnnetHC: number | null;

  @ApiProperty({
    description: 'Effet Club Interconnexion On Net Heure Pleine = (prixOffNet - prixOnNet) - (taInterOperateurOnnetHP - taMoyenInterOnnetHP)',
    example: 31.45,
    nullable: true,
  })
  effetClubInterOnnetHP: number | null;

  // Résultats spécifiques (8 champs)
  @ApiProperty({
    description: 'Résultat d\'analyse Base Off Net Heure Creuse',
    example: 'Effet club positif : Avantage concurrentiel de 45.75',
    nullable: true,
  })
  resultatBaseOffnetHC: string | null;

  @ApiProperty({
    description: 'Résultat d\'analyse Base Off Net Heure Pleine',
    example: 'Effet club positif : Avantage concurrentiel de 38.95',
    nullable: true,
  })
  resultatBaseOffnetHP: string | null;

  @ApiProperty({
    description: 'Résultat d\'analyse Base On Net Heure Creuse',
    example: 'Effet club positif : Avantage concurrentiel de 52.15',
    nullable: true,
  })
  resultatBaseOnnetHC: string | null;

  @ApiProperty({
    description: 'Résultat d\'analyse Base On Net Heure Pleine',
    example: 'Effet club positif : Avantage concurrentiel de 47.45',
    nullable: true,
  })
  resultatBaseOnnetHP: string | null;

  @ApiProperty({
    description: 'Résultat d\'analyse Interconnexion Off Net Heure Creuse',
    example: 'Effet club positif : Avantage concurrentiel de 28.85',
    nullable: true,
  })
  resultatInterOffnetHC: string | null;

  @ApiProperty({
    description: 'Résultat d\'analyse Interconnexion Off Net Heure Pleine',
    example: 'Effet club positif : Avantage concurrentiel de 24.95',
    nullable: true,
  })
  resultatInterOffnetHP: string | null;

  @ApiProperty({
    description: 'Résultat d\'analyse Interconnexion On Net Heure Creuse',
    example: 'Effet club positif : Avantage concurrentiel de 35.25',
    nullable: true,
  })
  resultatInterOnnetHC: string | null;

  @ApiProperty({
    description: 'Résultat d\'analyse Interconnexion On Net Heure Pleine',
    example: 'Effet club positif : Avantage concurrentiel de 31.45',
    nullable: true,
  })
  resultatInterOnnetHP: string | null;

  // Booléens d'effet club (8 champs)
  @ApiProperty({
    description: 'Indique s\'il y a un effet club Base Off Net Heure Creuse (valeur positive)',
    example: true,
  })
  isEffetClubBaseOffnetHC: boolean;

  @ApiProperty({
    description: 'Indique s\'il y a un effet club Base Off Net Heure Pleine (valeur positive)',
    example: true,
  })
  isEffetClubBaseOffnetHP: boolean;

  @ApiProperty({
    description: 'Indique s\'il y a un effet club Base On Net Heure Creuse (valeur positive)',
    example: true,
  })
  isEffetClubBaseOnnetHC: boolean;

  @ApiProperty({
    description: 'Indique s\'il y a un effet club Base On Net Heure Pleine (valeur positive)',
    example: true,
  })
  isEffetClubBaseOnnetHP: boolean;

  @ApiProperty({
    description: 'Indique s\'il y a un effet club Interconnexion Off Net Heure Creuse (valeur positive)',
    example: true,
  })
  isEffetClubInterOffnetHC: boolean;

  @ApiProperty({
    description: 'Indique s\'il y a un effet club Interconnexion Off Net Heure Pleine (valeur positive)',
    example: true,
  })
  isEffetClubInterOffnetHP: boolean;

  @ApiProperty({
    description: 'Indique s\'il y a un effet club Interconnexion On Net Heure Creuse (valeur positive)',
    example: true,
  })
  isEffetClubInterOnnetHC: boolean;

  @ApiProperty({
    description: 'Indique s\'il y a un effet club Interconnexion On Net Heure Pleine (valeur positive)',
    example: true,
  })
  isEffetClubInterOnnetHP: boolean;
}

export class OffreEffetClubStatsDto {
  @ApiProperty({
    description: 'Liste des offres avec leurs informations d\'effet club',
    type: [OffreEffetClubDto],
  })
  offres: OffreEffetClubDto[];

  @ApiProperty({
    description: 'Nombre total d\'offres',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: 'Nombre d\'offres ayant un effet club positif',
    example: 8,
  })
  totalAvecEffetClub: number;

  @ApiProperty({
    description: 'Nombre d\'offres sans effet club ou avec effet club négatif',
    example: 7,
  })
  totalSansEffetClub: number;
}
