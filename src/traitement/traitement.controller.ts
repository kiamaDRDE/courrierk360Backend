// src/traitement/traitement.controller.ts

import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Patch,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TraitementService } from './traitement.service';
import { CreateTraitementDto } from './dto/create-traitement.dto';
import { UpdateTraitementDto } from './dto/update-traitement.dto';
import { AccuserReceptionTransmissionsDto } from './dto/accuser-reception-transmissions.dto';
import { ClasserTransmissionDto } from './dto/classer-transmission.dto';
import { ListTransmissionsQueryDto } from './dto/list-transmissions-query.dto';
import { RelanceQueryDto } from './dto/relance-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Traitement')
@Controller('traitement')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TraitementController {
  constructor(private readonly traitementService: TraitementService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document', maxCount: 1 },
      { name: 'piecesJointes', maxCount: 10 },
    ]),
  )
  @ApiOperation({
    summary: 'Créer une transmission (traitement)',
    description: `Permet de créer une transmission pour un courrier avec upload de document et pièces jointes.

    **Règles de validation** :
    - Le courrier (idCourrier) doit exister
    - Le service destinataire (idService) doit exister
    - Le service destinataire doit avoir le type Poste
    - L'émetteur (idEmetteur) doit exister (si fourni, sinon utilisateur connecté)
    - L'utilisateur connecté ne peut pas transmettre à son propre service
    - Les champs obligatoires sont : idCourrier, idService, dateInstruction, typeTransfert
    - Le format des fichiers doit respecter le champ indiqué (document + max 10 pièces jointes)
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Données de la transmission avec fichiers',
    schema: {
      type: 'object',
      required: ['idCourrier', 'idService', 'dateInstruction', 'typeTransfert'],
      properties: {
        idCourrier: {
          type: 'number',
          description: 'ID du courrier à traiter (obligatoire)',
          example: 1,
        },
        idService: {
          type: 'number',
          description: 'ID du service destinataire (obligatoire)',
          example: 2,
        },
        dateInstruction: {
          type: 'string',
          format: 'date-time',
          description: 'Date d\'instruction (obligatoire)',
          example: '2026-02-12T14:30:00.000Z',
        },
        typeTransfert: {
          type: 'string',
          description: 'Type de transfert (obligatoire)',
          example: 'Pour traitement',
        },
        instruction: {
          type: 'string',
          description: 'Instruction ou commentaire',
          example: 'Veuillez traiter ce dossier en urgence',
        },
        idEmetteur: {
          type: 'number',
          description: 'ID de l\'émetteur (par défaut l\'utilisateur connecté)',
          example: 3,
        },
        structuresCopie: {
          type: 'string',
          description: 'IDs des services en copie (JSON stringifié)',
          example: '[3,5,7]',
        },
        delaiTraitement: {
          type: 'number',
          description: 'Délai de traitement en jours',
          example: 7,
        },
        nombrePieceJointe: {
          type: 'number',
          description: 'Nombre de pièces jointes (par défaut 0)',
          example: 2,
          default: 0,
        },
        piecesJointesData: {
          type: 'string',
          description: 'JSON stringifié contenant les intitulés des pièces jointes',
          example: '[{"intitule":"Document justificatif"},{"intitule":"Annexe technique"}]',
        },
        sendNotification: {
          type: 'boolean',
          description: 'Envoyer les notifications (email et SMS) pour cette transmission',
          example: false,
          default: false,
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document principal de la transmission',
        },
        piecesJointes: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Fichiers des pièces jointes (max 10)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Transmission créée avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Transmission créée avec succès. 2 pièce(s) jointe(s) ajoutée(s).',
        title: 'Création transmission',
        data: {
          id: 1,
          idCourrier: 1,
          idService: 2,
          idEmetteur: 3,
          dateInstruction: '2026-02-12T14:30:00.000Z',
          typeTransfert: 'Pour traitement',
          instruction: 'Veuillez traiter ce dossier en urgence',
          structuresCopie: [3, 5, 7],
          delaiTraitement: 7,
          statut: 'En attente',
          nombrePieceJointe: 2,
          createdAt: '2026-02-12T14:35:00.000Z',
          updatedAt: '2026-02-12T14:35:00.000Z',
          piecesJointes: [
            {
              id: 1,
              nom: 'document.pdf',
              intitule: 'Document justificatif',
              chemin: 'transmissions/1707745200000-document.pdf',
              type: 'application/pdf',
              idTransmission: 1,
              createdAt: '2026-02-12T14:35:00.000Z',
            },
            {
              id: 2,
              nom: 'annexe.docx',
              intitule: 'Annexe technique',
              chemin: 'transmissions/1707745200001-annexe.docx',
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              idTransmission: 1,
              createdAt: '2026-02-12T14:35:00.000Z',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides.',
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier, service ou émetteur introuvable.',
  })
  async create(
    @CurrentUser() user: any,
    @Body() createTraitementDto: CreateTraitementDto,
    @UploadedFiles()
    files?: {
      document?: Express.Multer.File[];
      piecesJointes?: Express.Multer.File[];
    },
  ) {
    const document = files?.document?.[0];
    const piecesJointes = files?.piecesJointes || [];

    return this.traitementService.create(
      user.id,
      createTraitementDto,
      document,
      piecesJointes,
    );
  }

  // 📧🔔 Notifier le service d'une transmission
  @Post(':id/notify')
  @ApiOperation({
    summary: 'Notifier par mail et SMS le service d’une transmission',
    description: 'Envoie des notifications aux utilisateurs du service destinataire de la transmission.',
  })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({
    status: 200,
    description: 'Notifications envoyées avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Notification transmission',
        message: 'Notifications envoyées avec succès.',
        data: {
          transmissionId: 12,
          serviceId: 4,
          emailsCount: 2,
          smsCount: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Transmission ou service introuvable.' })
  @ApiResponse({ status: 400, description: 'Service destinataire manquant.' })
  notifyTransmissionService(@Param('id', ParseIntPipe) id: number) {
    return this.traitementService.notifyTransmissionService(id);
  }

  // ✏️ Mettre à jour une transmission
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document', maxCount: 1 },
      { name: 'piecesJointes', maxCount: 10 },
    ]),
  )
  @ApiOperation({
    summary: 'Mettre à jour une transmission',
    description: `Met à jour une transmission via PATCH.

    **Règles de validation** :
    - L'idService final doit être différent du service de l'utilisateur connecté
    - La transmission ne doit pas être reçue, archivée, gelée, instanciée ou supprimée
    - Le service destinataire doit exister
    - Le service destinataire doit avoir le type Poste
    - Le courrier doit exister si idCourrier est fourni
    - L'émetteur doit exister si idEmetteur est fourni
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Données de la transmission avec fichiers (tous les champs sont optionnels)',
    schema: {
      type: 'object',
      properties: {
        idCourrier: {
          type: 'number',
          description: 'ID du courrier à traiter',
          example: 1,
        },
        idService: {
          type: 'number',
          description: 'ID du service destinataire',
          example: 2,
        },
        dateInstruction: {
          type: 'string',
          format: 'date-time',
          description: 'Date d\'instruction',
          example: '2026-02-12T14:30:00.000Z',
        },
        typeTransfert: {
          type: 'string',
          description: 'Type de transfert',
          example: 'Pour traitement',
        },
        instruction: {
          type: 'string',
          description: 'Instruction ou commentaire',
          example: 'Veuillez traiter ce dossier en urgence',
        },
        idEmetteur: {
          type: 'number',
          description: 'ID de l\'émetteur',
          example: 3,
        },
        structuresCopie: {
          type: 'string',
          description: 'IDs des services en copie (JSON stringifié)',
          example: '[3,5,7]',
        },
        delaiTraitement: {
          type: 'number',
          description: 'Délai de traitement en jours',
          example: 7,
        },
        nombrePieceJointe: {
          type: 'number',
          description: 'Nombre de pièces jointes',
          example: 2,
        },
        piecesJointesData: {
          type: 'string',
          description: 'JSON stringifié contenant les intitulés des pièces jointes',
          example: '[{"intitule":"Document justificatif"},{"intitule":"Annexe technique"}]',
        },
        sendNotification: {
          type: 'boolean',
          description: 'Envoyer les notifications (email et SMS) pour cette transmission',
          example: false,
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Nouveau document principal de la transmission',
        },
        piecesJointes: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Nouvelles pièces jointes (ajout)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Transmission mise à jour avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou règles métier non respectées.',
  })
  @ApiResponse({
    status: 404,
    description: 'Transmission, service, courrier ou émetteur introuvable.',
  })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTraitementDto: UpdateTraitementDto,
    @UploadedFiles()
    files?: {
      document?: Express.Multer.File[];
      piecesJointes?: Express.Multer.File[];
    },
  ) {
    const document = files?.document?.[0];
    const piecesJointes = files?.piecesJointes || [];

    return this.traitementService.update(user.id, id, updateTraitementDto, document, piecesJointes);
  }

  // 📋 Liste des transmissions du service de l'utilisateur connecté
  @Get('service')
  @ApiOperation({
    summary: 'Lister les transmissions du service connecté',
    description: `Retourne les transmissions destinées au service de l'utilisateur connecté.

    **Règles** :
    - Un utilisateur ne voit que les transmissions de son service
    - Toutes les transmissions du service sont retournées
    - Chaque transmission contient le bloc courrier avec categorie
    - Chaque transmission contient dernierStatutService (statut + service de la dernière transmission du courrier)
    - canCreateTransmission = true si la dernière transmission du courrier n'est pas de l'utilisateur connecté
    - canModifyTransmission = true si la dernière transmission du courrier est de l'utilisateur connecté et non accusée réception

    **Filtres disponibles (query params)** :
    - search
    - dateArriveeDebut, dateArriveeFin
    - dateEnregistrementDebut, dateEnregistrementFin
    - priorite, categorie, categorieId
    - typeCourrierId
    - statut, dernierStatut
    - serviceId, dernierServiceId
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Transmissions récupérées avec succès.',
    schema: {
      example: {
        success: true,
        message: '3 transmission(s) récupérée(s) avec succès.',
        title: 'Liste des transmissions',
        data: {
          items: [
            {
              id: 120,
              courrier: {
                id: 45,
                numero: '2026-0012',
                reference: 'REF-2026-0012',
                objet: 'Demande d\'information',
                commentaire: null,
                commentairePublic: null,
                commentaireInterne: null,
                classeCourrier: 'Finances',
                categorie: 'Interne',
                dateArrivee: '2026-02-10',
                dateEnregistrement: '2026-02-10 10:15:00',
                priorite: 'Normal',
                statut: 'Transmis',
                isConfidentiel: false,
                typeCourrier: { id: 3, nom: 'Note' },
                provenance: { id: 2, nom: 'Client A', email: null, telephone: null },
                reponses: [],
              },
              serviceDestinataire: { id: 5, nom: 'Finance', sigle: 'FIN' },
              emetteur: {
                id: 7,
                fullName: 'Jean Dupont',
                email: 'jean.dupont@kiama.cm',
                service: { id: 2, nom: 'DG', sigle: 'DG' },
              },
              structuresCopie: [3, 4],
              dateInstruction: '2026-02-12T09:30:00.000Z',
              dateReception: '2026-02-12T09:35:00.000Z',
              instruction: 'Merci de traiter rapidement',
              commentairePublic: 'Commentaire visible par tous',
              commentaireInterne: 'Note interne confidentielle',
              delaiTraitement: 5,
              typeTransfert: 'Pour traitement',
              accuseReception: false,
              statut: 'Transmis',
              document: 'transmissions/doc-123.pdf',
              pieceJointe: null,
              isDelete: false,
              isArchive: false,
              isGeled: false,
              isinstance: false,
              statutArchive: null,
              viderPar: null,
              dernierStatutService: {
                statut: 'Transmis',
                service: { id: 5, nom: 'Finance', sigle: 'FIN' },
              },
              canCreateTransmission: true,
              canModifyTransmission: false,
              lastMyTransmission: null,
              nombrePieceJointe: 1,
              traitePar: [
                {
                  userId: 218,
                  userName: 'Jean Dupont',
                  action: 'Accusé de réception',
                  date: '2026-02-12T10:15:00.000Z',
                },
              ],
              piecesJointes: [],
              createdAt: '2026-02-12T09:30:10.000Z',
              updatedAt: '2026-02-12T09:30:10.000Z',
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 3,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            nextPage: null,
            previousPage: null,
            startIndex: 0,
            endIndex: 2,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'L\'utilisateur n\'a pas de service associé.',
  })
  listForService(
    @CurrentUser() user: any,
    @Query() query: ListTransmissionsQueryDto,
  ) {
    return this.traitementService.listForService(user.id, query);
  }

  // 📋 Liste des transmissions en copie du service de l'utilisateur connecté
  @Get('service/copie')
  @ApiOperation({
    summary: 'Lister les transmissions en copie du service connecté',
    description: `Retourne les transmissions dont le service de l'utilisateur connecté est en copie.

    **Règles** :
    - Un utilisateur ne voit que les transmissions où son service est en copie
    - Toutes les transmissions en copie sont retournées
    - Chaque transmission contient le bloc courrier avec categorie
    - Chaque transmission contient dernierStatutService (statut + service de la dernière transmission du courrier)
    - canCreateTransmission = true si la dernière transmission du courrier n'est pas de l'utilisateur connecté
    - canModifyTransmission = true si la dernière transmission du courrier est de l'utilisateur connecté et non accusée réception

    **Filtres disponibles (query params)** :
    - search
    - dateArriveeDebut, dateArriveeFin
    - dateEnregistrementDebut, dateEnregistrementFin
    - priorite, categorie, categorieId
    - typeCourrierId
    - statut, dernierStatut
    - serviceId, dernierServiceId
    `,
  })
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
    description: 'Transmissions en copie récupérées avec succès.',
    schema: {
      example: {
        success: true,
        message: '12 transmission(s) récupérée(s) avec succès.',
        title: 'Liste des transmissions en copie',
        data: {
          items: [
            {
              id: 156,
              courrier: {
                id: 78,
                numero: '2026-0045',
                reference: 'REF-2026-0045',
                objet: 'Transmission en copie',
                commentaire: null,
                commentairePublic: null,
                commentaireInterne: null,
                classeCourrier: 'Administratif',
                categorie: 'Externe',
                dateArrivee: '2026-02-15',
                dateEnregistrement: '2026-02-15 14:20:00',
                priorite: 'Normal',
                statut: 'Transmis',
                isConfidentiel: false,
                typeCourrier: { id: 5, nom: 'Lettre' },
                provenance: { id: 12, nom: 'Partenaire B', email: null, telephone: null },
                reponses: [],
              },
              serviceDestinataire: { id: 3, nom: 'Service Principal', sigle: 'SP' },
              emetteur: {
                id: 9,
                fullName: 'Marie Martin',
                email: 'marie.martin@kiama.cm',
                service: { id: 2, nom: 'DG', sigle: 'DG' },
              },
              structuresCopie: [5, 8],
              dateInstruction: '2026-02-15T14:20:00.000Z',
              dateReception: '2026-02-15T14:25:00.000Z',
              instruction: 'Pour information',
              commentairePublic: 'Document transmis en copie',
              commentaireInterne: 'À conserver pour archives',
              delaiTraitement: null,
              typeTransfert: 'Pour information',
              accuseReception: false,
              statut: 'Transmis',
              document: null,
              pieceJointe: null,
              isDelete: false,
              isArchive: false,
              isGeled: false,
              isinstance: false,
              statutArchive: null,
              viderPar: null,
              dernierStatutService: {
                statut: 'Transmis',
                service: { id: 3, nom: 'Service Principal', sigle: 'SP' },
              },
              canCreateTransmission: true,
              canModifyTransmission: false,
              lastMyTransmission: null,
              nombrePieceJointe: 0,
              traitePar: [],
              piecesJointes: [],
              createdAt: '2026-02-15T14:20:10.000Z',
              updatedAt: '2026-02-15T14:20:10.000Z',
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 12,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'L\'utilisateur n\'a pas de service associé.',
  })
  listForServiceCopie(
    @CurrentUser() user: any,
    @Query() query: ListTransmissionsQueryDto,
  ) {
    return this.traitementService.listForServiceCopie(user.id, query);
  }

  // 📋 Liste des transmissions pour les services additionnels de l'utilisateur connecté
  @Get('service/additionnel')
  @ApiOperation({
    summary: 'Lister les transmissions des services additionnels',
    description: `Retourne les transmissions dont le service destinataire fait partie des services additionnels de l'utilisateur connecté.

    **Règles** :
    - Un utilisateur ne voit que les transmissions des services additionnels qui lui sont assignés
    - Toutes les transmissions correspondantes sont retournées
    - Chaque transmission contient le bloc courrier avec categorie
    - Chaque transmission contient dernierStatutService (statut + service de la dernière transmission du courrier)
    - canCreateTransmission = true si la dernière transmission du courrier n'est pas de l'utilisateur connecté
    - canModifyTransmission = true si la dernière transmission du courrier est de l'utilisateur connecté et non accusée réception

    **Champ traitePar** :
    - Tableau JSON contenant l'historique de toutes les actions effectuées sur la transmission
    - Chaque action inclut : userId, userName, action, date
    - Actions possibles : "Classé", "Déclassé", "Instancié", "Désinstancié", "Accusé de réception"
    - Permet de tracer qui a traité la transmission, particulièrement utile pour les services additionnels

    **Filtres disponibles (query params)** :
    - search
    - dateArriveeDebut, dateArriveeFin
    - dateEnregistrementDebut, dateEnregistrementFin
    - priorite, categorie, categorieId
    - typeCourrierId
    - statut, dernierStatut
    - serviceId, dernierServiceId
    `,
  })
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
    description: 'Transmissions des services additionnels récupérées avec succès.',
    schema: {
      example: {
        success: true,
        message: '25 transmission(s) récupérée(s) avec succès.',
        title: 'Liste des transmissions',
        data: {
          items: [
            {
              id: 246,
              courrier: {
                id: 132,
                numero: '2025-12-010',
                reference: '2025-12-010',
                objet: 'Demande d\'assistance',
                commentaire: 'Urgent',
                commentairePublic: null,
                commentaireInterne: null,
                classeCourrier: 'Dossier RH',
                categorie: 'Normal',
                dateArrivee: '2025-12-15',
                dateEnregistrement: '2025-12-15 12:50:19',
                priorite: 'haute',
                statut: 'Reçu',
                isConfidentiel: false,
                typeCourrier: { id: 436, nom: 'Assistance Médicale' },
                provenance: { id: 60, nom: 'Association Sportive', email: 'contact@asso.com', telephone: '+237612345678' },
                reponses: [],
              },
              serviceDestinataire: { id: 446, nom: 'Secrétaire Général', sigle: 'SG' },
              emetteur: {
                id: 217,
                fullName: 'Pierre Durand',
                email: 'pierre@example.com',
                service: { id: 452, nom: 'Cabinet Ministre', sigle: 'CAB' },
              },
              structuresCopie: [3, 5, 7],
              dateInstruction: '2025-12-15T12:50:19.000Z',
              dateReception: '2025-12-15T13:00:00.000Z',
              instruction: 'Veuillez traiter en priorité',
              commentairePublic: 'Document à traiter rapidement',
              commentaireInterne: 'Demande du ministre',
              delaiTraitement: 7,
              typeTransfert: 'Pour_Instruction',
              accuseReception: true,
              statut: 'Reçu',
              document: null,
              pieceJointe: null,
              isDelete: false,
              isArchive: false,
              isGeled: false,
              isinstance: true,
              statutArchive: null,
              viderPar: null,
              dernierStatutService: {
                statut: 'Reçu',
                service: { id: 446, nom: 'Secrétaire Général', sigle: 'SG' },
              },
              canCreateTransmission: false,
              canModifyTransmission: true,
              lastMyTransmission: {
                id: 246,
                service: { id: 446, nom: 'Secrétaire Général', sigle: 'SG' },
                emetteur: {
                  id: 217,
                  fullName: 'Pierre Durand',
                  email: 'pierre@example.com',
                  service: { id: 452, nom: 'Cabinet Ministre', sigle: 'CAB' },
                },
                accuseReception: true,
                canModify: true,
              },
              instanceof: false,
              nombrePieceJointe: 2,
              traitePar: [
                {
                  userId: 218,
                  userName: 'Jean Dupont',
                  action: 'Accusé de réception',
                  date: '2025-12-15T15:35:53.000Z',
                },
                {
                  userId: 220,
                  userName: 'Marie Martin',
                  action: 'Classé',
                  date: '2025-12-16T10:11:13.000Z',
                },
              ],
              piecesJointes: [],
              createdAt: '2025-12-15T12:50:19.000Z',
              updatedAt: '2025-12-15T15:35:53.000Z',
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 25,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: false,
            nextPage: 2,
            previousPage: null,
            startIndex: 0,
            endIndex: 9,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'L\'utilisateur n\'a pas de service associé ou filtre non autorisé.',
  })
  listForAdditionalServices(
    @CurrentUser() user: any,
    @Query() query: ListTransmissionsQueryDto,
  ) {
    return this.traitementService.listForAdditionalServices(user.id, query);
  }

  // ⏰ Relance des transmissions en retard
  @Get('relance')
  @ApiOperation({
    summary: 'Lister les transmissions en retard',
    description: `Retourne les transmissions en retard selon dateInstruction + delaiTraitement.

    **Filtres** :
    - priorite
    - serviceId
    - search
    - retardJours
    `,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'priorite', required: false, type: String })
  @ApiQuery({ name: 'serviceId', required: false, type: Number })
  @ApiQuery({ name: 'retardJours', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Transmissions en retard récupérées avec succès.',
  })
  listRelance(
    @CurrentUser() user: any,
    @Query() query: RelanceQueryDto,
  ) {
    return this.traitementService.listRelance(user.id, query);
  }

  // 🔍 Détails d'une transmission
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une transmission par ID',
    description: 'Retourne les informations détaillées d\'une transmission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transmission récupérée avec succès.',
    schema: {
      example: {
        success: true,
        operation: 'Détails transmission',
        message: 'Transmission récupérée avec succès.',
        data: {
          id: 246,
          courrier: {
            id: 132,
            numero: '2025-12-010',
            reference: '2025-12-010',
            objet: 'reftest',
            commentaire: 'ras',
            commentairePublic: null,
            commentaireInterne: null,
            classeCourrier: 'Dossier Resource Humaine/Financière',
            dateArrivee: '2025-12-15',
            dateEnregistrement: '2025-12-15 12:50:19',
            typeCourrier: {
              id: 436,
              nom: 'Assistance Medical',
            },
            provenance: {
              id: 60,
              nom: 'Association Sportive et Culturelle Dominique SAMO',
              email: null,
              telephone: null,
            },
            priorite: 'basse',
            statut: 'Reçu',
            isConfidentiel: false,
          },
          serviceDestinataire: {
            id: 446,
            nom: 'Secrétaire Général',
            sigle: 'SG',
          },
          emetteur: {
            id: 217,
            username: 'manu transmis1',
            fullName: 'manu transmis1 manu transmis1',
            email: 'douanla507@gmail.com',
            service: {
              id: 452,
              nom: 'MINISTRE',
              sigle: 'Ministre',
            },
          },
          structuresCopie: null,
          dateInstruction: '2025-12-15 12:50:19',
          instruction: null,
          delaiTraitement: null,
          typeTransfert: 'Pour_Instruction',
          accuseReception: true,
          statut: 'Reçu',
          isinstance: false,
          nombrePieceJointe: 0,
          traitePar: [
            {
              action: 'accuse_reception',
              accuse_par_id: 218,
              date_traitement: '2025-12-15 15:35:53',
              accuse_par_id_fullname: 'manu transmis2 manu transmis2',
              accuse_par_id_service: {
                id: 452,
                nom: 'MINISTRE',
                sigle: 'Ministre',
              },
            },
            {
              action: 'gele',
              classe_par_id: 218,
              date_traitement: '2025-12-16 10:11:13',
              classe_par_id_fullname: 'manu transmis2 manu transmis2',
              classe_par_id_service: {
                id: 452,
                nom: 'MINISTRE',
                sigle: 'Ministre',
              },
            },
          ],
          piecesJointes: [
            {
              id: 250,
              nom: 'bordereau.pdf',
              intitule: 'Bordereau de transmission',
              chemin: '/uploads/courrier/pieces/6942c641c1399.pdf',
              type: 'application/pdf',
            },
          ],
          createdAt: '2025-12-15 12:50:22',
          updatedAt: '2025-12-16 10:11:58',
          reponses: [
            {
              id: 5,
              objet: 'RE: Demande de budget',
              commentairePublic: 'Voici notre réponse',
              commentaireInterne: 'Réponse à traiter en priorité',
              classeCourrier: 'Urgent',
              typeTransmission: 'Electronique',
              dateReponse: '2025-12-03 14:30:00',
              typeReponse: null,
              serviceDestinataire: {
                id: 3,
                nom: 'Service Financier',
                sigle: 'SF',
              },
              redacteur: {
                id: 12,
                fullName: 'Jean Dupont',
                email: 'jean.dupont@minepia.cm',
              },
              courrierIds: [1, 2],
              typesCourrierIds: [1, 3],
              createdAt: '2025-12-03 14:25:00',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transmission non trouvée.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.traitementService.findOne(id);
  }

  // 🗑️ Suppression logique d'une transmission
  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer logiquement une transmission',
    description: `Supprime logiquement une transmission (isDelete=true).

    **Règle** :
    - La transmission doit avoir accuseReception=false
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Transmission supprimée logiquement avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer une transmission accusée réception.',
  })
  @ApiResponse({
    status: 404,
    description: 'Transmission non trouvée.',
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.traitementService.delete(id);
  }

  // ❌ Suppression définitive d'une transmission
  @Delete(':id/definitive')
  @ApiOperation({
    summary: 'Supprimer définitivement une transmission',
    description: `Supprime définitivement une transmission (suppression physique).

    **Règle** :
    - La transmission doit avoir accuseReception=false
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Transmission supprimée définitivement avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer une transmission accusée réception.',
  })
  @ApiResponse({
    status: 404,
    description: 'Transmission non trouvée.',
  })
  deletePermanent(@Param('id', ParseIntPipe) id: number) {
    return this.traitementService.deletePermanent(id);
  }

  // 📁 Classer une transmission
  @Patch(':id/classer')
  @ApiOperation({
    summary: 'Classer une transmission',
    description: `Classe une transmission et le courrier lié automatiquement.
    
    **Modifications automatiques sur la transmission** :
    - statut : "Classé"
    - isGeled : true (gel de la transmission)
    - commentairePublic : Peut être mis à jour via le body
    - commentaireInterne : Peut être mis à jour via le body
    - traitePar : Ajoute l'utilisateur connecté dans l'historique avec { userId, userName, action: "Classé", date }
    - updatedAt : Date actuelle (mise à jour automatique)
    
    **Modifications automatiques sur le courrier lié** :
    - statut : "Classé"
    - isGeled : true (gel du courrier)
    
    **Traçabilité** : Le champ traitePar enregistre automatiquement l'utilisateur qui effectue l'action,
    particulièrement utile lorsqu'un utilisateur traite une transmission de son service additionnel.
    
    **Note** : Classer une transmission la gèle (isGeled=true), ce n'est pas la même chose qu'archiver (isArchive).
    Une transmission déjà gelée (classée) ne peut pas être re-classée.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Transmission classée avec succès.',
    schema: {
      example: {
        success: true,
        operation: 'Classement transmission',
        message: 'Transmission classée avec succès. Le courrier 2026-02-001 a également été classé.',
        data: {
          id: 1,
          statut: 'Classé',
          isGeled: true,
          updatedAt: '2026-02-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transmission ou courrier lié non trouvé.',
  })
  @ApiResponse({
    status: 400,
    description: 'Transmission déjà classée (gelée).',
  })
  classerTransmission(
    @Param('id', ParseIntPipe) id: number,
    @Body() classerDto: ClasserTransmissionDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.traitementService.classerTransmission(id, classerDto, userId);
  }

  // 📂 Déclasser une transmission
  @Patch(':id/declasser')
  @ApiOperation({
    summary: 'Déclasser une transmission',
    description: `Déclasse une transmission et le courrier lié automatiquement.
    
    **Modifications automatiques sur la transmission** :
    - isGeled : false (dégel de la transmission)
    - traitePar : Ajoute l'utilisateur connecté dans l'historique avec { userId, userName, action: "Déclassé", date }
    - updatedAt : Date actuelle (mise à jour automatique)
    - statut : Déterminé selon les propriétés de la transmission
    
    **Règles de détermination du statut de la transmission** :
    - Si isArchive=true → statut = "Archivé"
    - Sinon si isinstance=true → statut = "Instancié"
    - Sinon si accuseReception=true → statut = "Reçu"
    - Par défaut → statut = "Transmis"
    
    **Modifications automatiques sur le courrier lié** :
    - Déclassement automatique du courrier (appel de l'API de déclassement courrier)
    - Le statut du courrier sera déterminé par la dernière transmission
    
    **Traçabilité** : Le champ traitePar enregistre automatiquement l'utilisateur qui effectue l'action,
    particulièrement utile lorsqu'un utilisateur traite une transmission de son service additionnel.
    
    **Note** : Une transmission non gelée (non classée) ne peut pas être déclassée.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Transmission déclassée avec succès.',
    schema: {
      example: {
        success: true,
        operation: 'Déclassement transmission',
        message: 'Transmission déclassée avec succès. Nouveau statut: Reçu. Le courrier 2026-02-001 a également été déclassé.',
        data: {
          id: 1,
          statut: 'Reçu',
          isArchive: false,
          updatedAt: '2026-02-15T10:35:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transmission ou courrier lié non trouvé.',
  })
  @ApiResponse({
    status: 400,
    description: 'Transmission non classée (non gelée). Impossible de déclasser.',
  })
  declasserTransmission(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.traitementService.declasserTransmission(id, userId);
  }

  // 📌 Instancier une transmission
  @Patch(':id/instancier')
  @ApiOperation({
    summary: 'Instancier une transmission',
    description: `Instancie une transmission.
    
    **Modifications automatiques** :
    - isinstance : true
    - statut : "Instancié"
    - traitePar : Ajoute l'utilisateur connecté dans l'historique avec { userId, userName, action: "Instancié", date }
    - updatedAt : Date actuelle (mise à jour automatique)
    
    **Traçabilité** : Le champ traitePar enregistre automatiquement l'utilisateur qui effectue l'action,
    particulièrement utile lorsqu'un utilisateur traite une transmission de son service additionnel.
    
    Une transmission déjà instanciée ne peut pas être re-instanciée.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Transmission instanciée avec succès.',
    schema: {
      example: {
        success: true,
        operation: 'Instanciation transmission',
        message: 'Transmission instanciée avec succès.',
        data: {
          id: 1,
          statut: 'Instancié',
          isinstance: true,
          updatedAt: '2026-02-15T10:40:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transmission non trouvée.',
  })
  @ApiResponse({
    status: 400,
    description: 'Transmission déjà instanciée.',
  })
  instancierTransmission(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.traitementService.instancierTransmission(id, userId);
  }

  // 📍 Désinstancier une transmission
  @Patch(':id/desinstancier')
  @ApiOperation({
    summary: 'Désinstancier une transmission',
    description: `Désinstancie une transmission.
    
    **Modifications automatiques** :
    - isinstance : false
    - traitePar : Ajoute l'utilisateur connecté dans l'historique avec { userId, userName, action: "Désinstancié", date }
    - updatedAt : Date actuelle (mise à jour automatique)
    - statut : Déterminé selon les propriétés de la transmission
    
    **Règles de détermination du statut** :
    - Si isArchive=true → statut = "Archivé"
    - Sinon si isinstance=true → statut = "Instancié"
    - Sinon si accuseReception=true → statut = "Reçu"
    - Par défaut → statut = "Transmis"
    
    **Traçabilité** : Le champ traitePar enregistre automatiquement l'utilisateur qui effectue l'action,
    particulièrement utile lorsqu'un utilisateur traite une transmission de son service additionnel.
    
    Une transmission non instanciée ne peut pas être désinstanciée.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Transmission désinstanciée avec succès.',
    schema: {
      example: {
        success: true,
        operation: 'Désinstanciation transmission',
        message: 'Transmission désinstanciée avec succès. Nouveau statut: Transmis.',
        data: {
          id: 1,
          statut: 'Transmis',
          isinstance: false,
          updatedAt: '2026-02-15T10:45:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transmission non trouvée.',
  })
  @ApiResponse({
    status: 400,
    description: 'Transmission non instanciée. Impossible de désinstancier.',
  })
  desinstancierTransmission(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.traitementService.desinstancierTransmission(id, userId);
  }

  // ✉️ Accuser réception de plusieurs transmissions
  @Post('accuser-reception')
  @ApiOperation({
    summary: 'Accuser réception de plusieurs transmissions',
    description: `Accuse réception de plusieurs transmissions en une seule opération.
    
    **Vérifications préalables** :
    - Toutes les transmissions doivent exister
    - Toutes les transmissions doivent avoir le même idService (même destinataire)
    
    **Modifications automatiques sur les transmissions** :
    - accuseReception : true
    - statut : "Reçu"
    - traitePar : Ajoute l'utilisateur connecté dans l'historique avec { userId, userName, action: "Accusé de réception", date }
    - updatedAt : Date actuelle (mise à jour automatique)
    
    **Modifications automatiques sur les courriers liés** :
    - statut : "Reçu"
    
    **Traçabilité** : Le champ traitePar enregistre automatiquement l'utilisateur qui effectue l'action,
    particulièrement utile lorsqu'un utilisateur traite une transmission de son service additionnel.
    
    Si les transmissions n'ont pas le même destinataire, l'opération sera rejetée.`,
  })
  @ApiResponse({
    status: 201,
    description: 'Accusés de réception traités avec succès.',
    schema: {
      example: {
        success: true,
        operation: 'Accusé de réception',
        message: '3 transmission(s) accusée(s) réception avec succès. 2 courrier(s) mis à jour.',
        data: {
          transmissionsTraitees: 3,
          courriersTraites: 2,
          idService: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Une ou plusieurs transmissions non trouvées.',
  })
  @ApiResponse({
    status: 400,
    description: 'Les transmissions sélectionnées n\'ont pas le même destinataire.',
  })
  accuserReceptionTransmissions(
    @Body() accuserReceptionDto: AccuserReceptionTransmissionsDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.traitementService.accuserReceptionTransmissions(accuserReceptionDto, userId);
  }
}
