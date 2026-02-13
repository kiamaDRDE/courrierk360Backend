// src/bordereau-transmission/bordereau-transmission.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BordereauTransmissionService } from './bordereau-transmission.service';
import { CreateBordereauDto } from './dto/create-bordereau.dto';
import { UpdateBordereauDto } from './dto/update-bordereau.dto';
import { BordereauQueryDto } from './dto/bordereau-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bordereau de Transmission')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bordereau-transmission')
export class BordereauTransmissionController {
  constructor(private readonly bordereauTransmissionService: BordereauTransmissionService) {}

  // 📝 Créer plusieurs bordereaux de transmission
  @Post()
  @ApiOperation({
    summary: 'Créer plusieurs bordereaux de transmission',
    description: 'Crée un ou plusieurs bordereaux de transmission avec leurs correspondants et courriers associés. Vérifie que tous les correspondants et courriers existent avant la création.',
  })
  @ApiResponse({
    status: 201,
    description: 'Bordereaux de transmission créés avec succès.',
    schema: {
      example: {
        success: true,
        message: '2 bordereau(x) de transmission créé(s) avec succès.',
        title: 'Création de bordereaux',
        data: [
          {
            id: 1,
            correspondantId: 1,
            courrierIds: [5, 8, 12],
            numeroReference: 'BT-2025-00001',
            nombrePieceJointe: 5,
            createdAt: '2025-11-21T10:30:00.000Z',
            updatedAt: '2025-11-21T10:30:00.000Z',
          },
          {
            id: 2,
            correspondantId: 2,
            courrierIds: [3, 7],
            numeroReference: 'BT-2025-00001',
            nombrePieceJointe: 5,
            createdAt: '2025-11-21T10:30:00.000Z',
            updatedAt: '2025-11-21T10:30:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Correspondant ou courrier non trouvé.',
    schema: {
      example: {
        success: false,
        message: 'Un ou plusieurs correspondants sont introuvables.',
        title: 'Erreur',
      },
    },
  })
  create(@Body() createBordereauDto: CreateBordereauDto) {
    return this.bordereauTransmissionService.create(createBordereauDto);
  }

  // ✏️ Mettre à jour plusieurs bordereaux de transmission
  @Patch()
  @ApiOperation({
    summary: 'Mettre à jour plusieurs bordereaux de transmission',
    description: 'Met à jour plusieurs bordereaux de transmission avec leurs correspondants et courriers associés. Vérifie que tous les bordereaux, correspondants et courriers existent avant la mise à jour.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bordereaux de transmission mis à jour avec succès.',
    schema: {
      example: {
        success: true,
        message: '2 bordereau(x) de transmission mis à jour avec succès.',
        title: 'Mise à jour de bordereaux',
        data: [
          {
            id: 1,
            correspondantId: 1,
            courrierIds: [5, 8, 12],
            numeroReference: 'BT-2025-00001',
            nombrePieceJointe: 5,
            createdAt: '2025-11-21T10:30:00.000Z',
            updatedAt: '2025-11-24T14:45:00.000Z',
          },
          {
            id: 2,
            correspondantId: 2,
            courrierIds: [3, 7],
            numeroReference: 'BT-2025-00001',
            nombrePieceJointe: 5,
            createdAt: '2025-11-21T10:30:00.000Z',
            updatedAt: '2025-11-24T14:45:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Bordereau, correspondant ou courrier non trouvé.',
    schema: {
      example: {
        success: false,
        message: 'Un ou plusieurs bordereaux sont introuvables.',
        title: 'Erreur',
      },
    },
  })
  update(@Body() updateBordereauDto: UpdateBordereauDto) {
    return this.bordereauTransmissionService.update(updateBordereauDto);
  }

  // 📋 Liste de tous les bordereaux de transmission
  @Get()
  @ApiOperation({
    summary: 'Liste de tous les bordereaux de transmission',
    description: 'Récupère la liste de tous les bordereaux de transmission avec pagination et filtres. Inclut les informations détaillées des courriers, destinataires et signataires.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de la page (défaut: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10)', example: 10 })
  @ApiQuery({ name: 'numeroReference', required: false, type: String, description: 'Filtrer par numéro de référence', example: 'BT-2025-00001' })
  @ApiResponse({
    status: 200,
    description: 'Liste des bordereaux récupérée avec succès.',
    schema: {
      example: {
        success: true,
        message: '15 bordereau(x) de transmission trouvé(s).',
        title: 'Liste des bordereaux',
        data: {
          total: 15,
          page: 1,
          limit: 10,
          totalPages: 2,
          data: [
            {
              id: 1,
              correspondantId: 5,
              courrierIds: [1, 2, 3, 5, 8],
              courriers: [
                {
                  id: 1,
                  numeroReference: 'CD-2025-001',
                  typeCourrier: 'Lettre',
                  classeCourrier: 'Normal',
                  categorie: 'Administratif',
                  dateSignature: '2025-11-20T10:00:00.000Z',
                  numeroActe: 'ACT-001',
                  document: 'document.pdf',
                  commentaire: 'Commentaire',
                  destinataire: {
                    id: 1,
                    nom: 'Ministère XYZ',
                  },
                  signataire: {
                    id: 1,
                    lastName: 'Dupont',
                    firstName: 'Jean',
                  },
                },
              ],
              numeroReference: 'BT-2025-00001',
              nombrePieceJointe: 5,
              createdAt: '2025-11-21T10:30:00.000Z',
              updatedAt: '2025-11-24T14:45:00.000Z',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé - Token JWT manquant ou invalide.',
  })
  findAll(@Query() query: BordereauQueryDto) {
    return this.bordereauTransmissionService.findAll(query);
  }

  // 🔍 Récupérer un bordereau par ID
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un bordereau de transmission par ID',
    description: 'Récupère les détails complets d\'un bordereau de transmission incluant toutes les informations des courriers, provenances copie, destinataire, signataire et courrier lié.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bordereau récupéré avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Bordereau de transmission récupéré avec succès.',
        title: 'Détails du bordereau',
        data: {
          id: 1,
          correspondantId: 5,
          courrierIds: [1, 2, 3, 5, 8],
          courriers: [
            {
              id: 1,
              numeroReference: 'CD-2025-001',
              typeCourrier: 'Lettre',
              classeCourrier: 'Normal',
              categorie: 'Administratif',
              dateSignature: '2025-11-20T10:00:00.000Z',
              numeroActe: 'ACT-001',
              document: 'document.pdf',
              commentaire: 'Commentaire du courrier',
              email: 'contact@example.com',
              numeroTelephone: '+237123456789',
              destinataire: {
                id: 1,
                nom: 'Ministère XYZ',
              },
              signataire: {
                id: 1,
                lastName: 'Dupont',
                firstName: 'Jean',
              },
              courrier: {
                id: 1,
                objet: 'Objet du courrier',
              },
            },
          ],
          numeroReference: 'BT-2025-00001',
          nombrePieceJointe: 5,
          createdAt: '2025-11-21T10:30:00.000Z',
          updatedAt: '2025-11-24T14:45:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Bordereau non trouvé.',
    schema: {
      example: {
        success: false,
        message: 'Bordereau de transmission non trouvé.',
        title: 'Erreur',
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bordereauTransmissionService.findOne(id);
  }

  // 🗑️ Supprimer un bordereau de transmission
  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un bordereau de transmission',
    description: 'Supprime définitivement un bordereau de transmission de la base de données.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bordereau supprimé avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Bordereau de transmission supprimé avec succès.',
        title: 'Suppression bordereau',
        data: {
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Bordereau non trouvé.',
    schema: {
      example: {
        success: false,
        message: 'Bordereau de transmission non trouvé.',
        title: 'Erreur',
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bordereauTransmissionService.remove(id);
  }
}
