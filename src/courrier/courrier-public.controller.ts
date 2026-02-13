// src/courrier/courrier-public.controller.ts

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CourrierService } from './courrier.service';

@ApiTags('Courrier Arrivée Public')
@Controller('courrier/public')
export class CourrierPublicController {
  constructor(private readonly courrierService: CourrierService) {}

  // 🔓 Parcours public d'un courrier par référence
  @Get('parcours/:reference')
  @ApiOperation({
    summary: 'Parcours public d’un courrier (sans sécurité)',
    description: 'Retourne le parcours public d’un courrier arrivée à partir de sa référence.',
  })
  @ApiParam({ name: 'reference', type: String, required: true })
  @ApiResponse({
    status: 200,
    description: 'Parcours public récupéré avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Parcours courrier public',
        message: 'Parcours public récupéré avec succès.',
        data: {
          reference: '2025-09-001',
          numero: '2025-09-001',
          parcours: [
            {
              type: 'transmission',
              service_source: 'Secrétariat Général',
              responsable_source: 'Jean Dupont',
              service_destination: 'Cabinet du Ministre',
              responsable_destination: 'Marie Martin',
              date_envoi: '2025-09-20T14:30:00.000Z',
              date_reception: '2025-09-21T09:15:00.000Z',
              commentaire: 'Transmission pour signature',
              but: 'Pour traiter',
              statut: 'Reçu',
            },
          ],
        },
      },
    },
  })
  getPublicParcours(@Param('reference') reference: string) {
    return this.courrierService.getPublicParcours(reference);
  }

  // 🔓 Recherche publique exacte
  @Get('search')
  @ApiOperation({
    summary: 'Recherche publique exacte de courrier (sans sécurité)',
    description: 'Recherche stricte par correspondance exacte sur champs du courrier ou du correspondant.',
  })
  @ApiQuery({ name: 'term', type: String, required: true })
  @ApiResponse({
    status: 200,
    description: 'Résultats récupérés avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Recherche publique courriers',
        message: 'Résultats récupérés avec succès.',
        data: [
          {
            registre: 'MINEPIA/2025/09/17/25/A',
            datearrivee: '2025-09-17T10:30:00.000Z',
            date_signature: '2025-09-18T14:00:00.000Z',
            emetteur_nom_prenom: 'MINEPIA/SG - Secrétariat Général',
            objetcourrier: 'Demande d\'autorisation',
            dernier_service_emetteur_libelle: 'Direction Générale',
            dernier_service_recu_libelle: 'Service du courrier entrant',
            type_diffusion_libelle: 'Copie',
            commentaire: 'Traitement en cours',
            commentaire_reponse: 'Traitement effectué le 25/09.',
            numeroActe: '3',
            dateSignature: '2025-09-20T16:00:00.000Z',
            signataire: {
              id: 5,
              nom: 'Dr. Marie DUBOIS',
              service: 'Direction des Ressources Humaines',
            },
          },
        ],
      },
    },
  })
  searchPublicExact(@Query('term') term: string) {
    return this.courrierService.searchPublicExact(term);
  }
}
