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
  @ApiOperation({ summary: 'Créer une réponse interne' })
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        classeCourrier: { type: 'string' },
        typesCourrierIds: { type: 'string', description: 'JSON array ou liste séparée par virgules' },
        objet: { type: 'string' },
        commentairePublic: { type: 'string' },
        idService: { type: 'number' },
        typeTransmission: { type: 'string' },
        nombrePieceJointe: { type: 'number' },
        piecesJointesData: {
          type: 'string',
          description: 'JSON stringifié contenant les intitulés des pièces jointes',
          example: '[{"intitule":"PJ 1"},{"intitule":"PJ 2"}]',
        },
        sendNotification: { type: 'boolean', example: true, default: false },
        piecesJointes: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
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
  @ApiOperation({ summary: 'Mettre à jour une réponse interne' })
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourrierInterneDto,
    @UploadedFiles() files: { piecesJointes?: Express.Multer.File[] },
  ) {
    return this.courrierInterneService.update(id, dto, files?.piecesJointes || []);
  }

  // 📋 Lister les réponses internes
  @Get()
  @ApiOperation({ summary: 'Lister les réponses internes' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'dateArriveeDebut', required: false, type: String })
  @ApiQuery({ name: 'dateArriveeFin', required: false, type: String })
  @ApiQuery({ name: 'dateEnregistrement', required: false, type: String })
  @ApiQuery({ name: 'priorite', required: false, type: String })
  @ApiQuery({ name: 'categorie', required: false, type: String })
  @ApiQuery({ name: 'categorieId', required: false, type: Number })
  @ApiQuery({ name: 'typeCourrierId', required: false, type: Number })
  @ApiQuery({ name: 'statut', required: false, type: String })
  @ApiQuery({ name: 'dernierStatut', required: false, type: String })
  @ApiQuery({ name: 'serviceId', required: false, type: Number })
  @ApiQuery({ name: 'dernierServiceId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Réponses récupérées avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Liste réponses',
        message: 'Réponses récupérées avec succès.',
        data: [
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
      },
    },
  })
  findAll(@CurrentUser() user: any, @Query() query: ListCourrierInterneQueryDto) {
    return this.courrierInterneService.findAll(user.id, query);
  }

  // 🔎 Détail d'une réponse interne
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
