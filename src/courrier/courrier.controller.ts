// src/courrier/courrier.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Patch,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { CourrierService } from './courrier.service';
import { CreateCourrierDto } from './dto/create-courrier.dto';
import { UpdateCourrierDto } from './dto/update-courrier.dto';
import { CloseCourrierDto } from './dto/close-courrier.dto';
import { ListCourrierQueryDto } from './dto/list-courrier-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Courrier Arrivée')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courrier')
export class CourrierController {
  constructor(private readonly courrierService: CourrierService) {}

  // 📋 Liste des courriers
  @Get()
  @ApiOperation({
    summary: 'Lister les courriers arrivés avec informations complètes',
    description: `Retourne la liste paginée des courriers arrivés avec toutes les informations détaillées et relations.
    
    **Champs principaux retournés** :
    - **categorie** : Catégorie du courrier (Urgent, Normal, Confidentiel)
    - **classeCourrier** : Classification du courrier
    - **dateArrivee** : Date de réception du courrier
    - **dateEnregistrement** : Date d'enregistrement dans le système
    - **typeCourrier** : Objet complet avec id, libelle et code du type
    
    **Informations complètes** :
    - Données du courrier : reference, objet, priorite, statut, contenu, nombre de pages
    - Expéditeur : nom, telephone, email, civilite, ville, pays
    - Classification : categorie, classeCourrier, dateArrivee, dateEnregistrement
    - Fichiers : cheminDocument, nomDocument, typeMime
    
    **Relations détaillées** :
    - **service_traitement** : Service assigné avec hiérarchie complète (parent, grand_parent, arriere_grand_parent)
    - **provenance** : Type de courrier avec catégories liées
    - **createur** : Utilisateur créateur avec son service
    - **transmissions[]** : Liste des transmissions avec service, emetteur, contenu et dates
    - **courrierDeparts[]** : Courriers de départ liés avec destinataire et signataire
    - **piecesJointes[]** : Pièces jointes avec intitulé, chemin, taille
    - **reponses[]** : Réponses avec services émetteur/destinataire et contenu
    
    **Compteurs statistiques** :
    - totalTransmissions, totalCourrierDeparts, totalPiecesJointes, totalReponses
    
    **Dernière transmission** : Dernier statut avec service, émetteur, date et contenu`,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de la page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche dans reference, objet, nom expéditeur' })
  @ApiQuery({ name: 'dateArriveeDebut', required: false, type: String, description: 'Date de début (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateArriveeFin', required: false, type: String, description: 'Date de fin (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateEnregistrement', required: false, type: String, description: 'Date d\'enregistrement (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'priorite', required: false, type: String, description: 'Filtrer par priorité' })
  @ApiQuery({ name: 'categorie', required: false, type: String, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'categorieId', required: false, type: Number, description: 'ID de la catégorie' })
  @ApiQuery({ name: 'typeCourrierId', required: false, type: Number, description: 'ID du type de courrier' })
  @ApiQuery({ name: 'statut', required: false, type: String, description: 'Statut du courrier' })
  @ApiQuery({ name: 'dernierStatut', required: false, type: String, description: 'Dernier statut de transmission' })
  @ApiQuery({ name: 'serviceId', required: false, type: Number, description: 'ID du service assigné' })
  @ApiQuery({ name: 'dernierServiceId', required: false, type: Number, description: 'ID du service de la dernière transmission' })
  @ApiResponse({
    status: 200,
    description: 'Liste des courriers récupérée avec succès avec informations complètes.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Courriers récupérés avec succès.' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              // Champs prioritaires
              categorie: { type: 'string', example: 'Normal' },
              classeCourrier: { type: 'string', nullable: true },
              dateArrivee: { type: 'string', format: 'date-time' },
              dateEnregistrement: { type: 'string', format: 'date-time' },
              typeCourrier: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  libelle: { type: 'string' },
                  code: { type: 'string' },
                },
              },
              // Informations courrier
              id: { type: 'number' },
              reference: { type: 'string' },
              objet: { type: 'string' },
              priorite: { type: 'string' },
              statut: { type: 'string' },
              // Relations complètes
              service_traitement: { type: 'object', description: 'Service avec hiérarchie complète' },
              provenance: { type: 'object', description: 'Type courrier avec catégories' },
              createur: { type: 'object', description: 'Utilisateur créateur avec service' },
              transmissions: { type: 'array', description: 'Liste des transmissions' },
              courrierDeparts: { type: 'array', description: 'Courriers de départ liés' },
              piecesJointes: { type: 'array', description: 'Pièces jointes' },
              reponses: { type: 'array', description: 'Réponses au courrier' },
              // Compteurs
              totalTransmissions: { type: 'number' },
              totalCourrierDeparts: { type: 'number' },
              totalPiecesJointes: { type: 'number' },
              totalReponses: { type: 'number' },
              // Dernière transmission
              derniereTransmission: { type: 'object', nullable: true },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  list(@Query() query: ListCourrierQueryDto) {
    return this.courrierService.list(query);
  }

  // 📝 Créer un courrier
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document', maxCount: 1 },
      { name: 'piecesJointes', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Créer un nouveau courrier arrivée',
    description: `Crée un nouveau courrier avec upload du document principal et des pièces jointes.
    
    **Génération automatique de la référence** : Si le champ 'reference' n'est pas renseigné, un numéro automatique est généré au format AAAA-MM-XXX (ex. 2026-02-012). Le compteur est réinitialisé chaque mois.
    
    **Champs obligatoires** : priorite, dateArrivee, categorie, idService.
    
    **Fichiers** :
    - document : Fichier principal du courrier (optionnel)
    - piecesJointes : Jusqu'à 10 pièces jointes (optionnel)
    
    **piecesJointesData** : JSON stringifié contenant les intitulés des pièces jointes, exemple :
    [{"intitule":"Justificatif de domicile"},{"intitule":"Pièce d\'identité"}]
    
    Les fichiers sont stockés dans le dossier public/courrier.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['priorite', 'dateArrivee', 'categorie', 'idService'],
      properties: {
        reference: {
          type: 'string',
          description: 'Référence du courrier (générée automatiquement si non renseignée)',
          example: '2026-02-001',
        },
        objet: {
          type: 'string',
          description: 'Objet du courrier',
          example: 'Demande de renseignements',
        },
        priorite: {
          type: 'string',
          description: 'Priorité du courrier (obligatoire)',
          example: 'Urgent',
        },
        dateArrivee: {
          type: 'string',
          description: 'Date d\'arrivée du courrier (obligatoire)',
          example: '2026-02-12T10:30:00.000Z',
        },
        categorie: {
          type: 'string',
          description: 'Catégorie du courrier (obligatoire)',
          example: 'Administratif',
        },
        civilite: {
          type: 'string',
          description: 'Civilité de l\'expéditeur',
          example: 'Monsieur',
        },
        telephone: {
          type: 'string',
          description: 'Téléphone de l\'expéditeur',
          example: '+237123456789',
        },
        email: {
          type: 'string',
          description: 'Email de l\'expéditeur',
          example: 'contact@example.com',
        },
        adresse: {
          type: 'string',
          description: 'Adresse de l\'expéditeur',
          example: '123 Rue de la Paix, Yaoundé',
        },
        idProvenance: {
          type: 'number',
          description: 'ID de la provenance (correspondant)',
          example: 1,
        },
        classeCourrier: {
          type: 'string',
          description: 'Classe du courrier',
          example: 'Normal',
        },
        idTypeCourrier: {
          type: 'number',
          description: 'ID du type de courrier',
          example: 1,
        },
        commentaire: {
          type: 'string',
          description: 'Commentaire sur le courrier',
          example: 'Document reçu en bon état',
        },
        idService: {
          type: 'number',
          description: 'ID du service destinataire (obligatoire)',
          example: 1,
        },
        typeTransfert: {
          type: 'string',
          description: 'Type de transfert',
          example: 'Direct',
        },
        isConfidentiel: {
          type: 'boolean',
          description: 'Le courrier est-il confidentiel ?',
          example: false,
        },
        nombrePieceJointe: {
          type: 'number',
          description: 'Nombre de pièces jointes (par défaut 1)',
          example: 3,
        },
        piecesJointesData: {
          type: 'string',
          description: 'JSON stringifié contenant les intitulés des pièces jointes',
          example: '[{"intitule":"Justificatif de domicile"},{"intitule":"Pièce d\'identité"}]',
        },
        sendNotification: {
          type: 'boolean',
          description: 'Envoyer les notifications (email et SMS) pour ce courrier',
          example: false,
          default: false,
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document principal du courrier',
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
    description: 'Courrier créé avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Courrier créé avec succès. Référence: 2026-02-012. 2 pièce(s) jointe(s) ajoutée(s).',
        title: 'Création courrier',
        data: {
          id: 1,
          numero: '2026-02-012',
          reference: '2026-02-012',
          objet: 'Demande de renseignements',
          priorite: 'Urgent',
          dateArrivee: '2026-02-12T10:30:00.000Z',
          categorie: 'Administratif',
          civilite: 'Monsieur',
          telephone: '+237123456789',
          email: 'contact@example.com',
          adresse: '123 Rue de la Paix',
          document: 'courrier/1707581124438-document.pdf',
          isConfidentiel: false,
          nombrePieceJointe: 2,
          statut: 'En attente',
          createdAt: '2026-02-12T10:30:00.000Z',
          updatedAt: '2026-02-12T10:30:00.000Z',
          piecesJointes: [
            {
              id: 1,
              nom: 'justificatif.pdf',
              intitule: 'Justificatif de domicile',
              chemin: 'courrier/1707581124439-0-justificatif.pdf',
              type: 'application/pdf',
              idCourrier: 1,
              createdAt: '2026-02-12T10:30:00.000Z',
            },
            {
              id: 2,
              nom: 'identite.pdf',
              intitule: 'Pièce d\'identité',
              chemin: 'courrier/1707581124440-1-identite.pdf',
              type: 'application/pdf',
              idCourrier: 1,
              createdAt: '2026-02-12T10:30:00.000Z',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou service/provenance introuvable.',
    schema: {
      example: {
        success: false,
        message: 'Le service avec l\'ID 1 n\'existe pas.',
        title: 'Erreur',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé - Token JWT manquant ou invalide.',
  })
  create(
    @CurrentUser() user: any,
    @Body() createCourrierDto: CreateCourrierDto,
    @UploadedFiles()
    files: {
      document?: Express.Multer.File[];
      piecesJointes?: Express.Multer.File[];
    },
  ) {
    const document = files?.document?.[0];
    const piecesJointes = files?.piecesJointes || [];

    return this.courrierService.create(user.id, createCourrierDto, document, piecesJointes);
  }

  // 📁 Classer un courrier
  @Patch(':id/classer')
  @ApiOperation({
    summary: 'Classer un courrier',
    description: `Classe un courrier en mettant à jour son statut et en le gelant.
    
    **Modifications automatiques** :
    - statut : "Classé"
    - isGeled : true
    - updatedAt : Date actuelle (mise à jour automatique)
    
    Un courrier déjà classé (gelé) ne peut pas être re-classé.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Courrier classé avec succès.',
    schema: {
      example: {
        success: true,
        operation: 'Classement courrier',
        message: 'Courrier 2026-02-001 classé avec succès.',
        data: {
          id: 1,
          numero: '2026-02-001',
          statut: 'Classé',
          isGeled: true,
          updatedAt: '2026-02-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier non trouvé.',
  })
  @ApiResponse({
    status: 400,
    description: 'Courrier déjà classé (gelé).',
  })
  classerCourrier(@Param('id', ParseIntPipe) id: number) {
    return this.courrierService.classerCourrier(id);
  }

  // 📂 Déclasser un courrier
  @Patch(':id/declasser')
  @ApiOperation({
    summary: 'Déclasser un courrier',
    description: `Déclasse un courrier en retirant le gel et en déterminant le nouveau statut.
    
    **Modifications automatiques** :
    - isGeled : false
    - updatedAt : Date actuelle (mise à jour automatique)
    - statut : Déterminé selon la dernière transmission du courrier
    
    **Règles de détermination du statut** :
    - Si la dernière transmission a isArchive=true → statut = "Archivé"
    - Sinon si isinstance=true → statut = "Instancié"
    - Sinon si accuseReception=true → statut = "Reçu"
    - Par défaut → statut = "Transmis"
    
    Un courrier non classé (non gelé) ne peut pas être déclassé.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Courrier déclassé avec succès.',
    schema: {
      example: {
        success: true,
        operation: 'Déclassement courrier',
        message: 'Courrier 2026-02-001 déclassé avec succès. Nouveau statut: Reçu.',
        data: {
          id: 1,
          numero: '2026-02-001',
          statut: 'Reçu',
          isGeled: false,
          updatedAt: '2026-02-15T10:35:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier non trouvé.',
  })
  @ApiResponse({
    status: 400,
    description: 'Courrier non classé (non gelé). Impossible de déclasser.',
  })
  declasserCourrier(@Param('id', ParseIntPipe) id: number) {
    return this.courrierService.declasserCourrier(id);
  }

  // 🔍 Détails d'un courrier
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer les détails complets d\'un courrier',
    description: `
Retourne toutes les informations détaillées d'un courrier incluant tous ses champs.

**Informations retournées** :
- Données de base : numero, reference, objet, commentaires
- Informations expéditeur : nom, civilite, matricule, telephone, email, adresse
- Classification : classeCourrier, categorie, priorite, statut
- États : isArchive, statutArchive, isGeled, isDelete, isConfidentiel
- Dates : dateArrivee, dateEnregistrement, createdAt, updatedAt
- Relations : provenance, service traitant, créateur
- Fichiers : document principal et pièces jointes
- Dernière transmission avec ses détails complets
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Courrier récupéré avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Détails courrier',
        message: 'Courrier récupéré avec succès.',
        data: {
          id: 1,
          numero: 'CRR-2025-0045',
          reference: 'CA-00045/2025',
          objet: 'Demande de subvention',
          commentaire: 'Lettre prioritaire',
          commentairePublic: 'Dossier traité et archivé',
          commentaireInterne: 'Nécessite un suivi ultérieur',
          priorite: 'Haute',
          statut: 'Transmis',
          nom: 'Jean Dupont',
          civilite: 'M.',
          matricule: 'EMP-00123',
          telephone: '+237 6XX XXX XXX',
          email: 'jean.dupont@example.com',
          adresse: '123 Rue de la Paix, Yaoundé',
          typeTransfert: 'Direct',
          classeCourrier: 'Urgent',
          categorie: 'Administrative',
          nombrePieceJointe: 3,
          dateArrivee: '2025-02-14T09:30:00+00:00',
          dateEnregistrement: '2025-02-14T09:35:00+00:00',
          idTypeCourrier: 1,
          isArchive: false,
          statutArchive: null,
          isGeled: false,
          isDelete: false,
          isConfidentiel: true,
          createdAt: '2025-02-14T09:30:00+00:00',
          updatedAt: '2025-02-14T09:35:00+00:00',
          idProvenance: { id: 5, nom: 'Correspondant externe' },
          idServiceTraitant: { id: 3, nom: 'Service Financier', sigle: 'FIN' },
          idCreateur: { id: 2, nomComplet: 'Jean Dupont' },
          document: '/uploads/courrier/document/CA-00045.pdf',
          piecesJointes: [
            {
              id: 1,
              nom: 'Annexe1.pdf',
              intitule: 'Justificatif de domicile',
              chemin: '/uploads/courrier/pieces/annexe1.pdf',
              type: 'application/pdf',
            },
          ],
          dernieretransmissions: [
            {
              id: 5,
              dateInstruction: '2025-02-14T09:40:00+00:00',
              instruction: 'À traiter en priorité.',
              typeTransfert: 'Direct',
              statut: 'En cours',
              accuseReception: true,
              idServiceDestinataire: { id: 3, nom: 'Service Financier', sigle: 'FIN' },
              idEmetteur: { id: 2, nomComplet: 'Jean Dupont' },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier non trouvé.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courrierService.findOne(id);
  }

  // 🧭 Traçabilité d'un courrier
  @Get(':id/timeline')
  @ApiOperation({
    summary: 'Traçabilité complète d\'un courrier',
    description: 'Retourne la timeline chronologique complète d\'un courrier.',
  })
  @ApiResponse({
    status: 200,
    description: 'Traçabilité récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Traçabilité courrier',
        message: 'Traçabilité récupérée avec succès.',
        data: {
          courrier: {
            id: 12,
            numero: '2025-09-001',
            objet: 'Demande d\'autorisation',
            reference: '2025-09-001',
            statut: 'Transmis',
            priorite: 'Haute',
            isConfidentiel: false,
            isGeled: false,
          },
          timeline: [
            {
              date: '2025-09-17T10:30:00.000Z',
              type: 'creation',
              details: {
                dateArrivee: '2025-09-17T10:30:00.000Z',
                dateEnregistrement: '2025-09-17T10:35:00.000Z',
                createur: {
                  nom_createur: 'Jean Dupont',
                  service_utilisateur: 'Secrétariat Général - SG',
                },
                service_traitant: 'Service du courrier entrant - SG',
                utilisateurs_service_traitant: [
                  { id: 3, nom_complet: 'Marie Martin', email: 'marie.martin@example.com' },
                ],
                provenance: { nom: 'MINEPIA', type: 'Institution' },
                categorie: 'Administrative',
                priorite: 'Haute',
                reference: '2025-09-001',
                isConfidentiel: false,
              },
            },
            {
              date: '2025-09-20T14:30:00.000Z',
              type: 'transmission',
              details: {
                id: 45,
                emetteur: {
                  nom_emetteur: 'Jean Dupont',
                  service_emetteur: 'Secrétariat Général - SG',
                },
                destinataire: {
                  nom_destinataire_chef: null,
                  service_destinataire: 'Cabinet du Ministre - CM',
                },
                utilisateurs_service_destinataire: [
                  { id: 7, nom_complet: 'Marie Martin', email: 'marie.martin@example.com' },
                ],
                instruction: 'Transmission pour signature',
                typeTransfert: 'Copie',
                delaiTraitement: 3,
                statut: 'Reçu',
                accuseReception: true,
                structuresCopie: [2, 5],
              },
            },
          ],
          statistiques: {
            nombreEvenements: 2,
            nombreTransmissions: 1,
            nombreReponses: 0,
            estCloture: false,
            estClasse: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier non trouvé.',
  })
  getTimeline(@Param('id', ParseIntPipe) id: number) {
    return this.courrierService.getTimeline(id);
  }

  // ✅ Clôturer un courrier
  @Patch(':id/cloturer')
  @UseInterceptors(FilesInterceptor('bordereauRemise', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Clôturer un courrier',
    description: 'Met à jour dateCloture, dateRemiseEffective, statut et enregistre le bordereau de remise.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['dateRemiseEffective'],
      properties: {
        dateRemiseEffective: { type: 'string', example: '2025-09-20T16:00:00.000Z' },
        bordereauRemise: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Courrier clôturé avec succès.',
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier non trouvé.',
  })
  cloturerCourrier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseCourrierDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.courrierService.closeCourrier(id, dto, files || []);
  }

  // ↩️ Déclôturer un courrier
  @Patch(':id/decloturer')
  @ApiOperation({
    summary: 'Déclôturer un courrier',
    description: 'Réinitialise dateCloture, dateRemiseEffective et bordereauRemise, puis recalcul le statut selon la dernière transmission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Courrier déclôturé avec succès.',
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier non trouvé.',
  })
  decloturerCourrier(@Param('id', ParseIntPipe) id: number) {
    return this.courrierService.decloturerCourrier(id);
  }

  // 🗑️ Suppression logique d'un courrier (et transmissions liées)
  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer logiquement un courrier',
    description: `Supprime logiquement un courrier et toutes ses transmissions associées.

    **Règles** :
    - Marque le courrier comme supprimé (isDelete = true)
    - Supprime logiquement les transmissions liées
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Courrier supprimé logiquement avec succès.',
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier non trouvé.',
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.courrierService.delete(id);
  }

  // ✏️ Mettre à jour un courrier + créer transmission
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document', maxCount: 1 },
      { name: 'piecesJointes', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Mettre à jour un courrier et créer une transmission',
    description: `Met à jour un courrier, ajoute les pièces jointes fournies, remplace le document si fourni,
    puis crée une transmission et envoie les notifications comme à la création.

    **Référence** : non modifiée sauf si le mois de la date d'arrivée change.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reference: { type: 'string', description: 'Référence (non modifiée sauf changement de mois)' },
        objet: { type: 'string' },
        priorite: { type: 'string' },
        dateArrivee: { type: 'string' },
        categorie: { type: 'string' },
        civilite: { type: 'string' },
        telephone: { type: 'string' },
        email: { type: 'string' },
        adresse: { type: 'string' },
        idProvenance: { type: 'number' },
        classeCourrier: { type: 'string' },
        idTypeCourrier: { type: 'number' },
        commentaire: { type: 'string' },
        idService: { type: 'number' },
        typeTransfert: { type: 'string' },
        isConfidentiel: { type: 'boolean' },
        nombrePieceJointe: { type: 'number' },
        piecesJointesData: { type: 'string' },
        sendNotification: { type: 'boolean' },
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
    description: 'Courrier mis à jour avec succès.',
  })
  updateWithTransmission(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourrierDto: UpdateCourrierDto,
    @UploadedFiles()
    files: {
      document?: Express.Multer.File[];
      piecesJointes?: Express.Multer.File[];
    },
  ) {
    const document = files?.document?.[0];
    const piecesJointes = files?.piecesJointes || [];

    return this.courrierService.updateWithTransmission(
      user.id,
      id,
      updateCourrierDto,
      document,
      piecesJointes,
    );
  }

  // ❌ Suppression définitive d'un courrier (et transmissions liées)
  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Supprimer définitivement un courrier',
    description: `Supprime définitivement un courrier et toutes ses transmissions associées.

    **Règles** :
    - Supprime les transmissions liées avant le courrier
    - Si une transmission ne peut pas être supprimée définitivement, l'opération échoue
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Courrier supprimé définitivement avec succès.',
  })
  @ApiResponse({
    status: 404,
    description: 'Courrier non trouvé.',
  })
  deletePermanent(@Param('id', ParseIntPipe) id: number) {
    return this.courrierService.deletePermanent(id);
  }
}
