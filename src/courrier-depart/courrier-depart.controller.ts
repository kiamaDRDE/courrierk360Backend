// src/courrier-depart/courrier-depart.controller.ts

import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CourrierDepartService } from './courrier-depart.service';
import { CreateCourrierDepartDto } from './dto/create-courrier-depart.dto';
import { UpdateCourrierDepartDto } from './dto/update-courrier-depart.dto';
import { CourrierDepartIdsDto, ListCourrierDepartQueryDto } from './dto/list-courrier-depart-query.dto';

@ApiTags('Courrier Départ')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courrier-depart')
export class CourrierDepartController {
  constructor(private readonly courrierDepartService: CourrierDepartService) {}

  // 📋 Liste des courriers départ
  @Get()
  @ApiOperation({
    summary: 'Lister les courriers départ',
    description: `Liste paginée des courriers départ avec filtres et recherche.
    
Retourne toutes les informations détaillées incluant:
- Les données du courrier départ (numeroReference, numeroActe, objet, typeCourrier, commentaire, destinataire, projet, etc.)
- Le courrier lié (si existe) avec ses détails (numero, reference, objet, is_geled, dates, typeCourrier, provenance, priorite, statut)
- Les pièces jointes avec { id, nom, chemin, type }
- Les provenances en copie
- Les métadonnées (isDelete, isArchive, createdAt)`,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de la page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche dans numeroReference, numeroActe, objet, commentaire, destinataire, projet, courrier lié' })
  @ApiQuery({ name: 'dateArriveeDebut', required: false, type: String, description: 'Date début (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateArriveeFin', required: false, type: String, description: 'Date fin (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateEnregistrementDebut', required: false, type: String, description: 'Date début (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateEnregistrementFin', required: false, type: String, description: 'Date fin (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'priorite', required: false, type: String, description: 'Filtrer par priorité' })
  @ApiQuery({ name: 'typeCourrierId', required: false, type: Number, description: 'Filtrer par ID de type de courrier' })
  @ApiQuery({ name: 'statut', required: false, type: String, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'dernierStatut', required: false, type: String, description: 'Filtrer par dernier statut de transmission' })
  @ApiQuery({ name: 'serviceId', required: false, type: Number, description: 'Filtrer par ID de service' })
  @ApiQuery({ name: 'dernierServiceId', required: false, type: Number, description: 'Filtrer par dernier service de transmission' })
  @ApiQuery({ name: 'provenanceId', required: false, type: Number, description: 'Filtrer par ID de provenance' })
  @ApiResponse({
    status: 200,
    description: 'Courriers départ récupérés avec succès.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Liste des courriers départ' },
        message: { type: 'string', example: '10 courrier(s) départ récupéré(s) avec succès.' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  numeroReference: { type: 'string' },
                  numeroActe: { type: 'string' },
                  typeCourrier: { type: 'string' },
                  objet: { type: 'string' },
                  commentaire: { type: 'string' },
                  document: { type: 'string' },
                  idCourrier: { type: 'number', nullable: true },
                  idDestinataire: { type: 'number', nullable: true },
                  idProjet: { type: 'number', nullable: true },
                  destinataire: { type: 'object', nullable: true, properties: { id: { type: 'number' }, nom: { type: 'string' } } },
                  projet: { type: 'object', nullable: true, properties: { id: { type: 'number' }, name: { type: 'string' } } },
                  nombrePieceJointe: { type: 'number' },
                  provenancesCopie: { 
                    type: 'array',
                    description: 'Liste des correspondants en copie avec leurs détails',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        nom: { type: 'string' },
                      }
                    }
                  },
                  piecesJointes: { type: 'array' },
                  courrier: { 
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'number' },
                      numero: { type: 'string' },
                      reference: { type: 'string' },
                      objet: { type: 'string' },
                      is_geled: { type: 'boolean' },
                      dateArrivee: { type: 'string' },
                      dateEnregistrement: { type: 'string' },
                      typeCourrier: { type: 'string', nullable: true },
                      provenance: { type: 'string', nullable: true },
                      priorite: { type: 'string' },
                      statut: { type: 'string', nullable: true },
                    }
                  },
                  dernierStatutService: {
                    type: 'object',
                    nullable: true,
                    description: 'Dernier statut et service de transmission du courrier lié',
                    properties: {
                      statut: { type: 'string', example: 'Transmis' },
                      service: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          id: { type: 'number', example: 5 },
                          nom: { type: 'string', example: 'Finance' },
                          sigle: { type: 'string', nullable: true, example: 'FIN' },
                        },
                      },
                    },
                  },
                  isDelete: { type: 'boolean' },
                  isArchive: { type: 'boolean' },
                  createdAt: { type: 'string' },
                },
              },
            },
            pagination: { type: 'object' },
          },
        },
      },
    },
  })
  list(@Query() query: ListCourrierDepartQueryDto) {
    return this.courrierDepartService.list(query);
  }

  // 📝 Créer un courrier départ
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document', maxCount: 1 },
      { name: 'piecesJointes', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Créer un courrier départ',
    description: 'Crée un courrier départ avec document et pièces jointes. Peut notifier par email.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['document', 'numeroReference', 'objet', 'idDestinataire', 'typeCourrier', 'projet'],
      properties: {
        numeroReference: { type: 'string', example: 'MINEPIA/2025/09/17/25/A' },
        objet: { type: 'string', example: 'Objet du courrier' },
        idDestinataire: { type: 'number', example: 10, description: 'ID du destinataire (correspondant)' },
        projet: { type: 'number', example: 243, description: 'ID du projet' },
        numeroActe: { type: 'string', example: 'ACTE-2025-001', description: 'Numéro d\'acte du courrier départ' },
        idCourrier: { type: 'number', example: 123, description: 'ID du courrier lié (optionnel)' },
        provenancesCopie: { 
          type: 'string', 
          example: '[15, 60, 354]',
          description: 'JSON string contenant un tableau d\'IDs des correspondants en copie'
        },
        typeCourrier: { type: 'string', example: 'Note' },
        commentaire: { type: 'string', example: 'Traitement effectué' },
        nombrePieceJointe: { type: 'number', example: 2 },
        piecesJointesData: {
          type: 'string',
          example: '[{"intitule":"PJ 1"},{"intitule":"PJ 2"}]',
        },
        sendNotification: { type: 'boolean', example: true, default: false },
        document: { type: 'string', format: 'binary' },
        piecesJointes: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Courrier départ créé avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Création courrier départ',
        message: 'Courrier départ créé avec succès. 2 pièce(s) jointe(s) ajoutée(s).',
        data: {
          courrierDepart: {
            id: 1,
            numeroReference: 'MINEPIA/2025/09/17/25/A',
            objet: 'Objet du courrier',
            idDestinataire: 10,
            idProjet: 243,
            typeCourrier: 'Note',
            commentaire: 'Traitement effectué',
            document: 'courrier-depart/1700000000000-document.pdf',
            nombrePieceJointe: 2,
          },
          piecesJointes: [
            {
              id: 201,
              nom: 'pj1.pdf',
              intitule: 'PJ 1',
              chemin: 'courrier-depart/1700000000001-pj1.pdf',
              type: 'application/pdf',
            },
          ],
        },
      },
    },
  })
  create(
    @Body() dto: CreateCourrierDepartDto,
    @UploadedFiles() files: { document?: Express.Multer.File[]; piecesJointes?: Express.Multer.File[] },
  ) {
    const document = files?.document?.[0];
    const piecesJointes = files?.piecesJointes || [];
    return this.courrierDepartService.create(dto, document, piecesJointes);
  }

  // ✏️ Mettre à jour un courrier départ
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document', maxCount: 1 },
      { name: 'piecesJointes', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Mettre à jour un courrier départ',
    description: 'Met à jour un courrier départ avec document et pièces jointes. Peut notifier par email.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        numeroReference: { type: 'string', example: 'MINEPIA/2025/09/17/25/A' },
        numeroActe: { type: 'string', example: 'ACTE-2025-001', description: 'Numéro d\'acte du courrier départ' },
        idCourrier: { type: 'number', example: 123, description: 'ID du courrier lié (optionnel)' },
        provenancesCopie: { 
          type: 'string', 
          example: '[15, 60, 354]',
          description: 'JSON string contenant un tableau d\'IDs des correspondants en copie'
        },
        typeCourrier: { type: 'string', example: 'Note' },
        commentaire: { type: 'string', example: 'Traitement effectué' },
        nombrePieceJointe: { type: 'number', example: 2 },
        piecesJointesData: {
          type: 'string',
          example: '[{"intitule":"PJ 1"},{"intitule":"PJ 2"}]',
        },
        sendNotification: { type: 'boolean', example: true, default: false },
        document: { type: 'string', format: 'binary' },
        piecesJointes: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Courrier départ mis à jour avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Mise à jour courrier départ',
        message: 'Courrier départ mis à jour avec succès. 1 pièce(s) jointe(s) ajoutée(s).',
        data: {
          courrierDepart: {
            id: 1,
            numeroReference: 'MINEPIA/2025/09/17/25/A',
            objet: 'Objet du courrier',
            idDestinataire: 10,
            idProjet: 243,
            typeCourrier: 'Note',
            commentaire: 'Traitement mis à jour',
            document: 'courrier-depart/1700000000000-document.pdf',
            nombrePieceJointe: 3,
          },
          piecesJointes: [
            {
              id: 202,
              nom: 'pj2.pdf',
              intitule: 'PJ 2',
              chemin: 'courrier-depart/1700000000002-pj2.pdf',
              type: 'application/pdf',
            },
          ],
        },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourrierDepartDto,
    @UploadedFiles() files: { document?: Express.Multer.File[]; piecesJointes?: Express.Multer.File[] },
  ) {
    const document = files?.document?.[0];
    const piecesJointes = files?.piecesJointes || [];
    return this.courrierDepartService.update(id, dto as CreateCourrierDepartDto, document, piecesJointes);
  }

  // 🔍 Détails d'un courrier départ
  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un courrier départ' })
  @ApiResponse({ status: 200, description: 'Courrier départ récupéré avec succès.' })
  @ApiResponse({ status: 404, description: 'Courrier départ non trouvé.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courrierDepartService.findOne(id);
  }

  // 📦 Détails de plusieurs courriers départ
  @Post('details')
  @ApiOperation({ summary: 'Détails de plusieurs courriers départ' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'number' }, example: [1, 2, 3] } },
      required: ['ids'],
    },
  })
  @ApiResponse({ status: 200, description: 'Courriers départ récupérés avec succès.' })
  findManyByIds(@Body() dto: CourrierDepartIdsDto) {
    return this.courrierDepartService.findManyByIds(dto.ids);
  }

  // 📧🔔 Notifier par mail et SMS
  @Post(':id/notify')
  @ApiOperation({ summary: 'Notifier par mail et SMS un courrier départ' })
  @ApiResponse({
    status: 200,
    description: 'Notification envoyée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Notification courrier départ',
        message: 'Notification envoyée avec succès.',
        data: { id: 1, emailSent: true, smsSent: true },
      },
    },
  })
  notify(@Param('id', ParseIntPipe) id: number) {
    return this.courrierDepartService.notify(id);
  }

  // 🗑️ Suppression logique
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un courrier départ (logique)' })
  @ApiResponse({ status: 200, description: 'Courrier départ supprimé (logique) avec succès.' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.courrierDepartService.delete(id);
  }

  // 🗑️ Suppression permanente
  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Supprimer un courrier départ (permanent)' })
  @ApiResponse({ status: 200, description: 'Courrier départ supprimé définitivement avec succès.' })
  deletePermanent(@Param('id', ParseIntPipe) id: number) {
    return this.courrierDepartService.deletePermanent(id);
  }
}
