// src/courrier-interne/courrier-interne.controller.ts

import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CourrierInterneService } from './courrier-interne.service';
import { CreateCourrierInterneDto } from './dto/create-courrier-interne.dto';
import { UpdateCourrierInterneDto } from './dto/update-courrier-interne.dto';
import { ListCourrierInterneQueryDto } from './dto/list-courrier-interne-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Courrier Interne')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courrier-interne')
export class CourrierInterneController {
  constructor(private readonly courrierInterneService: CourrierInterneService) {}

  // 📝 Créer une réponse interne
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'piecesJointes', maxCount: 10 }]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Créer une réponse interne',
    description: `
Créer une réponse courrier interne avec possibilité de la lier à des transmissions existantes.

**Champs obligatoires** :
- classeCourrier : Classe du courrier
- typesCourrierIds : IDs des types de courrier (JSON array ou liste CSV)
- objet : Objet du courrier
- idService : ID du service destinataire

**Champs optionnels** :
- idTransmissions : IDs des transmissions à lier (JSON array ou liste CSV)
- commentairePublic : Commentaire public
- typeTransmission : Type de transmission
- nombrePieceJointe : Nombre de pièces jointes
- piecesJointesData : Métadonnées des pièces jointes (JSON)
- sendNotification : Envoyer une notification (email/SMS) au service
- piecesJointes : Fichiers à joindre

**⚠️ RESTRICTION IMPORTANTE** :
Vous ne pouvez pas créer un courrier interne à destination de votre propre service. Le service destinataire (idService) doit être différent du service de l'utilisateur connecté.

**Exemple d'utilisation** :
Si vous liez des transmissions existantes, la réponse sera associée à ces transmissions pour un suivi cohérent.
    `
  })
  @ApiResponse({
    status: 201,
    description: 'Réponse créée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Création réponse',
        message: 'Réponse créée avec succès. 2 pièce(s) jointe(s) ajoutée(s).',
        data: {
          reponse: {
            id: 15,
            objet: 'Note interne',
            classeCourrier: 'Interne',
            typesCourrierIds: [1, 3],
            commentairePublic: 'Traitement effectué',
            idService: 2,
            typeTransmission: 'Copie',
            nombrePieceJointe: 2,
            idRedacteur: 5,
            createdAt: '2025-09-20T10:30:00.000Z',
          },
          piecesJointes: [
            {
              id: 101,
              nom: 'pj1.pdf',
              intitule: 'PJ 1',
              chemin: 'reponses/1720000000000-0-pj1.pdf',
              type: 'application/pdf',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation ou tentative de créer un courrier interne à son propre service.',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'error',
        title: 'Erreur de validation',
        message: 'Vous ne pouvez pas créer un courrier interne à destination de votre propre service.',
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        classeCourrier: { 
          type: 'string', 
          description: 'Classe du courrier (obligatoire)',
          example: 'Interne'
        },
        typesCourrierIds: { 
          type: 'string', 
          description: 'IDs des types de courrier - JSON array ou liste CSV (obligatoire)',
          example: '[1,3]'
        },
        objet: { 
          type: 'string', 
          description: 'Objet du courrier (obligatoire)',
          example: 'Réponse à la demande d\'information'
        },
        idService: { 
          type: 'number', 
          description: 'ID du service destinataire (obligatoire)',
          example: 2
        },
        idTransmissions: {
          type: 'string',
          description: 'IDs des transmissions à lier - JSON array ou liste CSV (optionnel)',
          example: '[10,15,20]'
        },
        commentairePublic: { 
          type: 'string', 
          description: 'Commentaire public (optionnel)',
          example: 'Traitement effectué selon la procédure'
        },
        typeTransmission: { 
          type: 'string', 
          description: 'Type de transmission (optionnel)',
          example: 'Copie'
        },
        nombrePieceJointe: { 
          type: 'number', 
          description: 'Nombre de pièces jointes (optionnel, calculé automatiquement)',
          example: 2
        },
        piecesJointesData: {
          type: 'string',
          description: 'Métadonnées des pièces jointes en JSON (optionnel)',
          example: '[{"intitule":"Document annexe"},{"intitule":"Justificatif"}]',
        },
        sendNotification: { 
          type: 'boolean', 
          description: 'Envoyer une notification email/SMS au service (optionnel)',
          example: true, 
          default: false 
        },
        piecesJointes: {
          type: 'array',
          description: 'Fichiers à joindre (optionnel)',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['classeCourrier', 'typesCourrierIds', 'objet', 'idService']
    },
  })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateCourrierInterneDto,
    @UploadedFiles() files: { piecesJointes?: Express.Multer.File[] },
  ) {
    return this.courrierInterneService.create(user.id, dto, files?.piecesJointes || []);
  }

  // ✏️ Mettre à jour une réponse interne
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'piecesJointes', maxCount: 10 }]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Mettre à jour une réponse interne',
    description: `
Mettre à jour une réponse courrier interne existante.

**⚠️ RESTRICTION IMPORTANTE** :
Vous ne pouvez pas modifier le service destinataire (idService) pour qu'il soit votre propre service. Le service destinataire doit rester différent du service de l'utilisateur connecté.
    `
  })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({
    status: 200,
    description: 'Réponse mise à jour avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Mise à jour réponse',
        message: 'Réponse mise à jour avec succès. 1 pièce(s) jointe(s) ajoutée(s).',
        data: {
          reponse: {
            id: 15,
            objet: 'Note interne (MAJ)',
            classeCourrier: 'Interne',
            typesCourrierIds: [1, 3],
            commentairePublic: 'Traitement validé',
            idService: 2,
            typeTransmission: 'Copie',
            nombrePieceJointe: 3,
            service: { id: 2, nom: 'Direction Générale', sigle: 'DG' },
            redacteur: { id: 5, username: 'jdupont', firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com' },
            piecesJointes: [
              { id: 101, nom: 'pj1.pdf', intitule: 'PJ 1', chemin: 'reponses/1720000000000-0-pj1.pdf', type: 'application/pdf' },
            ],
            courriers: [{ courrierId: 12 }],
          },
          piecesJointesAjoutees: [
            { id: 102, nom: 'pj2.pdf', intitule: 'PJ 2', chemin: 'reponses/1720000000001-0-pj2.pdf', type: 'application/pdf' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation ou tentative de modifier le service destinataire vers son propre service.',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'error',
        title: 'Erreur de validation',
        message: 'Vous ne pouvez pas modifier le service destinataire pour qu\'il soit votre propre service.',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Réponse introuvable.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'error',
        title: 'Ressource introuvable',
        message: 'Réponse avec l\'ID 999 introuvable.',
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourrierInterneDto,
    @UploadedFiles() files: { piecesJointes?: Express.Multer.File[] },
  ) {
    return this.courrierInterneService.update(id, dto, files?.piecesJointes || []);
  }

  // 📋 Lister les courriers internes envoyés par moi
  @Get()
  @ApiOperation({ 
    summary: 'Lister les courriers internes envoyés par moi',
    description: 'Récupère tous les courriers internes (réponses) créés par l\'utilisateur connecté (filtré par idRedacteur)'
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche globale (objet, commentaire, numéro courrier, etc.)' })
  @ApiQuery({ name: 'dateArriveeDebut', required: false, type: String, description: 'Date d\'arrivée début (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateArriveeFin', required: false, type: String, description: 'Date d\'arrivée fin (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateEnregistrement', required: false, type: String, description: 'Date d\'enregistrement (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'priorite', required: false, type: String, description: 'Filtrer par priorité' })
  @ApiQuery({ name: 'categorie', required: false, type: String, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'categorieId', required: false, type: Number, description: 'Filtrer par ID catégorie' })
  @ApiQuery({ name: 'typeCourrierId', required: false, type: Number, description: 'Filtrer par ID type courrier' })
  @ApiQuery({ name: 'statut', required: false, type: String, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'dernierStatut', required: false, type: String, description: 'Filtrer par dernier statut' })
  @ApiQuery({ name: 'serviceId', required: false, type: Number, description: 'Filtrer par ID service' })
  @ApiQuery({ name: 'dernierServiceId', required: false, type: Number, description: 'Filtrer par ID dernier service' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de la page (défaut: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10, max: 100)', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Courriers internes envoyés par l\'utilisateur connecté récupérés avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Courriers internes envoyés',
        message: '3 courrier(s) interne(s) envoyé(s) par vous récupéré(s) avec succès.',
        data: {
          items: [
            {
              id: 15,
              objet: 'Note interne',
              classeCourrier: 'Interne',
              typesCourrierIds: [1, 3],
              commentairePublic: 'Traitement effectué',
              idService: 2,
              typeTransmission: 'Copie',
              nombrePieceJointe: 2,
              service: { id: 2, nom: 'Direction Générale', sigle: 'DG' },
              redacteur: { id: 5, username: 'jdupont', firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com' },
              piecesJointes: [
                { id: 101, nom: 'pj1.pdf', intitule: 'PJ 1', chemin: 'reponses/1720000000000-0-pj1.pdf', type: 'application/pdf' },
              ],
              courriers: [
                {
                  id: 12,
                  numero: 'CRR-2025-00456',
                  reference: 'REF/DRH/2025/0123',
                  objet: 'Demande de congé annuel',
                  dateArrivee: '2025-12-10',
                  dateEnregistrement: '2025-12-10',
                  typeCourrier: { id: 3, nom: 'Demande administrative', type: 'Entrant', classeCourrier: 'Normal' },
                  provenance: { id: 8, nom: 'Direction des Ressources Humaines', telephone: '+237600000000', email: 'drh@example.com', type: 'Structure' },
                  categorie: 'Administration',
                  priorite: 'Haute',
                },
              ],
            },
          ],
          pagination: {
            total: 25,
            page: 1,
            limit: 10,
            totalPages: 3,
          },
        },
      },
    },
  })
  findAll(@CurrentUser() user: any, @Query() query: ListCourrierInterneQueryDto) {
    return this.courrierInterneService.findAll(user.id, query);
  }

  // � Lister les courriers internes reçus par mon service
  @Get('recus/mon-service')
  @ApiOperation({ 
    summary: 'Lister les courriers internes reçus par mon service',
    description: 'Récupère tous les courriers internes (réponses) reçus par le service de l\'utilisateur connecté (filtré par idService)'
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche globale (objet, commentaire, numéro courrier, etc.)' })
  @ApiQuery({ name: 'dateArriveeDebut', required: false, type: String, description: 'Date d\'arrivée début (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateArriveeFin', required: false, type: String, description: 'Date d\'arrivée fin (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateEnregistrement', required: false, type: String, description: 'Date d\'enregistrement (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'priorite', required: false, type: String, description: 'Filtrer par priorité' })
  @ApiQuery({ name: 'categorie', required: false, type: String, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'categorieId', required: false, type: Number, description: 'Filtrer par ID catégorie' })
  @ApiQuery({ name: 'typeCourrierId', required: false, type: Number, description: 'Filtrer par ID type courrier' })
  @ApiQuery({ name: 'statut', required: false, type: String, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'dernierStatut', required: false, type: String, description: 'Filtrer par dernier statut' })
  @ApiQuery({ name: 'serviceId', required: false, type: Number, description: 'Filtrer par ID service' })
  @ApiQuery({ name: 'dernierServiceId', required: false, type: Number, description: 'Filtrer par ID dernier service' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de la page (défaut: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10, max: 100)', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Courriers internes reçus par le service de l\'utilisateur connecté récupérés avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Courriers internes reçus',
        message: '5 courrier(s) interne(s) reçu(s) par votre service récupéré(s) avec succès.',
        data: {
          items: [
            {
              id: 15,
              objet: 'Note interne',
              classeCourrier: 'Interne',
              typesCourrierIds: [1, 3],
              commentairePublic: 'Traitement effectué',
              idService: 2,
              typeTransmission: 'Copie',
              nombrePieceJointe: 2,
              service: { id: 2, nom: 'Direction Générale', sigle: 'DG' },
              redacteur: { id: 5, username: 'jdupont', firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com' },
              piecesJointes: [
                { id: 101, nom: 'pj1.pdf', intitule: 'PJ 1', chemin: 'reponses/1720000000000-0-pj1.pdf', type: 'application/pdf' },
              ],
            },
          ],
          pagination: {
            total: 42,
            page: 1,
            limit: 10,
            totalPages: 5,
          },
        },
      },
    },
  })
  findRecusByService(@CurrentUser() user: any, @Query() query: ListCourrierInterneQueryDto) {
    return this.courrierInterneService.findRecusByService(user.id, query);
  }

  // �🔎 Détail d'une réponse interne
  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une réponse interne' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({
    status: 200,
    description: 'Réponse récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Détail réponse',
        message: 'Réponse récupérée avec succès.',
        data: {
          id: 15,
          objet: 'Note interne',
          classeCourrier: 'Interne',
          typesCourrierIds: [1, 3],
          commentairePublic: 'Traitement effectué',
          idService: 2,
          typeTransmission: 'Copie',
          nombrePieceJointe: 2,
          service: { id: 2, nom: 'Direction Générale', sigle: 'DG' },
          redacteur: { id: 5, username: 'jdupont', firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com' },
          piecesJointes: [
            { id: 101, nom: 'pj1.pdf', intitule: 'PJ 1', chemin: 'reponses/1720000000000-0-pj1.pdf', type: 'application/pdf' },
          ],
          courriers: [
            {
              id: 12,
              numero: 'CRR-2025-00456',
              reference: 'REF/DRH/2025/0123',
              objet: 'Demande de congé annuel',
              dateArrivee: '2025-12-10',
              dateEnregistrement: '2025-12-10',
              typeCourrier: { id: 3, nom: 'Demande administrative', type: 'Entrant', classeCourrier: 'Normal' },
              provenance: { id: 8, nom: 'Direction des Ressources Humaines', telephone: '+237600000000', email: 'drh@example.com', type: 'Structure' },
              categorie: 'Administration',
              priorite: 'Haute',
            },
          ],
        },
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courrierInterneService.findOne(id);
  }

  // 🗑️ Suppression logique
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une réponse interne (logique)' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Réponse supprimée (logique) avec succès.' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.courrierInterneService.delete(id);
  }

  // 🗑️ Suppression permanente
  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Supprimer une réponse interne (permanente)' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Réponse supprimée définitivement avec succès.' })
  deletePermanent(@Param('id', ParseIntPipe) id: number) {
    return this.courrierInterneService.deletePermanent(id);
  }
}
