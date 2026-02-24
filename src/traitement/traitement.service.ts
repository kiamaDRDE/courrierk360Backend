// src/traitement/traitement.service.ts

import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTraitementDto } from './dto/create-traitement.dto';
import { UpdateTraitementDto } from './dto/update-traitement.dto';
import { AccuserReceptionTransmissionsDto } from './dto/accuser-reception-transmissions.dto';
import { ClasserTransmissionDto } from './dto/classer-transmission.dto';
import { ListTransmissionsQueryDto } from './dto/list-transmissions-query.dto';
import { RelanceQueryDto } from './dto/relance-query.dto';
import { PaginationService } from '../common/pagination.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { MailerService } from '../mailer/mailer.service';
import { SmsService } from '../sms/sms.service';
import { CourrierService } from '../courrier/courrier.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TraitementService {
  private readonly logger = new Logger(TraitementService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly mailerService: MailerService,
    private readonly smsService: SmsService,
    private readonly paginationService: PaginationService,
    @Inject(forwardRef(() => CourrierService))
    private readonly courrierService: CourrierService,
  ) {}

  // 📧🔔 Notifier par mail et SMS le service d'une transmission
  async notifyTransmissionService(id: number) {
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, nom: true } },
        courrier: {
          select: {
            numero: true,
            reference: true,
            objet: true,
            civilite: true,
            nom: true,
            priorite: true,
            categorie: true,
            dateArrivee: true,
          },
        },
      },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    const serviceId = transmission.idService;
    if (!serviceId) {
      throw new BadRequestException('Le service destinataire de la transmission est manquant.');
    }

    const [serviceUsers, serviceInfo] = await Promise.all([
      this.prismaService.user.findMany({
        where: {
          idService: serviceId,
          isActive: true,
          isDelete: false,
        },
        select: {
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
        },
      }),
      this.prismaService.service.findUnique({
        where: { id: serviceId },
        select: { nom: true },
      }),
    ]);

    if (!serviceInfo) {
      throw new NotFoundException(`Le service avec l'ID ${serviceId} n'existe pas.`);
    }

    const courrierInfo = transmission.courrier;
    const dateArrivee = courrierInfo?.dateArrivee
      ? new Date(courrierInfo.dateArrivee).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';

    const emailPromises = serviceUsers
      .filter((user) => user.email)
      .map((user) =>
        this.mailerService.sendCourrierNotificationService(
          user.email as string,
          user.firstName || '',
          user.lastName || '',
          serviceInfo.nom || 'Service',
          {
            numero: courrierInfo?.numero || 'N/A',
            reference: courrierInfo?.reference || courrierInfo?.numero || 'N/A',
            objet: courrierInfo?.objet || transmission.instruction || 'Nouvelle transmission',
            civilite: courrierInfo?.civilite || '',
            nom: courrierInfo?.nom || 'Inconnu',
            priorite: courrierInfo?.priorite || 'Normal',
            categorie: courrierInfo?.categorie || 'Transmission',
            dateArrivee: dateArrivee || '',
            commentaire: transmission.instruction || '',
          },
        ).catch((error) => {
          console.error(`Erreur envoi email à ${user.email}:`, error);
          return false;
        }),
      );

    const emailsResult = await Promise.all(emailPromises);
    const emailsCount = emailsResult.filter((ok) => ok).length;

    const phoneNumbers = serviceUsers
      .filter((user) => user.phone)
      .map((user) => user.phone) as string[];

    // 📵 Pour création de transmission : ne pas envoyer de SMS, uniquement les emails.
    let smsCount = 0;
    if (phoneNumbers.length > 0) {
      console.log(`📵 SMS volontairement ignorés pour la création de la transmission ${transmission.id} (send via email uniquement). Utilisateurs avec téléphone: ${phoneNumbers.length}`);
    }

    return this.responseFormatter.success(
      {
        transmissionId: transmission.id,
        serviceId,
        emailsCount,
        smsCount,
      },
      'Notification transmission',
      'Notifications envoyées avec succès.',
    );
  }

  // 📝 Créer une transmission (traitement)
  async create(
    userId: number,
    createTraitementDto: CreateTraitementDto,
    document?: Express.Multer.File,
    piecesJointes?: Express.Multer.File[],
  ) {
    try {
      const {
        idCourrier,
        idService,
        dateInstruction,
        typeTransfert,
        instruction,
        idEmetteur,
        structuresCopie,
        delaiTraitement,
        nombrePieceJointe = 0,
        piecesJointesData,
        sendNotification = false,
      } = createTraitementDto;

      // Convertir sendNotification en boolean (robuste pour form-data)
      const shouldSendNotification = sendNotification === true;

      console.log('📧 Paramètre sendNotification (Traitement):', {
        original: sendNotification,
        type: typeof sendNotification,
        converted: shouldSendNotification,
      });

    // Utiliser l'émetteur renseigné ou l'utilisateur connecté
    const emetteurId = idEmetteur || userId;

    // Vérifier que le courrier existe
    const courrier = await this.prismaService.courrier.findUnique({
      where: { id: idCourrier },
    });

    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${idCourrier} n'existe pas.`);
    }

    // Vérifier que le service existe
    const service = await this.prismaService.service.findUnique({
      where: { id: idService },
    });

    if (!service) {
      throw new NotFoundException(`Le service avec l'ID ${idService} n'existe pas.`);
    }

    const serviceType = (service.type || '').toLowerCase();
    if (serviceType !== 'poste') {
      throw new BadRequestException('Impossible de créer une transmission vers un service. Le type doit être Poste.');
    }

    // Vérifier que l'émetteur existe
    const emetteur = await this.prismaService.user.findUnique({
      where: { id: emetteurId },
    });

    if (!emetteur) {
      throw new NotFoundException(`L'émetteur avec l'ID ${emetteurId} n'existe pas.`);
    }

    // Vérifier la dernière transmission du courrier
    const lastTransmission = await this.prismaService.transmission.findFirst({
      where: { idCourrier: idCourrier },
      orderBy: { createdAt: 'desc' },
      select: { idEmetteur: true },
    });

    if (lastTransmission?.idEmetteur === emetteurId) {
      throw new BadRequestException(
        'Vous avez déjà créé la dernière transmission pour ce courrier. Vous ne pouvez pas en créer une nouvelle.',
      );
    }

    // Vérifier que l'émetteur ne transmet pas à son propre service
    if (emetteur.idService === idService) {
      throw new BadRequestException('Vous ne pouvez pas créer une transmission vers votre propre service.');
    }

    // Parser structuresCopie si fourni
    const structuresCopieJson = this.parseStructuresCopie(structuresCopie);

    // Créer le dossier public/transmissions s'il n'existe pas
    const transmissionDir = path.join(process.cwd(), 'public', 'transmissions');
    if (!fs.existsSync(transmissionDir)) {
      fs.mkdirSync(transmissionDir, { recursive: true });
    }

    // Sauvegarder le document principal
    let documentPath: string | null = null;
    if (document) {
      const timestamp = Date.now();
      const documentFileName = `${timestamp}-${document.originalname}`;
      const documentFullPath = path.join(transmissionDir, documentFileName);
      fs.writeFileSync(documentFullPath, document.buffer);
      documentPath = `transmissions/${documentFileName}`;
    }

    // Parser les pièces jointes
    let piecesJointesMetadata: Array<{ intitule: string }> = [];
    if (piecesJointesData) {
      try {
        piecesJointesMetadata = JSON.parse(piecesJointesData);
      } catch (error) {
        throw new BadRequestException('Le format JSON de piecesJointesData est invalide.');
      }
    }

    // Créer la transmission et les pièces jointes en transaction
    const result = await this.prismaService.$transaction(async (prisma) => {
      // Créer la transmission
      const transmission = await prisma.transmission.create({
        data: {
          idCourrier: idCourrier,
          idService: idService,
          idEmetteur: emetteurId,
          dateInstruction: new Date(dateInstruction),
          typeTransfert: typeTransfert,
          instruction: instruction || null,
          document: documentPath || null,
          structuresCopie: structuresCopieJson,
          delaiTraitement: delaiTraitement || null,
          nombrePieceJointe: nombrePieceJointe,
          statut: 'Transmis',
        },
      });

      // Créer les pièces jointes
      const piecesJointesCreees: any[] = [];
      if (piecesJointes && piecesJointes.length > 0) {
        for (let i = 0; i < piecesJointes.length; i++) {
          const file = piecesJointes[i];
          const intituleData = piecesJointesMetadata[i] || { intitule: file.originalname };

          // Sauvegarder le fichier
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.originalname}`;
          const filePath = path.join(transmissionDir, fileName);
          fs.writeFileSync(filePath, file.buffer);

          // Créer l'enregistrement dans la table PieceJointe
          const pieceJointe = await prisma.pieceJointe.create({
            data: {
              nom: file.originalname,
              intitule: intituleData.intitule,
              chemin: `transmissions/${fileName}`,
              type: file.mimetype,
              idTransmission: transmission.id,
              idParent: transmission.id,
              typeParent: 'transmission',
            },
          });

          piecesJointesCreees.push(pieceJointe);
        }
      }

      return { transmission, piecesJointes: piecesJointesCreees };
    });

    // 🔔 Créer une notification en base pour les utilisateurs du service destinataire
    if (idService) {
      const serviceUsers = await this.prismaService.user.findMany({
        where: {
          idService: idService,
          isActive: true,
          isDelete: false,
        },
        select: { id: true },
      });

      if (serviceUsers.length > 0) {
        const notificationTitle = 'Nouveau courrier à traiter';
        const notificationMessage = `Un nouveau courrier (${courrier.numero}) a été transmis à votre service.`;
        const notificationData = {
          transmission_id: result.transmission.id,
          courrier_id: idCourrier,
          service_id: idService,
          type_transfert: typeTransfert,
          statut: result.transmission.statut,
        };

        await this.prismaService.notification.createMany({
          data: serviceUsers.map((user) => ({
            titre: notificationTitle,
            message: notificationMessage,
            type: 'transmission',
            data: notificationData as any,
            idUser: user.id,
            idService: null,
          })),
        });
      }
    }

    // 📧 Envoyer les notifications aux utilisateurs du service si shouldSendNotification = true
    if (shouldSendNotification && idService) {
      try {
        const [serviceUsers, serviceInfo, courrierInfo] = await Promise.all([
          this.prismaService.user.findMany({
            where: {
              idService: idService,
              isActive: true,
              isDelete: false,
            },
            select: {
              email: true,
              phone: true,
              firstName: true,
              lastName: true,
            },
          }),
          this.prismaService.service.findUnique({
            where: { id: idService },
            select: { nom: true },
          }),
          this.prismaService.courrier.findUnique({
            where: { id: idCourrier },
            select: { numero: true, objet: true, priorite: true },
          }),
        ]);

        const emailPromises = serviceUsers
          .filter((user) => user.email)
          .map(async (user) => {
            try {
              const ok = await this.mailerService.sendCourrierNotificationService(
                user.email as string,
                user.firstName || '',
                user.lastName || '',
                serviceInfo?.nom || 'Service',
                {
                  numero: courrierInfo?.numero || 'N/A',
                  reference: result.transmission.id.toString(),
                  objet: courrierInfo?.objet || instruction || 'Nouvelle transmission',
                  civilite: '',
                  nom: emetteur.username,
                  priorite: courrierInfo?.priorite || 'Normal',
                  categorie: 'Transmission',
                  dateArrivee: new Date(dateInstruction).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  }),
                  commentaire: instruction || '',
                },
              );
              if (!ok) {
                console.error(`Envoi email échoué pour ${user.email}`);
                return false;
              }
              return true;
            } catch (error) {
              console.error(`Erreur envoi email à ${user.email}:`, error);
              return false;
            }
          });

        const emailResults = await Promise.all(emailPromises);
        const sentCount = emailResults.filter((r) => r).length;
        this.logger && this.logger.log && this.logger.log(`Notifications envoyées par email: ${sentCount}/${emailResults.length}`);

        const phoneNumbers = serviceUsers
          .filter((user) => user.phone)
          .map((user) => user.phone) as string[];

        // ⚠️ Lors de la création d'une transmission, n'envoyer que des emails.
        if (phoneNumbers.length > 0) {
          console.log(`📵 SMS volontairement ignorés pour la création de la transmission ${result.transmission.id} (envoi email uniquement). Utilisateurs avec téléphone: ${phoneNumbers.length}`);
        }
      } catch (error) {
        console.error(`Erreur lors de l'envoi des notifications:`, error);
      }
    }

    // 📧 Notifications aux services en copie
    if (shouldSendNotification && structuresCopieJson && Array.isArray(structuresCopieJson)) {
      const copieServiceIds = [...new Set(structuresCopieJson)]
        .filter((id) => typeof id === 'number' && id !== idService);

      if (copieServiceIds.length > 0) {
        Promise.all([
          this.prismaService.user.findMany({
            where: {
              idService: { in: copieServiceIds },
              isActive: true,
              isDelete: false,
            },
            select: {
              email: true,
              firstName: true,
              lastName: true,
              idService: true,
            },
          }),
          this.prismaService.service.findMany({
            where: { id: { in: copieServiceIds } },
            select: { id: true, nom: true },
          }),
          this.prismaService.courrier.findUnique({
            where: { id: idCourrier },
            select: { numero: true, objet: true, priorite: true },
          }),
        ])
        .then(([copieUsers, copieServices, courrierInfo]) => {
          const serviceMap = new Map(copieServices.map((s) => [s.id, s.nom]));

          const emailPromises = copieUsers
            .filter(user => user.email)
            .map(user => 
              this.mailerService.sendCourrierNotificationCopieService(
                user.email,
                user.firstName || '',
                user.lastName || '',
                String(serviceMap.get(user.idService as number) ?? 'Service'),
                {
                  numero: courrierInfo?.numero || 'N/A',
                  reference: result.transmission.id.toString(),
                  objet: courrierInfo?.objet || instruction || 'Nouvelle transmission',
                  civilite: '',
                  nom: emetteur.username,
                  priorite: courrierInfo?.priorite || 'Normal',
                  categorie: 'Transmission',
                  dateArrivee: new Date(dateInstruction).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  }),
                  commentaire: instruction || '',
                },
              ).catch(error => {
                console.error(`Erreur envoi email copie à ${user.email}:`, error);
              })
            );

          return Promise.all(emailPromises);
        })
        .catch((error) => {
          console.error(`Erreur lors de l'envoi des notifications en copie:`, error);
        });
      }
    }

      return this.responseFormatter.success(
        {
          ...result.transmission,
          piecesJointes: result.piecesJointes,
        },
        'Création transmission',
        `Transmission créée avec succès. ${result.piecesJointes.length} pièce(s) jointe(s) ajoutée(s).`,
      );
    } catch (error) {
      console.error('❌ Erreur création transmission:', error?.message || error, error?.stack);
      throw error;
    }
  }

  // ✏️ Mettre à jour une transmission
  async update(
    userId: number,
    id: number,
    updateTraitementDto: UpdateTraitementDto,
    document?: Express.Multer.File,
    piecesJointes?: Express.Multer.File[],
  ) {
    try {
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    if (
      transmission.accuseReception === true ||
      transmission.isArchive === true ||
      transmission.isGeled === true ||
      transmission.isinstance === true ||
      transmission.isDelete === true
    ) {
      throw new BadRequestException(
        'Impossible de modifier cette transmission (réceptionnée, archivée, gelée, instanciée ou supprimée).',
      );
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} introuvable.`);
    }

    const idServiceFinal = updateTraitementDto.idService ?? transmission.idService;
    if (!idServiceFinal) {
      throw new BadRequestException('Le service destinataire est obligatoire.');
    }

    if (user.idService === idServiceFinal) {
      throw new BadRequestException('Vous ne pouvez pas transmettre vers votre propre service.');
    }

    const service = await this.prismaService.service.findUnique({
      where: { id: idServiceFinal },
    });

    if (!service) {
      throw new NotFoundException(`Le service avec l'ID ${idServiceFinal} n'existe pas.`);
    }

    const serviceType = (service.type || '').toLowerCase();
    if (serviceType !== 'poste') {
      throw new BadRequestException('Impossible de transmettre vers un service. Le type doit être Poste.');
    }

    if (updateTraitementDto.idCourrier) {
      const courrier = await this.prismaService.courrier.findUnique({
        where: { id: updateTraitementDto.idCourrier },
      });

      if (!courrier) {
        throw new NotFoundException(
          `Le courrier avec l'ID ${updateTraitementDto.idCourrier} n'existe pas.`,
        );
      }
    }

    const rawIdEmetteur = (updateTraitementDto as any).idEmetteur;
    let idEmetteurFinal: number | undefined = userId;
    if (rawIdEmetteur !== undefined && rawIdEmetteur !== null && String(rawIdEmetteur).trim() !== '') {
      const parsedIdEmetteur = Number(rawIdEmetteur);
      if (!Number.isInteger(parsedIdEmetteur) || parsedIdEmetteur <= 0) {
        throw new BadRequestException("L'ID de l'émetteur doit être un entier valide.");
      }
      idEmetteurFinal = parsedIdEmetteur;
    }

    if (idEmetteurFinal !== undefined) {
      const emetteur = await this.prismaService.user.findUnique({
        where: { id: idEmetteurFinal },
      });

      if (!emetteur) {
        throw new NotFoundException(
          `L'émetteur avec l'ID ${idEmetteurFinal} n'existe pas.`,
        );
      }

      if (emetteur.idService === idServiceFinal) {
        throw new BadRequestException('Vous ne pouvez pas transmettre vers votre propre service.');
      }
    }

    const structuresCopieJson = this.parseStructuresCopie(updateTraitementDto.structuresCopie);

    let dateInstructionParsed: Date | undefined = undefined;
    if (updateTraitementDto.dateInstruction !== undefined) {
      const trimmedDate = String(updateTraitementDto.dateInstruction).trim();
      if (trimmedDate !== '') {
        const parsedDate = new Date(trimmedDate);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new BadRequestException('La date d\'instruction est invalide.');
        }
        dateInstructionParsed = parsedDate;
      }
    }

    const transmissionDir = path.join(process.cwd(), 'public', 'transmissions');
    if (!fs.existsSync(transmissionDir)) {
      fs.mkdirSync(transmissionDir, { recursive: true });
    }

    let documentPath: string | undefined = undefined;
    if (document) {
      const timestamp = Date.now();
      const documentFileName = `${timestamp}-${document.originalname}`;
      const documentFullPath = path.join(transmissionDir, documentFileName);
      fs.writeFileSync(documentFullPath, document.buffer);
      documentPath = `transmissions/${documentFileName}`;
    }

    let piecesJointesMetadata: Array<{ intitule: string }> = [];
    if (updateTraitementDto.piecesJointesData) {
      try {
        piecesJointesMetadata = JSON.parse(updateTraitementDto.piecesJointesData);
      } catch (error) {
        throw new BadRequestException('Le format JSON de piecesJointesData est invalide.');
      }
    }

    const result = await this.prismaService.$transaction(async (prisma) => {
      const transmissionMiseAJour = await prisma.transmission.update({
        where: { id },
        data: {
          idCourrier: updateTraitementDto.idCourrier ?? undefined,
          idService: updateTraitementDto.idService ?? undefined,
          idEmetteur: idEmetteurFinal,
          dateInstruction: dateInstructionParsed,
          typeTransfert: updateTraitementDto.typeTransfert ?? undefined,
          instruction: updateTraitementDto.instruction ?? undefined,
          structuresCopie: updateTraitementDto.structuresCopie ? structuresCopieJson : undefined,
          delaiTraitement: updateTraitementDto.delaiTraitement ?? undefined,
          nombrePieceJointe: updateTraitementDto.nombrePieceJointe ?? undefined,
          document: documentPath ?? undefined,
        },
      });

      const piecesJointesCreees: any[] = [];
      if (piecesJointes && piecesJointes.length > 0) {
        for (let i = 0; i < piecesJointes.length; i++) {
          const file = piecesJointes[i];
          const intituleData = piecesJointesMetadata[i] || { intitule: file.originalname };

          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.originalname}`;
          const filePath = path.join(transmissionDir, fileName);
          fs.writeFileSync(filePath, file.buffer);

          const pieceJointe = await prisma.pieceJointe.create({
            data: {
              nom: file.originalname,
              intitule: intituleData.intitule,
              chemin: `transmissions/${fileName}`,
              type: file.mimetype,
              idTransmission: transmissionMiseAJour.id,
              idParent: transmissionMiseAJour.id,
              typeParent: 'transmission',
            },
          });

          piecesJointesCreees.push(pieceJointe);
        }
      }

      return { transmission: transmissionMiseAJour, piecesJointes: piecesJointesCreees };
    });

    return this.responseFormatter.success(
      {
        ...result.transmission,
        piecesJointesAjoutees: result.piecesJointes,
      },
      'Mise à jour transmission',
      'Transmission mise à jour avec succès.',
    );
    } catch (error) {
      console.error('❌ Erreur mise à jour transmission:', error?.message || error, error?.stack);
      throw error;
    }
  }

  // 📋 Liste des transmissions du service de l'utilisateur connecté (dernière par courrier)
  async listForService(userId: number, query?: ListTransmissionsQueryDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });

    if (!user?.idService) {
      throw new BadRequestException('L\'utilisateur n\'a pas de service associé.');
    }

    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);
    if (filters.serviceId && filters.serviceId !== user.idService) {
      throw new BadRequestException('Vous ne pouvez pas filtrer sur un autre service.');
    }

    const courrierWhere: any = {};

    console.log('🔍 [listForService] Filtre dateArrivee reçu:', {
      dateArriveeDebut: filters.dateArriveeDebut,
      dateArriveeFin: filters.dateArriveeFin,
    });

    const dateArriveeRange = this.parseDateRangeOrSingle(
      filters.dateArriveeDebut,
      filters.dateArriveeFin,
      'dateArrivee',
    );
    
    console.log('📅 [listForService] Range dateArrivee construit:', {
      dateArriveeRange: dateArriveeRange,
      gte: dateArriveeRange?.gte,
      lte: dateArriveeRange?.lte,
    });
    
    if (dateArriveeRange) {
      courrierWhere.dateArrivee = dateArriveeRange;
    }

    console.log('🔍 [listForService] Filtre dateEnregistrement reçu:', {
      dateEnregistrement: filters.dateEnregistrement,
    });

    if (filters.dateEnregistrement) {
      const dateEnregRange = this.parseSingleDate(
        filters.dateEnregistrement,
        'dateEnregistrement',
      );
      console.log('📅 [listForService] Range dateEnregistrement construit:', {
        dateEnregRange: dateEnregRange,
        gte: dateEnregRange?.gte,
        lte: dateEnregRange?.lte,
      });
      courrierWhere.dateEnregistrement = dateEnregRange;
    }

    console.log('📋 [listForService] courrierWhere après dateEnregistrement:', courrierWhere);

    if (filters.priorite) {
      courrierWhere.priorite = filters.priorite;
    }

    if (filters.categorie) {
      courrierWhere.categorie = filters.categorie;
    } else if (filters.categorieId) {
      const categorie = await this.prismaService.categories.findUnique({
        where: { id: filters.categorieId },
        select: { nom: true },
      });

      if (!categorie) {
        throw new NotFoundException(`La catégorie avec l'ID ${filters.categorieId} n'existe pas.`);
      }

      courrierWhere.categorie = categorie.nom;
    }

    if (filters.typeCourrierId) {
      courrierWhere.idTypeCourrier = filters.typeCourrierId;
    }

    const transmissionWhere: any = {
      idService: user.idService,
    };

    if (filters.statut) {
      transmissionWhere.statut = filters.statut;
    }

    console.log('📊 [listForService] Construction transmissionWhere:', {
      idService: user.idService,
      statut: filters.statut,
    });

    const search = filters.search?.trim();
    if (search) {
      console.log(`🔍 [SEARCH] Recherche avec le terme: "${search}"`);
      const numericSearch = Number(search);
      
      // Conditions de recherche sur la transmission (MySQL est case-insensitive par défaut)
      const transmissionOrFilters: any[] = [
        { instruction: { contains: search } },
        { typeTransfert: { contains: search } },
        { statut: { contains: search } },
        { statutArchive: { contains: search } },
        { document: { contains: search } },
        { commentairePublic: { contains: search } },
        { commentaireInterne: { contains: search } },
      ];

      // Conditions de recherche sur le courrier lié
      const courrierSearchFilters: any[] = [
        { numero: { contains: search } },
        { reference: { contains: search } },
        { objet: { contains: search } },
        { commentaire: { contains: search } },
        { commentairePublic: { contains: search } },
        { commentaireInterne: { contains: search } },
        { priorite: { contains: search } },
        { statut: { contains: search } },
        { document: { contains: search } },
        { telephone: { contains: search } },
        { email: { contains: search } },
        { adresse: { contains: search } },
        { civilite: { contains: search } },
        { nom: { contains: search } },
        { matricule: { contains: search } },
        { typeTransfert: { contains: search } },
        { classeCourrier: { contains: search } },
        { categorie: { contains: search } },
        { statutArchive: { contains: search } },
      ];

      // Recherche numérique
      if (!Number.isNaN(numericSearch)) {
        console.log(`🔍 [SEARCH] Recherche numérique: ${numericSearch}`);
        transmissionOrFilters.push(
          { id: numericSearch },
          { idCourrier: numericSearch },
          { idEmetteur: numericSearch },
          { idService: numericSearch },
          { delaiTraitement: numericSearch },
          { nombrePieceJointe: numericSearch },
        );
        
        // IDs dans le courrier
        courrierSearchFilters.push(
          { id: numericSearch },
          { idProvenance: numericSearch },
          { idTypeCourrier: numericSearch },
          { idService: numericSearch },
          { idUser: numericSearch },
          { nombrePieceJointe: numericSearch },
        );
      }

      // Ajouter les recherches sur le courrier
      courrierSearchFilters.forEach((filter) => {
        transmissionOrFilters.push({
          courrier: { is: filter },
        });
      });

      console.log(`🔍 [SEARCH] Nombre de conditions OR: ${transmissionOrFilters.length}`);
      transmissionWhere.OR = transmissionOrFilters;
    }

    if (Object.keys(courrierWhere).length > 0) {
      transmissionWhere.courrier = { is: courrierWhere };
    }

    const includePayload = {
      courrier: {
        select: {
          id: true,
          numero: true,
          reference: true,
          objet: true,
          commentaire: true,
          commentairePublic: true,
          commentaireInterne: true,
          classeCourrier: true,
          categorie: true,
          dateArrivee: true,
          dateEnregistrement: true,
          priorite: true,
          statut: true,
          isConfidentiel: true,
          typeCourrier: {
            select: { id: true, nom: true },
          },
          provenance: {
            select: { id: true, nom: true, email: true, telephone: true },
          },
        },
      },
      service: {
        select: { id: true, nom: true, sigle: true },
      },
      emetteur: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          service: {
            select: { id: true, nom: true, sigle: true },
          },
        },
      },
      piecesJointes: {
        select: { id: true, nom: true, intitule: true, chemin: true, type: true },
      },
    } as const;

    const requiresLastFilters = Boolean(filters.dernierStatut || filters.dernierServiceId);

    const [transmissions, totalBeforeLastFilters] = await Promise.all([
      this.prismaService.transmission.findMany({
        where: transmissionWhere,
        orderBy: { createdAt: 'desc' },
        include: includePayload,
        ...(requiresLastFilters ? {} : { skip, take: limit }),
      }),
      requiresLastFilters
        ? Promise.resolve(0)
        : this.prismaService.transmission.count({ where: transmissionWhere }),
    ]);

    const courrierIds = transmissions
      .map((t) => t.idCourrier)
      .filter((id): id is number => typeof id === 'number');

    const latestByCourrier = new Map<number, { statut: string | null; service: { id: number; nom: string; sigle: string | null } | null }>();
    const latestOverallByCourrier = new Map<number, { id: number; idEmetteur: number | null; accuseReception: boolean | null }>();
    const latestMyByCourrier = new Map<number, { id: number; service: { id: number; nom: string; sigle: string | null } | null; emetteur: { id: number; fullName: string | null; email: string | null; service: { id: number; nom: string; sigle: string | null } | null } | null; accuseReception: boolean | null }>();

    if (courrierIds.length > 0) {
      const [latestAll, latestOverall, latestMine] = await Promise.all([
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            idCourrier: true,
            statut: true,
            service: {
              select: { id: true, nom: true, sigle: true },
            },
          },
        }),
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            idCourrier: true,
            idEmetteur: true,
            accuseReception: true,
          },
        }),
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
            idEmetteur: userId,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            idCourrier: true,
            accuseReception: true,
            service: {
              select: { id: true, nom: true, sigle: true },
            },
            emetteur: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                service: { select: { id: true, nom: true, sigle: true } },
              },
            },
          },
        }),
      ]);

      for (const t of latestAll) {
        if (typeof t.idCourrier === 'number' && !latestByCourrier.has(t.idCourrier)) {
          latestByCourrier.set(t.idCourrier, {
            statut: t.statut || null,
            service: t.service
              ? { id: t.service.id, nom: t.service.nom, sigle: t.service.sigle }
              : null,
          });
        }
      }

      for (const t of latestOverall) {
        if (typeof t.idCourrier === 'number' && !latestOverallByCourrier.has(t.idCourrier)) {
          latestOverallByCourrier.set(t.idCourrier, {
            id: t.id,
            idEmetteur: t.idEmetteur ?? null,
            accuseReception: t.accuseReception ?? null,
          });
        }
      }

      for (const t of latestMine) {
        if (typeof t.idCourrier === 'number' && !latestMyByCourrier.has(t.idCourrier)) {
          const emetteurFullName = t.emetteur
            ? `${t.emetteur.firstName || ''} ${t.emetteur.lastName || ''}`.trim() || t.emetteur.username
            : null;
          latestMyByCourrier.set(t.idCourrier, {
            id: t.id,
            service: t.service
              ? { id: t.service.id, nom: t.service.nom, sigle: t.service.sigle }
              : null,
            emetteur: t.emetteur
              ? {
                  id: t.emetteur.id,
                  fullName: emetteurFullName,
                  email: t.emetteur.email,
                  service: t.emetteur.service
                    ? { id: t.emetteur.service.id, nom: t.emetteur.service.nom, sigle: t.emetteur.service.sigle }
                    : null,
                }
              : null,
            accuseReception: t.accuseReception ?? null,
          });
        }
      }
    }

    const courrierReponses = courrierIds.length > 0
      ? await this.prismaService.courrierReponse.findMany({
          where: { courrierId: { in: courrierIds } },
          include: {
            reponse: {
              select: {
                id: true,
                objet: true,
                commentairePublic: true,
                commentaireInterne: true,
                classeCourrier: true,
                typeTransmission: true,
                dateReponse: true,
                typesCourrierIds: true,
                serviceDestinataire: {
                  select: { id: true, nom: true, sigle: true },
                },
                redacteur: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                courriers: { select: { courrierId: true } },
              },
            },
          },
        })
      : [];

    const reponsesByCourrier = new Map<number, any[]>();
    for (const cr of courrierReponses) {
      const reponse = cr.reponse;
      const redacteurFullName = reponse?.redacteur
        ? `${reponse.redacteur.firstName || ''} ${reponse.redacteur.lastName || ''}`.trim()
        : '';
      const formatted = {
        id: reponse?.id || null,
        objet: reponse?.objet || null,
        commentairePublic: reponse?.commentairePublic || null,
        commentaireInterne: reponse?.commentaireInterne || null,
        classeCourrier: reponse?.classeCourrier || null,
        typeTransmission: reponse?.typeTransmission || null,
        dateReponse: reponse?.dateReponse || null,
        typeReponse: null,
        serviceDestinataire: reponse?.serviceDestinataire || null,
        redacteur: reponse?.redacteur
          ? {
              id: reponse.redacteur.id,
              fullName: redacteurFullName || null,
              email: reponse.redacteur.email || null,
            }
          : null,
        courrierIds: (reponse?.courriers || []).map((c) => c.courrierId),
        typesCourrierIds: reponse?.typesCourrierIds || [],
        createdAt: reponse?.dateReponse || null,
      };

      const list = reponsesByCourrier.get(cr.courrierId) || [];
      list.push(formatted);
      reponsesByCourrier.set(cr.courrierId, list);
    }

    let data = transmissions.map((transmission) => {
      const latestTransmission = typeof transmission.idCourrier === 'number'
        ? latestByCourrier.get(transmission.idCourrier)
        : undefined;

      const courrier = transmission.courrier
        ? {
            ...transmission.courrier,
            reponses: transmission.courrier.id
              ? reponsesByCourrier.get(transmission.courrier.id) || []
              : [],
          }
        : null;

      const emetteurFullName = transmission.emetteur
        ? `${transmission.emetteur.firstName || ''} ${transmission.emetteur.lastName || ''}`.trim() || transmission.emetteur.username
        : null;

      const lastOverall = typeof transmission.idCourrier === 'number'
        ? latestOverallByCourrier.get(transmission.idCourrier)
        : undefined;

      const canCreateTransmission = lastOverall
        ? lastOverall.idEmetteur !== userId
        : true;

      const canModifyTransmission = lastOverall
        ? lastOverall.idEmetteur === userId && lastOverall.accuseReception !== true
        : false;

      const lastMyTransmission = typeof transmission.idCourrier === 'number'
        ? latestMyByCourrier.get(transmission.idCourrier)
        : undefined;

      return {
        id: transmission.id,
        courrier,
        serviceDestinataire: transmission.service || null,
        emetteur: transmission.emetteur
          ? {
              id: transmission.emetteur.id,
              fullName: emetteurFullName,
              email: transmission.emetteur.email,
              service: transmission.emetteur.service || null,
            }
          : null,
        structuresCopie: transmission.structuresCopie || null,
        dateInstruction: transmission.dateInstruction,
        dateReception: transmission.dateReception,
        instruction: transmission.instruction,
        commentairePublic: transmission.commentairePublic,
        commentaireInterne: transmission.commentaireInterne,
        delaiTraitement: transmission.delaiTraitement,
        typeTransfert: transmission.typeTransfert,
        accuseReception: transmission.accuseReception,
        statut: transmission.statut,
        document: transmission.document,
        pieceJointe: transmission.pieceJointe,
        isDelete: transmission.isDelete,
        isArchive: transmission.isArchive,
        isGeled: transmission.isGeled,
        isinstance: transmission.isinstance,
        statutArchive: transmission.statutArchive,
        viderPar: transmission.viderPar,
        dernierStatutService: latestTransmission
          ? {
              statut: latestTransmission.statut,
              service: latestTransmission.service,
            }
          : null,
        canCreateTransmission,
        canModifyTransmission,
        lastMyTransmission: lastMyTransmission
          ? {
              id: lastMyTransmission.id,
              service: lastMyTransmission.service,
              emetteur: lastMyTransmission.emetteur,
              accuseReception: lastMyTransmission.accuseReception,
              canModify: canModifyTransmission,
            }
          : null,
        nombrePieceJointe: transmission.nombrePieceJointe,
        traitePar: transmission.traitePar || [],
        piecesJointes: transmission.piecesJointes || [],
        createdAt: transmission.createdAt,
        updatedAt: transmission.updatedAt,
      };
    });

    if (filters.dernierStatut || filters.dernierServiceId) {
      data = data.filter((item) => {
        const last = item.dernierStatutService;
        if (!last) return false;

        if (filters.dernierStatut && last.statut?.toLowerCase() !== filters.dernierStatut.toLowerCase()) {
          return false;
        }

        if (filters.dernierServiceId && last.service?.id !== filters.dernierServiceId) {
          return false;
        }

        return true;
      });
    }

    const totalItems = requiresLastFilters ? data.length : totalBeforeLastFilters;
    const paginatedItems = requiresLastFilters
      ? data.slice(skip, skip + limit)
      : data;

    const paginatedResult = this.paginationService.createPaginatedResult(
      paginatedItems,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des transmissions',
      `${totalItems} transmission(s) récupérée(s) avec succès.`,
    );
  }

  // 📋 Liste des transmissions en copie pour le service de l'utilisateur connecté
  async listForServiceCopie(userId: number, query?: ListTransmissionsQueryDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });

    if (!user?.idService) {
      throw new BadRequestException('L\'utilisateur n\'a pas de service associé.');
    }

    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);

    const courrierWhere: any = {};

    const dateArriveeRange = this.parseDateRangeOrSingle(
      filters.dateArriveeDebut,
      filters.dateArriveeFin,
      'dateArrivee',
    );
    if (dateArriveeRange) {
      courrierWhere.dateArrivee = dateArriveeRange;
    }

    if (filters.dateEnregistrement) {
      courrierWhere.dateEnregistrement = this.parseSingleDate(
        filters.dateEnregistrement,
        'dateEnregistrement',
      );
    }

    if (filters.priorite) {
      courrierWhere.priorite = filters.priorite;
    }

    if (filters.categorie) {
      courrierWhere.categorie = filters.categorie;
    } else if (filters.categorieId) {
      const categorie = await this.prismaService.categories.findUnique({
        where: { id: filters.categorieId },
        select: { nom: true },
      });

      if (!categorie) {
        throw new NotFoundException(`La catégorie avec l'ID ${filters.categorieId} n'existe pas.`);
      }

      courrierWhere.categorie = categorie.nom;
    }

    if (filters.typeCourrierId) {
      courrierWhere.idTypeCourrier = filters.typeCourrierId;
    }

    const transmissionWhere: any = {
      structuresCopie: {
        array_contains: user.idService,
      },
    };

    if (filters.serviceId) {
      transmissionWhere.idService = filters.serviceId;
    }

    if (filters.statut) {
      transmissionWhere.statut = filters.statut;
    }

    const search = filters.search?.trim();
    if (search) {
      console.log(`🔍 [SEARCH COPIE] Recherche avec le terme: "${search}"`);
      const numericSearch = Number(search);
      
      // Conditions de recherche sur la transmission (MySQL est case-insensitive par défaut)
      const transmissionOrFilters: any[] = [
        { instruction: { contains: search } },
        { typeTransfert: { contains: search } },
        { statut: { contains: search } },
        { statutArchive: { contains: search } },
        { document: { contains: search } },
        { commentairePublic: { contains: search } },
        { commentaireInterne: { contains: search } },
      ];

      // Conditions de recherche sur le courrier lié
      const courrierSearchFilters: any[] = [
        { numero: { contains: search } },
        { reference: { contains: search } },
        { objet: { contains: search } },
        { commentaire: { contains: search } },
        { commentairePublic: { contains: search } },
        { commentaireInterne: { contains: search } },
        { priorite: { contains: search } },
        { statut: { contains: search } },
        { document: { contains: search } },
        { telephone: { contains: search } },
        { email: { contains: search } },
        { adresse: { contains: search } },
        { civilite: { contains: search } },
        { nom: { contains: search } },
        { matricule: { contains: search } },
        { typeTransfert: { contains: search } },
        { classeCourrier: { contains: search } },
        { categorie: { contains: search } },
        { statutArchive: { contains: search } },
      ];

      // Recherche numérique
      if (!Number.isNaN(numericSearch)) {
        console.log(`🔍 [SEARCH COPIE] Recherche numérique: ${numericSearch}`);
        transmissionOrFilters.push(
          { id: numericSearch },
          { idCourrier: numericSearch },
          { idEmetteur: numericSearch },
          { idService: numericSearch },
          { delaiTraitement: numericSearch },
          { nombrePieceJointe: numericSearch },
        );
        
        // IDs dans le courrier
        courrierSearchFilters.push(
          { id: numericSearch },
          { idProvenance: numericSearch },
          { idTypeCourrier: numericSearch },
          { idService: numericSearch },
          { idUser: numericSearch },
          { nombrePieceJointe: numericSearch },
        );
      }

      // Ajouter les recherches sur le courrier
      courrierSearchFilters.forEach((filter) => {
        transmissionOrFilters.push({
          courrier: { is: filter },
        });
      });

      console.log(`🔍 [SEARCH COPIE] Nombre de conditions OR: ${transmissionOrFilters.length}`);
      transmissionWhere.OR = transmissionOrFilters;
    }

    if (Object.keys(courrierWhere).length > 0) {
      transmissionWhere.courrier = { is: courrierWhere };
    }

    const includePayload = {
      courrier: {
        select: {
          id: true,
          numero: true,
          reference: true,
          objet: true,
          commentaire: true,
          commentairePublic: true,
          commentaireInterne: true,
          classeCourrier: true,
          categorie: true,
          dateArrivee: true,
          dateEnregistrement: true,
          priorite: true,
          statut: true,
          isConfidentiel: true,
          typeCourrier: {
            select: { id: true, nom: true },
          },
          provenance: {
            select: { id: true, nom: true, email: true, telephone: true },
          },
        },
      },
      service: {
        select: { id: true, nom: true, sigle: true },
      },
      emetteur: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          service: {
            select: { id: true, nom: true, sigle: true },
          },
        },
      },
      piecesJointes: {
        select: { id: true, nom: true, intitule: true, chemin: true, type: true },
      },
    } as const;

    const requiresLastFilters = Boolean(filters.dernierStatut || filters.dernierServiceId);

    const [transmissions, totalBeforeLastFilters] = await Promise.all([
      this.prismaService.transmission.findMany({
        where: transmissionWhere,
        orderBy: { createdAt: 'desc' },
        include: includePayload,
        ...(requiresLastFilters ? {} : { skip, take: limit }),
      }),
      requiresLastFilters
        ? Promise.resolve(0)
        : this.prismaService.transmission.count({ where: transmissionWhere }),
    ]);

    const courrierIds = transmissions
      .map((t) => t.idCourrier)
      .filter((id): id is number => typeof id === 'number');

    const latestByCourrier = new Map<number, { statut: string | null; service: { id: number; nom: string; sigle: string | null } | null }>();
    const latestOverallByCourrier = new Map<number, { id: number; idEmetteur: number | null; accuseReception: boolean | null }>();
    const latestMyByCourrier = new Map<number, { id: number; service: { id: number; nom: string; sigle: string | null } | null; emetteur: { id: number; fullName: string | null; email: string | null; service: { id: number; nom: string; sigle: string | null } | null } | null; accuseReception: boolean | null }>();

    if (courrierIds.length > 0) {
      const [latestAll, latestOverall, latestMine] = await Promise.all([
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            idCourrier: true,
            statut: true,
            service: {
              select: { id: true, nom: true, sigle: true },
            },
          },
        }),
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            idCourrier: true,
            idEmetteur: true,
            accuseReception: true,
          },
        }),
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
            idEmetteur: userId,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            idCourrier: true,
            accuseReception: true,
            service: {
              select: { id: true, nom: true, sigle: true },
            },
            emetteur: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                service: { select: { id: true, nom: true, sigle: true } },
              },
            },
          },
        }),
      ]);

      for (const t of latestAll) {
        if (typeof t.idCourrier === 'number' && !latestByCourrier.has(t.idCourrier)) {
          latestByCourrier.set(t.idCourrier, {
            statut: t.statut || null,
            service: t.service
              ? { id: t.service.id, nom: t.service.nom, sigle: t.service.sigle }
              : null,
          });
        }
      }

      for (const t of latestOverall) {
        if (typeof t.idCourrier === 'number' && !latestOverallByCourrier.has(t.idCourrier)) {
          latestOverallByCourrier.set(t.idCourrier, {
            id: t.id,
            idEmetteur: t.idEmetteur ?? null,
            accuseReception: t.accuseReception ?? null,
          });
        }
      }

      for (const t of latestMine) {
        if (typeof t.idCourrier === 'number' && !latestMyByCourrier.has(t.idCourrier)) {
          const emetteurFullName = t.emetteur
            ? `${t.emetteur.firstName || ''} ${t.emetteur.lastName || ''}`.trim() || t.emetteur.username
            : null;
          latestMyByCourrier.set(t.idCourrier, {
            id: t.id,
            service: t.service
              ? { id: t.service.id, nom: t.service.nom, sigle: t.service.sigle }
              : null,
            emetteur: t.emetteur
              ? {
                  id: t.emetteur.id,
                  fullName: emetteurFullName,
                  email: t.emetteur.email,
                  service: t.emetteur.service
                    ? { id: t.emetteur.service.id, nom: t.emetteur.service.nom, sigle: t.emetteur.service.sigle }
                    : null,
                }
              : null,
            accuseReception: t.accuseReception ?? null,
          });
        }
      }
    }

    const courrierReponses = courrierIds.length > 0
      ? await this.prismaService.courrierReponse.findMany({
          where: { courrierId: { in: courrierIds } },
          include: {
            reponse: {
              select: {
                id: true,
                objet: true,
                commentairePublic: true,
                commentaireInterne: true,
                classeCourrier: true,
                typeTransmission: true,
                dateReponse: true,
                typesCourrierIds: true,
                serviceDestinataire: {
                  select: { id: true, nom: true, sigle: true },
                },
                redacteur: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                courriers: { select: { courrierId: true } },
              },
            },
          },
        })
      : [];

    const reponsesByCourrier = new Map<number, any[]>();
    for (const cr of courrierReponses) {
      const reponse = cr.reponse;
      const redacteurFullName = reponse?.redacteur
        ? `${reponse.redacteur.firstName || ''} ${reponse.redacteur.lastName || ''}`.trim()
        : '';
      const formatted = {
        id: reponse?.id || null,
        objet: reponse?.objet || null,
        commentairePublic: reponse?.commentairePublic || null,
        commentaireInterne: reponse?.commentaireInterne || null,
        classeCourrier: reponse?.classeCourrier || null,
        typeTransmission: reponse?.typeTransmission || null,
        dateReponse: reponse?.dateReponse || null,
        typeReponse: null,
        serviceDestinataire: reponse?.serviceDestinataire || null,
        redacteur: reponse?.redacteur
          ? {
              id: reponse.redacteur.id,
              fullName: redacteurFullName || null,
              email: reponse.redacteur.email || null,
            }
          : null,
        courrierIds: (reponse?.courriers || []).map((c) => c.courrierId),
        typesCourrierIds: reponse?.typesCourrierIds || [],
        createdAt: reponse?.dateReponse || null,
      };

      const list = reponsesByCourrier.get(cr.courrierId) || [];
      list.push(formatted);
      reponsesByCourrier.set(cr.courrierId, list);
    }

    let data = transmissions.map((transmission) => {
      const latestTransmission = typeof transmission.idCourrier === 'number'
        ? latestByCourrier.get(transmission.idCourrier)
        : undefined;

      const courrier = transmission.courrier
        ? {
            ...transmission.courrier,
            reponses: transmission.courrier.id
              ? reponsesByCourrier.get(transmission.courrier.id) || []
              : [],
          }
        : null;

      const emetteurFullName = transmission.emetteur
        ? `${transmission.emetteur.firstName || ''} ${transmission.emetteur.lastName || ''}`.trim() || transmission.emetteur.username
        : null;

      const lastOverall = typeof transmission.idCourrier === 'number'
        ? latestOverallByCourrier.get(transmission.idCourrier)
        : undefined;

      const canCreateTransmission = lastOverall
        ? lastOverall.idEmetteur !== userId
        : true;

      const canModifyTransmission = lastOverall
        ? lastOverall.idEmetteur === userId && lastOverall.accuseReception !== true
        : false;

      const lastMyTransmission = typeof transmission.idCourrier === 'number'
        ? latestMyByCourrier.get(transmission.idCourrier)
        : undefined;

      return {
        id: transmission.id,
        courrier,
        serviceDestinataire: transmission.service || null,
        emetteur: transmission.emetteur
          ? {
              id: transmission.emetteur.id,
              fullName: emetteurFullName,
              email: transmission.emetteur.email,
              service: transmission.emetteur.service || null,
            }
          : null,
        structuresCopie: transmission.structuresCopie || null,
        dateInstruction: transmission.dateInstruction,
        instruction: transmission.instruction,
        delaiTraitement: transmission.delaiTraitement,
        typeTransfert: transmission.typeTransfert,
        accuseReception: transmission.accuseReception,
        statut: transmission.statut,
        dernierStatutService: latestTransmission
          ? {
              statut: latestTransmission.statut,
              service: latestTransmission.service,
            }
          : null,
        canCreateTransmission,
        canModifyTransmission,
        lastMyTransmission: lastMyTransmission
          ? {
              id: lastMyTransmission.id,
              service: lastMyTransmission.service,
              emetteur: lastMyTransmission.emetteur,
              accuseReception: lastMyTransmission.accuseReception,
              canModify: canModifyTransmission,
            }
          : null,
        instanceof: transmission.isinstance,
        nombrePieceJointe: transmission.nombrePieceJointe,
        traitePar: transmission.traitePar || [],
        piecesJointes: transmission.piecesJointes || [],
        createdAt: transmission.createdAt,
        updatedAt: transmission.updatedAt,
      };
    });

    if (filters.dernierStatut || filters.dernierServiceId) {
      data = data.filter((item) => {
        const last = item.dernierStatutService;
        if (!last) return false;

        if (filters.dernierStatut && last.statut?.toLowerCase() !== filters.dernierStatut.toLowerCase()) {
          return false;
        }

        if (filters.dernierServiceId && last.service?.id !== filters.dernierServiceId) {
          return false;
        }

        return true;
      });
    }

    const totalItems = requiresLastFilters ? data.length : totalBeforeLastFilters;
    const paginatedItems = requiresLastFilters
      ? data.slice(skip, skip + limit)
      : data;

    const paginatedResult = this.paginationService.createPaginatedResult(
      paginatedItems,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des transmissions en copie',
      `${totalItems} transmission(s) récupérée(s) avec succès.`,
    );
  }

  // 📋 Liste des transmissions destinées aux services additionnels de l'utilisateur connecté
  async listForAdditionalServices(userId: number, query?: ListTransmissionsQueryDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });

    if (!user?.idService) {
      throw new BadRequestException('L\'utilisateur n\'a pas de service associé.');
    }

    const additionnels = await this.prismaService.userServiceAdditionnel.findMany({
      where: { userId },
      select: { serviceId: true },
    });

    const additionalServiceIds = additionnels.map((s) => s.serviceId);

    if (additionalServiceIds.length === 0) {
      const paginatedResult = this.paginationService.createPaginatedResult(
        [],
        1,
        query?.limit ?? 10,
        0,
      );

      return this.responseFormatter.paginated(
        paginatedResult,
        'Liste des transmissions des services additionnels',
        '0 transmission récupérée avec succès.',
      );
    }

    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);

    if (filters.serviceId && !additionalServiceIds.includes(filters.serviceId)) {
      throw new BadRequestException('Vous ne pouvez filtrer que sur vos services additionnels.');
    }

    const courrierWhere: any = {};

    const dateArriveeRange = this.parseDateRangeOrSingle(
      filters.dateArriveeDebut,
      filters.dateArriveeFin,
      'dateArrivee',
    );
    if (dateArriveeRange) {
      courrierWhere.dateArrivee = dateArriveeRange;
    }

    if (filters.dateEnregistrement) {
      courrierWhere.dateEnregistrement = this.parseSingleDate(
        filters.dateEnregistrement,
        'dateEnregistrement',
      );
    }

    if (filters.priorite) {
      courrierWhere.priorite = filters.priorite;
    }

    if (filters.categorie) {
      courrierWhere.categorie = filters.categorie;
    } else if (filters.categorieId) {
      const categorie = await this.prismaService.categories.findUnique({
        where: { id: filters.categorieId },
        select: { nom: true },
      });

      if (!categorie) {
        throw new NotFoundException(`La catégorie avec l'ID ${filters.categorieId} n'existe pas.`);
      }

      courrierWhere.categorie = categorie.nom;
    }

    if (filters.typeCourrierId) {
      courrierWhere.idTypeCourrier = filters.typeCourrierId;
    }

    const transmissionWhere: any = {
      idService: filters.serviceId ?? { in: additionalServiceIds },
    };

    if (filters.statut) {
      transmissionWhere.statut = filters.statut;
    }

    const search = filters.search?.trim();
    if (search) {
      console.log(`🔍 [SEARCH ADDITIONNEL] Recherche avec le terme: "${search}"`);
      const numericSearch = Number(search);
      
      // Conditions de recherche sur la transmission (MySQL est case-insensitive par défaut)
      const transmissionOrFilters: any[] = [
        { instruction: { contains: search } },
        { typeTransfert: { contains: search } },
        { statut: { contains: search } },
        { statutArchive: { contains: search } },
        { document: { contains: search } },
        { commentairePublic: { contains: search } },
        { commentaireInterne: { contains: search } },
      ];

      // Conditions de recherche sur le courrier lié
      const courrierSearchFilters: any[] = [
        { numero: { contains: search } },
        { reference: { contains: search } },
        { objet: { contains: search } },
        { commentaire: { contains: search } },
        { commentairePublic: { contains: search } },
        { commentaireInterne: { contains: search } },
        { priorite: { contains: search } },
        { statut: { contains: search } },
        { document: { contains: search } },
        { telephone: { contains: search } },
        { email: { contains: search } },
        { adresse: { contains: search } },
        { civilite: { contains: search } },
        { nom: { contains: search } },
        { matricule: { contains: search } },
        { typeTransfert: { contains: search } },
        { classeCourrier: { contains: search } },
        { categorie: { contains: search } },
        { statutArchive: { contains: search } },
      ];

      // Recherche numérique
      if (!Number.isNaN(numericSearch)) {
        console.log(`🔍 [SEARCH ADDITIONNEL] Recherche numérique: ${numericSearch}`);
        transmissionOrFilters.push(
          { id: numericSearch },
          { idCourrier: numericSearch },
          { idEmetteur: numericSearch },
          { idService: numericSearch },
          { delaiTraitement: numericSearch },
          { nombrePieceJointe: numericSearch },
        );
        
        // IDs dans le courrier
        courrierSearchFilters.push(
          { id: numericSearch },
          { idProvenance: numericSearch },
          { idTypeCourrier: numericSearch },
          { idService: numericSearch },
          { idUser: numericSearch },
          { nombrePieceJointe: numericSearch },
        );
      }

      // Ajouter les recherches sur le courrier
      courrierSearchFilters.forEach((filter) => {
        transmissionOrFilters.push({
          courrier: { is: filter },
        });
      });

      console.log(`🔍 [SEARCH ADDITIONNEL] Nombre de conditions OR: ${transmissionOrFilters.length}`);
      transmissionWhere.OR = transmissionOrFilters;
    }

    if (Object.keys(courrierWhere).length > 0) {
      transmissionWhere.courrier = { is: courrierWhere };
    }

    const includePayload = {
      courrier: {
        select: {
          id: true,
          numero: true,
          reference: true,
          objet: true,
          commentaire: true,
          commentairePublic: true,
          commentaireInterne: true,
          classeCourrier: true,
          categorie: true,
          dateArrivee: true,
          dateEnregistrement: true,
          priorite: true,
          statut: true,
          isConfidentiel: true,
          typeCourrier: {
            select: { id: true, nom: true },
          },
          provenance: {
            select: { id: true, nom: true, email: true, telephone: true },
          },
        },
      },
      service: {
        select: { id: true, nom: true, sigle: true },
      },
      emetteur: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          service: {
            select: { id: true, nom: true, sigle: true },
          },
        },
      },
      piecesJointes: {
        select: { id: true, nom: true, intitule: true, chemin: true, type: true },
      },
    } as const;

    const requiresLastFilters = Boolean(filters.dernierStatut || filters.dernierServiceId);

    const [transmissions, totalBeforeLastFilters] = await Promise.all([
      this.prismaService.transmission.findMany({
        where: transmissionWhere,
        orderBy: { createdAt: 'desc' },
        include: includePayload,
        ...(requiresLastFilters ? {} : { skip, take: limit }),
      }),
      requiresLastFilters
        ? Promise.resolve(0)
        : this.prismaService.transmission.count({ where: transmissionWhere }),
    ]);

    const courrierIds = transmissions
      .map((t) => t.idCourrier)
      .filter((id): id is number => typeof id === 'number');

    const latestByCourrier = new Map<number, { statut: string | null; service: { id: number; nom: string; sigle: string | null } | null }>();
    const latestOverallByCourrier = new Map<number, { id: number; idEmetteur: number | null; accuseReception: boolean | null }>();
    const latestMyByCourrier = new Map<number, { id: number; service: { id: number; nom: string; sigle: string | null } | null; emetteur: { id: number; fullName: string | null; email: string | null; service: { id: number; nom: string; sigle: string | null } | null } | null; accuseReception: boolean | null }>();

    if (courrierIds.length > 0) {
      const [latestAll, latestOverall, latestMine] = await Promise.all([
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            idCourrier: true,
            statut: true,
            service: {
              select: { id: true, nom: true, sigle: true },
            },
          },
        }),
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            idCourrier: true,
            idEmetteur: true,
            accuseReception: true,
          },
        }),
        this.prismaService.transmission.findMany({
          where: {
            idCourrier: { in: courrierIds },
            idEmetteur: userId,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            idCourrier: true,
            accuseReception: true,
            service: {
              select: { id: true, nom: true, sigle: true },
            },
            emetteur: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                service: { select: { id: true, nom: true, sigle: true } },
              },
            },
          },
        }),
      ]);

      for (const t of latestAll) {
        if (typeof t.idCourrier === 'number' && !latestByCourrier.has(t.idCourrier)) {
          latestByCourrier.set(t.idCourrier, {
            statut: t.statut || null,
            service: t.service
              ? { id: t.service.id, nom: t.service.nom, sigle: t.service.sigle }
              : null,
          });
        }
      }

      for (const t of latestOverall) {
        if (typeof t.idCourrier === 'number' && !latestOverallByCourrier.has(t.idCourrier)) {
          latestOverallByCourrier.set(t.idCourrier, {
            id: t.id,
            idEmetteur: t.idEmetteur ?? null,
            accuseReception: t.accuseReception ?? null,
          });
        }
      }

      for (const t of latestMine) {
        if (typeof t.idCourrier === 'number' && !latestMyByCourrier.has(t.idCourrier)) {
          const emetteurFullName = t.emetteur
            ? `${t.emetteur.firstName || ''} ${t.emetteur.lastName || ''}`.trim() || t.emetteur.username
            : null;
          latestMyByCourrier.set(t.idCourrier, {
            id: t.id,
            service: t.service
              ? { id: t.service.id, nom: t.service.nom, sigle: t.service.sigle }
              : null,
            emetteur: t.emetteur
              ? {
                  id: t.emetteur.id,
                  fullName: emetteurFullName,
                  email: t.emetteur.email,
                  service: t.emetteur.service
                    ? { id: t.emetteur.service.id, nom: t.emetteur.service.nom, sigle: t.emetteur.service.sigle }
                    : null,
                }
              : null,
            accuseReception: t.accuseReception ?? null,
          });
        }
      }
    }

    const courrierReponses = courrierIds.length > 0
      ? await this.prismaService.courrierReponse.findMany({
          where: { courrierId: { in: courrierIds } },
          include: {
            reponse: {
              select: {
                id: true,
                objet: true,
                commentairePublic: true,
                commentaireInterne: true,
                classeCourrier: true,
                typeTransmission: true,
                dateReponse: true,
                typesCourrierIds: true,
                serviceDestinataire: {
                  select: { id: true, nom: true, sigle: true },
                },
                redacteur: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                courriers: { select: { courrierId: true } },
              },
            },
          },
        })
      : [];

    const reponsesByCourrier = new Map<number, any[]>();
    for (const cr of courrierReponses) {
      const reponse = cr.reponse;
      const redacteurFullName = reponse?.redacteur
        ? `${reponse.redacteur.firstName || ''} ${reponse.redacteur.lastName || ''}`.trim()
        : '';
      const formatted = {
        id: reponse?.id || null,
        objet: reponse?.objet || null,
        commentairePublic: reponse?.commentairePublic || null,
        commentaireInterne: reponse?.commentaireInterne || null,
        classeCourrier: reponse?.classeCourrier || null,
        typeTransmission: reponse?.typeTransmission || null,
        dateReponse: reponse?.dateReponse || null,
        typeReponse: null,
        serviceDestinataire: reponse?.serviceDestinataire || null,
        redacteur: reponse?.redacteur
          ? {
              id: reponse.redacteur.id,
              fullName: redacteurFullName || null,
              email: reponse.redacteur.email || null,
            }
          : null,
        courrierIds: (reponse?.courriers || []).map((c) => c.courrierId),
        typesCourrierIds: reponse?.typesCourrierIds || [],
        createdAt: reponse?.dateReponse || null,
      };

      const list = reponsesByCourrier.get(cr.courrierId) || [];
      list.push(formatted);
      reponsesByCourrier.set(cr.courrierId, list);
    }

    let data = transmissions.map((transmission) => {
      const latestTransmission = typeof transmission.idCourrier === 'number'
        ? latestByCourrier.get(transmission.idCourrier)
        : undefined;

      const courrier = transmission.courrier
        ? {
            ...transmission.courrier,
            reponses: transmission.courrier.id
              ? reponsesByCourrier.get(transmission.courrier.id) || []
              : [],
          }
        : null;

      const emetteurFullName = transmission.emetteur
        ? `${transmission.emetteur.firstName || ''} ${transmission.emetteur.lastName || ''}`.trim() || transmission.emetteur.username
        : null;

      const lastOverall = typeof transmission.idCourrier === 'number'
        ? latestOverallByCourrier.get(transmission.idCourrier)
        : undefined;

      const canCreateTransmission = lastOverall
        ? lastOverall.idEmetteur !== userId
        : true;

      const canModifyTransmission = lastOverall
        ? lastOverall.idEmetteur === userId && lastOverall.accuseReception !== true
        : false;

      const lastMyTransmission = typeof transmission.idCourrier === 'number'
        ? latestMyByCourrier.get(transmission.idCourrier)
        : undefined;

      return {
        id: transmission.id,
        courrier,
        serviceDestinataire: transmission.service || null,
        emetteur: transmission.emetteur
          ? {
              id: transmission.emetteur.id,
              fullName: emetteurFullName,
              email: transmission.emetteur.email,
              service: transmission.emetteur.service || null,
            }
          : null,
        structuresCopie: transmission.structuresCopie || null,
        dateInstruction: transmission.dateInstruction,
        instruction: transmission.instruction,
        delaiTraitement: transmission.delaiTraitement,
        typeTransfert: transmission.typeTransfert,
        accuseReception: transmission.accuseReception,
        statut: transmission.statut,
        document: transmission.document,
        pieceJointe: transmission.pieceJointe,
        isDelete: transmission.isDelete,
        isArchive: transmission.isArchive,
        isGeled: transmission.isGeled,
        isinstance: transmission.isinstance,
        statutArchive: transmission.statutArchive,
        viderPar: transmission.viderPar,
        dernierStatutService: latestTransmission
          ? {
              statut: latestTransmission.statut,
              service: latestTransmission.service,
            }
          : null,
        canCreateTransmission,
        canModifyTransmission,
        lastMyTransmission: lastMyTransmission
          ? {
              id: lastMyTransmission.id,
              service: lastMyTransmission.service,
              emetteur: lastMyTransmission.emetteur,
              accuseReception: lastMyTransmission.accuseReception,
              canModify: canModifyTransmission,
            }
          : null,
        nombrePieceJointe: transmission.nombrePieceJointe,
        traitePar: transmission.traitePar || [],
        piecesJointes: transmission.piecesJointes || [],
        createdAt: transmission.createdAt,
        updatedAt: transmission.updatedAt,
      };
    });

    if (filters.dernierStatut || filters.dernierServiceId) {
      data = data.filter((item) => {
        const last = item.dernierStatutService;
        if (!last) return false;

        if (filters.dernierStatut && last.statut?.toLowerCase() !== filters.dernierStatut.toLowerCase()) {
          return false;
        }

        if (filters.dernierServiceId && last.service?.id !== filters.dernierServiceId) {
          return false;
        }

        return true;
      });
    }

    const totalItems = requiresLastFilters ? data.length : totalBeforeLastFilters;
    const paginatedItems = requiresLastFilters
      ? data.slice(skip, skip + limit)
      : data;

    const paginatedResult = this.paginationService.createPaginatedResult(
      paginatedItems,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des transmissions des services additionnels',
      `${totalItems} transmission(s) récupérée(s) avec succès.`,
    );
  }

  // ⏰ Relance: lister les transmissions en retard
  async listRelance(userId: number, query?: RelanceQueryDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });

    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);

    const where: any = {
      isDelete: false,
      isArchive: false,
      accuseReception: false,
      delaiTraitement: { not: null },
      dateInstruction: { not: null },
    };

    const serviceIdFinal = filters.serviceId ?? user?.idService ?? undefined;
    if (serviceIdFinal) {
      where.idService = serviceIdFinal;
    }

    if (filters.priorite) {
      where.courrier = { is: { priorite: filters.priorite } };
    }

    const search = filters.search?.trim();
    if (search) {
      const numericSearch = Number(search);
      const orFilters: any[] = [
        { instruction: { contains: search } },
        { typeTransfert: { contains: search } },
        { statut: { contains: search } },
        { courrier: { is: { numero: { contains: search } } } },
        { courrier: { is: { reference: { contains: search } } } },
        { courrier: { is: { objet: { contains: search } } } },
        { courrier: { is: { nom: { contains: search } } } },
        { courrier: { is: { email: { contains: search } } } },
        { courrier: { is: { telephone: { contains: search } } } },
        { service: { is: { nom: { contains: search } } } },
        { service: { is: { sigle: { contains: search } } } },
        { courrier: { is: { typeCourrier: { is: { nom: { contains: search } } } } } },
        { courrier: { is: { provenance: { is: { nom: { contains: search } } } } } },
      ];

      if (!Number.isNaN(numericSearch)) {
        orFilters.push(
          { id: numericSearch },
          { idCourrier: numericSearch },
          { idService: numericSearch },
          { idEmetteur: numericSearch },
        );
      }

      where.OR = orFilters;
    }

    const transmissions = await this.prismaService.transmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, nom: true, sigle: true } },
        courrier: {
          select: {
            id: true,
            numero: true,
            reference: true,
            objet: true,
            priorite: true,
            statut: true,
            dateArrivee: true,
            dateEnregistrement: true,
            createdAt: true,
            isConfidentiel: true,
            categorie: true,
            provenance: { select: { id: true, nom: true } },
            typeCourrier: { select: { id: true, nom: true } },
            user: { select: { id: true, firstName: true, lastName: true, username: true } },
          },
        },
      },
    });

    const now = new Date();

    const overdueItems = transmissions
      .map((transmission) => {
        const dateInstruction = transmission.dateInstruction ? new Date(transmission.dateInstruction) : null;
        const delaiTraitement = transmission.delaiTraitement ?? null;
        if (!dateInstruction || delaiTraitement === null) {
          return null;
        }

        const diffMs = now.getTime() - dateInstruction.getTime();
        const delaiEcoule = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const joursDepassement = Math.max(0, delaiEcoule - delaiTraitement);
        const enDepassement = joursDepassement > 0;

        if (!enDepassement) {
          return null;
        }

        const createurFullName = transmission.courrier?.user
          ? `${transmission.courrier.user.firstName || ''} ${transmission.courrier.user.lastName || ''}`.trim() || transmission.courrier.user.username
          : null;

        return {
          id: transmission.courrier?.id ?? transmission.id,
          numero: transmission.courrier?.numero ?? null,
          reference: transmission.courrier?.reference ?? null,
          objet: transmission.courrier?.objet ?? null,
          priorite: transmission.courrier?.priorite ?? null,
          statut: transmission.courrier?.statut ?? transmission.statut ?? null,
          dateArrivee: transmission.courrier?.dateArrivee ?? null,
          dateEnregistrement: transmission.courrier?.dateEnregistrement ?? null,
          createdAt: transmission.courrier?.createdAt ?? transmission.createdAt,
          idServiceTraitant: transmission.service?.nom ?? null,
          categorieProvenance: transmission.courrier?.provenance?.nom ?? null,
          typeCourrier: transmission.courrier?.typeCourrier?.nom ?? null,
          IdProvenance: transmission.courrier?.provenance?.nom ?? null,
          idCreateur: createurFullName,
          isConfidentiel: transmission.courrier?.isConfidentiel ?? false,
          delaiEcoule,
          enDepassement,
          joursDepassement,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const filteredItems = filters.retardJours !== undefined
      ? overdueItems.filter((item) => item.joursDepassement === filters.retardJours)
      : overdueItems;

    const stats = {
      retard_3_jours: filteredItems.filter((i) => i.joursDepassement >= 3).length,
      retard_7_jours: filteredItems.filter((i) => i.joursDepassement >= 7).length,
      retard_15_jours: filteredItems.filter((i) => i.joursDepassement >= 15).length,
      retard_30_jours: filteredItems.filter((i) => i.joursDepassement >= 30).length,
      detail: {
        courriers_arrives: {
          retard_3_jours: filteredItems.filter((i) => i.joursDepassement >= 3).length,
          retard_7_jours: filteredItems.filter((i) => i.joursDepassement >= 7).length,
          retard_15_jours: filteredItems.filter((i) => i.joursDepassement >= 15).length,
          retard_30_jours: filteredItems.filter((i) => i.joursDepassement >= 30).length,
        },
        transmissions: {
          retard_3_jours: filteredItems.filter((i) => i.joursDepassement >= 3).length,
          retard_7_jours: filteredItems.filter((i) => i.joursDepassement >= 7).length,
          retard_15_jours: filteredItems.filter((i) => i.joursDepassement >= 15).length,
          retard_30_jours: filteredItems.filter((i) => i.joursDepassement >= 30).length,
        },
        courriers_depart: {
          retard_3_jours: 0,
          retard_7_jours: 0,
          retard_15_jours: 0,
          retard_30_jours: 0,
        },
      },
    };

    const totalItems = filteredItems.length;
    const paginatedItems = filteredItems.slice(skip, skip + limit);
    const paginatedResult = this.paginationService.createPaginatedResult(
      paginatedItems,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.success(
      {
        statistiques: stats,
        data: paginatedResult,
      },
      'Relance transmissions en retard',
      `${totalItems} transmission(s) en retard trouvée(s).`,
    );
  }

  // 🔍 Récupérer une transmission par ID
  async findOne(id: number) {
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
      include: {
        courrier: {
          select: {
            id: true,
            numero: true,
            reference: true,
            objet: true,
            commentaire: true,
            commentairePublic: true,
            commentaireInterne: true,
            classeCourrier: true,
            dateArrivee: true,
            dateEnregistrement: true,
            priorite: true,
            statut: true,
            isConfidentiel: true,
            typeCourrier: {
              select: {
                id: true,
                nom: true,
              },
            },
            provenance: {
              select: {
                id: true,
                nom: true,
                email: true,
                telephone: true,
              },
            },
          },
        },
        service: {
          select: {
            id: true,
            nom: true,
            sigle: true,
          },
        },
        emetteur: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            service: {
              select: {
                id: true,
                nom: true,
                sigle: true,
              },
            },
          },
        },
        piecesJointes: {
          select: {
            id: true,
            nom: true,
            intitule: true,
            chemin: true,
            type: true,
          },
        },
      },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    let reponses: any[] = [];
    if (transmission.courrier?.id) {
      const courrierReponses = await this.prismaService.courrierReponse.findMany({
        where: { courrierId: transmission.courrier.id },
        include: {
          reponse: {
            select: {
              id: true,
              objet: true,
              commentairePublic: true,
              commentaireInterne: true,
              classeCourrier: true,
              typeTransmission: true,
              dateReponse: true,
              typesCourrierIds: true,
              serviceDestinataire: {
                select: {
                  id: true,
                  nom: true,
                  sigle: true,
                },
              },
              redacteur: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              courriers: {
                select: {
                  courrierId: true,
                },
              },
            },
          },
        },
      });

      reponses = courrierReponses.map((cr) => {
        const reponse = cr.reponse;
        const redacteurFullName = reponse?.redacteur
          ? `${reponse.redacteur.firstName || ''} ${reponse.redacteur.lastName || ''}`.trim()
          : '';

        return {
          id: reponse?.id || null,
          objet: reponse?.objet || null,
          commentairePublic: reponse?.commentairePublic || null,
          commentaireInterne: reponse?.commentaireInterne || null,
          classeCourrier: reponse?.classeCourrier || null,
          typeTransmission: reponse?.typeTransmission || null,
          dateReponse: reponse?.dateReponse || null,
          typeReponse: null,
          serviceDestinataire: reponse?.serviceDestinataire || null,
          redacteur: reponse?.redacteur
            ? {
                id: reponse.redacteur.id,
                fullName: redacteurFullName || null,
                email: reponse.redacteur.email || null,
              }
            : null,
          courrierIds: (reponse?.courriers || []).map((c) => c.courrierId),
          typesCourrierIds: reponse?.typesCourrierIds || [],
          createdAt: reponse?.dateReponse || null,
        };
      });
    }

    const courrier = transmission.courrier
      ? {
          ...transmission.courrier,
          reponses,
        }
      : null;

    const emetteurFullName = transmission.emetteur
      ? `${transmission.emetteur.firstName || ''} ${transmission.emetteur.lastName || ''}`.trim() || transmission.emetteur.username
      : null;

    const response = {
      id: transmission.id,
      courrier,
      serviceDestinataire: transmission.service || null,
      emetteur: transmission.emetteur
        ? {
            id: transmission.emetteur.id,
            username: transmission.emetteur.username,
            fullName: emetteurFullName,
            email: transmission.emetteur.email,
            service: transmission.emetteur.service || null,
          }
        : null,
      structuresCopie: transmission.structuresCopie || null,
      dateInstruction: transmission.dateInstruction,
      instruction: transmission.instruction,
      delaiTraitement: transmission.delaiTraitement,
      typeTransfert: transmission.typeTransfert,
      accuseReception: transmission.accuseReception,
      statut: transmission.statut,
      isinstance: transmission.isinstance,
      nombrePieceJointe: transmission.nombrePieceJointe,
      traitePar: transmission.traitePar || [],
      piecesJointes: transmission.piecesJointes || [],
      createdAt: transmission.createdAt,
      updatedAt: transmission.updatedAt,
    };

    return this.responseFormatter.success(
      response,
      'Détails transmission',
      'Transmission récupérée avec succès.',
    );
  }

  // 🗑️ Suppression logique d'une transmission
  async delete(id: number) {
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    const transmissionSupprimee = await this.prismaService.transmission.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.success(
      transmissionSupprimee,
      'Suppression logique transmission',
      'Transmission supprimée logiquement avec succès.',
    );
  }

  // ❌ Suppression définitive d'une transmission
  async deletePermanent(id: number) {
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    await this.prismaService.transmission.delete({
      where: { id },
    });

    return this.responseFormatter.success(
      { id },
      'Suppression définitive transmission',
      'Transmission supprimée définitivement avec succès.',
    );
  }

  // 📁 Classer une transmission (et le courrier lié automatiquement)
  async classerTransmission(id: number, classerDto: ClasserTransmissionDto, userId: number) {
    // Vérifier que la transmission existe
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
      include: { courrier: true },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    // Vérifier que la transmission n'est pas déjà gelée (classée)
    if (transmission.isGeled) {
      throw new BadRequestException('Cette transmission est déjà classée (gelée).');
    }

    // Vérifier que le courrier existe
    if (!transmission.courrier) {
      throw new NotFoundException(`Le courrier lié à cette transmission n'existe pas.`);
    }

    // Récupérer les informations de l'utilisateur qui classe
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, username: true },
    });

    // Préparer les données de traitement
    const traitePar = (transmission.traitePar as any[]) || [];
    const nouveauTraitement = {
      userId: userId,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Utilisateur inconnu',
      action: 'Classé',
      date: new Date(),
    };
    traitePar.push(nouveauTraitement);

    // Mettre à jour la transmission
    const transmissionClassee = await this.prismaService.transmission.update({
      where: { id },
      data: {
        statut: 'Classé',
        isGeled: true,
        traitePar: traitePar,
        commentairePublic: classerDto.commentairePublic || transmission.commentairePublic,
        commentaireInterne: classerDto.commentaireInterne || transmission.commentaireInterne,
      },
    });

    // Classer automatiquement le courrier lié si pas déjà classé
    if (!transmission.courrier.isGeled) {
      try {
        if (!transmission.idCourrier) {
          throw new Error('ID courrier manquant');
        }
        await this.courrierService.classerCourrier(transmission.idCourrier);
      } catch (error) {
        // Loguer l'erreur mais ne pas bloquer le classement de la transmission
        console.error('Erreur lors du classement automatique du courrier:', error.message);
      }
    }

    return this.responseFormatter.success(
      transmissionClassee,
      'Classement transmission',
      `Transmission classée avec succès. Le courrier ${transmission.courrier.numero} a également été classé.`,
    );
  }

  // 📂 Déclasser une transmission (et le courrier lié automatiquement)
  async declasserTransmission(id: number, declasserDto: any, userId: number) {
    // Vérifier que la transmission existe
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
      include: { courrier: true },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    // Vérifier que la transmission est bien gelée (classée)
    if (!transmission.isGeled) {
      throw new BadRequestException('Cette transmission n\'est pas classée (gelée). Impossible de la déclasser.');
    }

    // Vérifier que le courrier existe
    if (!transmission.courrier) {
      throw new NotFoundException(`Le courrier lié à cette transmission n'existe pas.`);
    }

    // Récupérer les informations de l'utilisateur
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, username: true },
    });

    // Déterminer le nouveau statut basé sur les propriétés actuelles de la transmission
    let nouveauStatut = 'En traitement'; // Statut par défaut

    // Debug: Afficher les propriétés pour diagnostic
    console.log(`DEBUG Déclassement transmission ${id}:`, {
      isArchive: transmission.isArchive,
      isinstance: transmission.isinstance,
      accuseReception: transmission.accuseReception,
      currentStatus: transmission.statut
    });

    if (transmission.isArchive) {
      nouveauStatut = 'Archivé';
    } else if (transmission.isinstance) {
      nouveauStatut = 'En instance';
    } else if (transmission.accuseReception) {
      nouveauStatut = 'Reçu';
    }

    console.log(`DEBUG Nouveau statut calculé: ${nouveauStatut}`);

    // Préparer les données de traitement
    const traitePar = (transmission.traitePar as any[]) || [];
    const nouveauTraitement = {
      userId: userId,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Utilisateur inconnu',
      action: 'Déclassé',
      date: new Date(),
    };
    traitePar.push(nouveauTraitement);

    // Préparer les données de mise à jour
    const updateData: any = {
      statut: nouveauStatut,
      isGeled: false,
      traitePar: traitePar,
    };

    // Ajouter les commentaires s'ils sont fournis
    if (declasserDto?.commentairePublic !== undefined) {
      updateData.commentairePublic = declasserDto.commentairePublic;
    }
    if (declasserDto?.commentaireInterne !== undefined) {
      updateData.commentaireInterne = declasserDto.commentaireInterne;
    }

    // Mettre à jour la transmission (ne pas modifier isArchive)
    const transmissionDeclassee = await this.prismaService.transmission.update({
      where: { id },
      data: updateData,
    });

    // Déclasser automatiquement le courrier lié si classé
    if (transmission.courrier.isGeled) {
      try {
        if (!transmission.idCourrier) {
          throw new Error('ID courrier manquant');
        }
        await this.courrierService.declasserCourrier(transmission.idCourrier);
      } catch (error) {
        // Loguer l'erreur mais ne pas bloquer le déclassement de la transmission
        console.error('Erreur lors du déclassement automatique du courrier:', error.message);
      }
    }

    return this.responseFormatter.success(
      transmissionDeclassee,
      'Déclassement transmission',
      `Transmission déclassée avec succès. Nouveau statut: ${nouveauStatut}. Le courrier ${transmission.courrier.numero} a également été déclassé.`,
    );
  }

  // 📌 Instancier une transmission
  async instancierTransmission(id: number, userId: number) {
    // Vérifier que la transmission existe
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    // Vérifier que la transmission n'est pas déjà instanciée
    if (transmission.isinstance) {
      throw new BadRequestException('Cette transmission est déjà instanciée.');
    }

    // Récupérer les informations de l'utilisateur
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, username: true },
    });

    // Préparer les données de traitement
    const traitePar = (transmission.traitePar as any[]) || [];
    const nouveauTraitement = {
      userId: userId,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Utilisateur inconnu',
      action: 'Instancié',
      date: new Date(),
    };
    traitePar.push(nouveauTraitement);

    // Mettre à jour la transmission
    const transmissionInstanciee = await this.prismaService.transmission.update({
      where: { id },
      data: {
        isinstance: true,
        statut: 'Instancié',
        traitePar: traitePar,
      },
    });

    return this.responseFormatter.success(
      transmissionInstanciee,
      'Instanciation transmission',
      `Transmission instanciée avec succès.`,
    );
  }

  // 📍 Désinstancier une transmission
  async desinstancierTransmission(id: number, userId: number) {
    // Vérifier que la transmission existe
    const transmission = await this.prismaService.transmission.findUnique({
      where: { id },
    });

    if (!transmission) {
      throw new NotFoundException(`La transmission avec l'ID ${id} n'existe pas.`);
    }

    // Vérifier que la transmission est bien instanciée
    if (!transmission.isinstance) {
      throw new BadRequestException('Cette transmission n\'est pas instanciée. Impossible de la désinstancier.');
    }

    // Récupérer les informations de l'utilisateur
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, username: true },
    });

    // Déterminer le nouveau statut basé sur les propriétés de la transmission
    let nouveauStatut = 'Transmis'; // Statut par défaut

    if (transmission.isArchive) {
      nouveauStatut = 'Archivé';
    } else if (transmission.isinstance) {
      // Comme on va mettre isinstance à false, on ne devrait pas tomber ici après update
      // Mais on vérifie les autres conditions
      if (transmission.accuseReception) {
        nouveauStatut = 'Reçu';
      }
    } else if (transmission.accuseReception) {
      nouveauStatut = 'Reçu';
    }

    // Préparer les données de traitement
    const traitePar = (transmission.traitePar as any[]) || [];
    const nouveauTraitement = {
      userId: userId,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Utilisateur inconnu',
      action: 'Désinstancié',
      date: new Date(),
    };
    traitePar.push(nouveauTraitement);

    // Mettre à jour la transmission
    const transmissionDesinstanciee = await this.prismaService.transmission.update({
      where: { id },
      data: {
        isinstance: false,
        statut: nouveauStatut,
        traitePar: traitePar,
      },
    });

    return this.responseFormatter.success(
      transmissionDesinstanciee,
      'Désinstanciation transmission',
      `Transmission désinstanciée avec succès. Nouveau statut: ${nouveauStatut}.`,
    );
  }

  // ✉️ Accuser réception de plusieurs transmissions
  async accuserReceptionTransmissions(accuserReceptionDto: AccuserReceptionTransmissionsDto, userId: number) {
    const { transmissionIds } = accuserReceptionDto;

    // Récupérer toutes les transmissions
    const transmissions = await this.prismaService.transmission.findMany({
      where: {
        id: { in: transmissionIds },
      },
      include: { courrier: true },
    });

    // Vérifier que toutes les transmissions existent
    if (transmissions.length !== transmissionIds.length) {
      const foundIds = transmissions.map(t => t.id);
      const missingIds = transmissionIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Transmission(s) non trouvée(s) avec les IDs: ${missingIds.join(', ')}`
      );
    }

    // Vérifier que toutes les transmissions ont le même idService
    const idServices = [...new Set(transmissions.map(t => t.idService))];
    if (idServices.length > 1) {
      throw new BadRequestException(
        'Les transmissions sélectionnées n\'ont pas le même destinataire (service).',
      );
    }

    // Vérifier qu'il y a au moins un idService valide
    if (idServices.length === 0 || idServices[0] === null) {
      throw new BadRequestException(
        'Les transmissions sélectionnées n\'ont pas de service destinataire défini.',
      );
    }

    // Récupérer les informations de l'utilisateur
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, username: true },
    });

    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Utilisateur inconnu';

    // Mettre à jour chaque transmission individuellement pour ajouter traitePar
    for (const transmission of transmissions) {
      const traitePar = (transmission.traitePar as any[]) || [];
      const nouveauTraitement = {
        userId: userId,
        userName: userName,
        action: 'Accusé de réception',
        date: new Date(),
      };
      traitePar.push(nouveauTraitement);

      await this.prismaService.transmission.update({
        where: { id: transmission.id },
        data: {
          accuseReception: true,
          statut: 'Reçu',
          traitePar: traitePar,
        },
      });
    }

    // Récupérer les IDs des courriers uniques liés aux transmissions
    const courrierIds = [...new Set(
      transmissions
        .map(t => t.idCourrier)
        .filter(id => id !== null)
    )] as number[];

    // Mettre à jour le statut des courriers liés
    if (courrierIds.length > 0) {
      await this.prismaService.courrier.updateMany({
        where: {
          id: { in: courrierIds },
        },
        data: {
          statut: 'Reçu',
        },
      });
    }

    return this.responseFormatter.success(
      {
        transmissionsTraitees: transmissionIds.length,
        courriersTraites: courrierIds.length,
        idService: idServices[0],
      },
      'Accusé de réception',
      `${transmissionIds.length} transmission(s) accusée(s) réception avec succès. ${courrierIds.length} courrier(s) mis à jour.`,
    );
  }

  // 🔧 Parser structuresCopie (string JSON, tableau, ou liste séparée par virgules)
  private parseStructuresCopie(structuresCopie: unknown): number[] | undefined {
    if (structuresCopie === undefined || structuresCopie === null) {
      return undefined;
    }

    if (Array.isArray(structuresCopie)) {
      return structuresCopie;
    }

    if (typeof structuresCopie === 'string' || typeof structuresCopie === 'number') {
      const trimmed = String(structuresCopie).trim();
      if (trimmed === '') {
        return undefined;
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        // fallback: liste séparée par virgules ou points-virgules
        const parts = trimmed.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          const numbers = parts.map((p) => Number(p));
          if (numbers.every((n) => !Number.isNaN(n))) {
            return numbers;
          }
        }
        throw new BadRequestException('Le format JSON de structuresCopie est invalide.');
      }

      throw new BadRequestException('Le format JSON de structuresCopie est invalide.');
    }

    throw new BadRequestException('Le format JSON de structuresCopie est invalide.');
  }

  private parseDateRange(start?: string, end?: string, label?: string) {
    if (!start && !end) {
      return undefined;
    }

    // Si les deux dates sont fournies et identiques, traiter comme une date unique
    if (start && end && start === end) {
      const date = new Date(start);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`La date pour ${label || 'le filtre'} est invalide.`);
      }
      
      // Créer un range pour toute la journée
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      
      return { gte: startOfDay, lte: endOfDay };
    }

    const range: { gte?: Date; lte?: Date } = {};

    if (start) {
      const startDate = new Date(start);
      if (Number.isNaN(startDate.getTime())) {
        throw new BadRequestException(`La date de début pour ${label || 'le filtre'} est invalide.`);
      }
      range.gte = startDate;
    }

    if (end) {
      const endDate = new Date(end);
      if (Number.isNaN(endDate.getTime())) {
        throw new BadRequestException(`La date de fin pour ${label || 'le filtre'} est invalide.`);
      }
      range.lte = endDate;
    }

    return range;
  }

  private parseDateRangeOrSingle(start?: string, end?: string, label?: string) {
    if (start && !end) {
      return this.parseSingleDate(start, label);
    }

    if (!start && end) {
      return this.parseSingleDate(end, label);
    }

    return this.parseDateRange(start, end, label);
  }

  private parseSingleDate(dateValue: string, label?: string) {
    // Vérifier que la date est valide
    const testDate = new Date(dateValue);
    if (Number.isNaN(testDate.getTime())) {
      throw new BadRequestException(`La date pour ${label || 'le filtre'} est invalide.`);
    }

    // Retourner directement les chaînes ISO - Prisma gère la conversion automatiquement
    // Pas besoin de créer des objets Date qui introduisent des problèmes de timezone
    const start = `${dateValue}T00:00:00.000Z`;
    const end = `${dateValue}T23:59:59.999Z`;

    console.log(`🕐 parseSingleDate pour ${label}:`, {
      input: dateValue,
      gte: start,
      lte: end,
    });

    return { gte: start, lte: end };
  }
}
