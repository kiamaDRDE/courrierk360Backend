// src/courrier-interne/courrier-interne.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { MailerService } from '../mailer/mailer.service';
import { SmsService } from '../sms/sms.service';
import { CreateCourrierInterneDto } from './dto/create-courrier-interne.dto';
import { UpdateCourrierInterneDto } from './dto/update-courrier-interne.dto';
import { ListCourrierInterneQueryDto } from './dto/list-courrier-interne-query.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CourrierInterneService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly mailerService: MailerService,
    private readonly smsService: SmsService,
  ) {}

  private parseJsonIds(input?: string): number[] {
    if (!input) return [];
    const trimmed = String(input).trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0);
      }
    } catch {
      // fallback: comma-separated
    }
    return trimmed
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v) && v > 0);
  }

  private parsePiecesJointesData(input?: string): Array<{ intitule?: string }> {
    if (!input) return [];
    const trimmed = String(input).trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new BadRequestException('Le format JSON de piecesJointesData est invalide.');
    }
  }

  private ensureUploadDir(): string {
    const uploadDir = path.join(process.cwd(), 'public', 'reponses');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  private parseDateRange(start?: string, end?: string, label?: string) {
    if (!start && !end) {
      return undefined;
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

  private parseSingleDate(dateValue: string, label?: string) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`La date pour ${label || 'le filtre'} est invalide.`);
    }

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    return { gte: start, lte: end };
  }

  async create(
    userId: number,
    dto: CreateCourrierInterneDto,
    piecesJointes?: Express.Multer.File[],
  ) {
    if (!dto.classeCourrier || !dto.objet || !dto.typesCourrierIds || !dto.idService) {
      throw new BadRequestException(
        'Les champs classeCourrier, typesCourrierIds, objet et idService sont obligatoires.',
      );
    }

    // Récupérer le service de l'utilisateur connecté
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    // Vérifier que le service destinataire n'est pas le service de l'utilisateur
    if (dto.idService === user.idService) {
      throw new BadRequestException(
        'Vous ne pouvez pas créer un courrier interne à destination de votre propre service.',
      );
    }

    const typesCourrierIds = this.parseJsonIds(dto.typesCourrierIds);
    const idTransmissions = this.parseJsonIds(dto.idTransmissions);
    const piecesJointesInfo = this.parsePiecesJointesData(dto.piecesJointesData);

    const uploadDir = this.ensureUploadDir();

    const result = await this.prismaService.$transaction(async (prisma) => {
      // Récupérer les idCourrier depuis les transmissions si idTransmissions est fourni
      let courrierIds: number[] = [];
      if (idTransmissions.length > 0) {
        const transmissions = await prisma.transmission.findMany({
          where: {
            id: { in: idTransmissions },
            isDelete: false,
          },
          select: { idCourrier: true },
        });

        // Extraire les idCourrier non-null et uniques
        courrierIds = [...new Set(
          transmissions
            .map(t => t.idCourrier)
            .filter((id): id is number => id !== null)
        )];
      }

      const reponse = await prisma.reponse.create({
        data: {
          classeCourrier: dto.classeCourrier || null,
          typesCourrierIds: typesCourrierIds,
          idTransmission: idTransmissions,
          objet: dto.objet || null,
          commentairePublic: dto.commentairePublic || null,
          idService: dto.idService || null,
          typeTransmission: dto.typeTransmission || null,
          nombrePieceJointe: dto.nombrePieceJointe || (piecesJointes?.length ?? 0),
          idRedacteur: userId,
        },
      });

      // Créer les liaisons courrier-reponse automatiquement
      if (courrierIds.length > 0) {
        await prisma.courrierReponse.createMany({
          data: courrierIds.map(courrierId => ({
            courrierId: courrierId,
            reponseId: reponse.id,
          })),
          skipDuplicates: true, // Éviter les doublons
        });
      }

      const piecesJointesCreees: any[] = [];
      if (piecesJointes && piecesJointes.length > 0) {
        for (let i = 0; i < piecesJointes.length; i++) {
          const file = piecesJointes[i];
          const info = piecesJointesInfo[i] || {};
          const timestamp = Date.now();
          const fileName = `${timestamp}-${i}-${file.originalname}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, file.buffer);

          const pieceJointe = await prisma.pieceJointe.create({
            data: {
              nom: file.originalname,
              intitule: info.intitule || file.originalname,
              chemin: `reponses/${fileName}`,
              type: file.mimetype,
              idReponse: reponse.id,
              idParent: reponse.id,
              typeParent: 'reponse',
            },
          });
          piecesJointesCreees.push(pieceJointe);
        }
      }

      return { reponse, piecesJointes: piecesJointesCreees };
    });

    const response = this.responseFormatter.success(
      result,
      'Création réponse',
      `Réponse créée avec succès. ${result.piecesJointes.length} pièce(s) jointe(s) ajoutée(s).`,
    );

    const shouldNotify = dto.sendNotification === true;
    if (shouldNotify && dto.idService) {
      const [serviceUsers, serviceInfo] = await Promise.all([
        this.prismaService.user.findMany({
          where: { idService: dto.idService, isActive: true, isDelete: false },
          select: { email: true, phone: true, firstName: true, lastName: true },
        }),
        this.prismaService.service.findUnique({
          where: { id: dto.idService },
          select: { nom: true },
        }),
      ]);

      const dateCreation = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const emailPromises = serviceUsers
        .filter((u) => u.email)
        .map((u) =>
          this.mailerService.sendCourrierInterneNotification(
            u.email as string,
            u.firstName || '',
            u.lastName || '',
            serviceInfo?.nom || 'Service',
            {
              objet: dto.objet || null,
              classeCourrier: dto.classeCourrier || null,
              typeTransmission: dto.typeTransmission || null,
              commentaire: dto.commentairePublic || null,
              dateCreation,
            },
          ).catch((error) => {
            console.error(`Erreur envoi email courrier interne à ${u.email}:`, error);
            return false;
          }),
        );

      const phoneNumbers = serviceUsers
        .filter((u) => u.phone)
        .map((u) => u.phone) as string[];

      if (phoneNumbers.length > 0) {
        const messageSMS = `KIAMA S.A: Un courrier interne a été créé et transmis à votre service (${serviceInfo?.nom || 'Service'}).`;
        this.smsService.sendSameSmsToMultiple(phoneNumbers, messageSMS, false, true).catch((error) => {
          console.error('Erreur envoi SMS courrier interne:', error);
        });
      }

      if (emailPromises.length > 0) {
        await Promise.all(emailPromises);
      }
    }

    return response;
  }

  async update(
    id: number,
    dto: UpdateCourrierInterneDto,
    piecesJointes?: Express.Multer.File[],
  ) {
    const existing = await this.prismaService.reponse.findUnique({
      where: { id },
      include: { redacteur: { select: { idService: true } } },
    });
    
    if (!existing || existing.isDelete) {
      throw new NotFoundException(`Réponse avec l'ID ${id} introuvable.`);
    }

    // Si on met à jour le idService, vérifier qu'il n'est pas égal au service de l'utilisateur
    if (dto.idService !== undefined && existing.redacteur?.idService) {
      if (dto.idService === existing.redacteur.idService) {
        throw new BadRequestException(
          'Vous ne pouvez pas modifier le service destinataire pour qu\'il soit votre propre service.',
        );
      }
    }

    const typesCourrierIds = dto.typesCourrierIds !== undefined ? this.parseJsonIds(dto.typesCourrierIds) : undefined;
    const piecesJointesInfo = this.parsePiecesJointesData(dto.piecesJointesData);

    const uploadDir = this.ensureUploadDir();

    const result = await this.prismaService.$transaction(async (prisma) => {
      const reponse = await prisma.reponse.update({
        where: { id },
        data: {
          classeCourrier: dto.classeCourrier ?? undefined,
          typesCourrierIds: typesCourrierIds ?? undefined,
          objet: dto.objet ?? undefined,
          commentairePublic: dto.commentairePublic ?? undefined,
          idService: dto.idService ?? undefined,
          typeTransmission: dto.typeTransmission ?? undefined,
          nombrePieceJointe: dto.nombrePieceJointe ?? undefined,
        },
      });

      const piecesJointesCreees: any[] = [];
      if (piecesJointes && piecesJointes.length > 0) {
        for (let i = 0; i < piecesJointes.length; i++) {
          const file = piecesJointes[i];
          const info = piecesJointesInfo[i] || {};
          const timestamp = Date.now();
          const fileName = `${timestamp}-${i}-${file.originalname}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, file.buffer);

          const pieceJointe = await prisma.pieceJointe.create({
            data: {
              nom: file.originalname,
              intitule: info.intitule || file.originalname,
              chemin: `reponses/${fileName}`,
              type: file.mimetype,
              idReponse: reponse.id,
              idParent: reponse.id,
              typeParent: 'reponse',
            },
          });
          piecesJointesCreees.push(pieceJointe);
        }
      }

      return { reponse, piecesJointes: piecesJointesCreees };
    });

    const full = await this.prismaService.reponse.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, nom: true, sigle: true } },
        serviceDestinataire: { select: { id: true, nom: true, sigle: true } },
        redacteur: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        piecesJointes: { select: { id: true, nom: true, intitule: true, chemin: true, type: true } },
        courriers: {
          select: {
            courrier: {
              include: {
                provenance: true,
                typeCourrier: true,
                service: true,
                user: true,
                piecesJointes: true,
              },
            },
          },
        },
      },
    });

    return this.responseFormatter.success(
      {
        reponse: full,
        piecesJointesAjoutees: result.piecesJointes,
      },
      'Mise à jour réponse',
      `Réponse mise à jour avec succès. ${result.piecesJointes.length} pièce(s) jointe(s) ajoutée(s).`,
    );
  }

  async findAll(userId: number, query?: ListCourrierInterneQueryDto) {
    const filters = query || {};
    const where: any = { isDelete: false, idRedacteur: userId };
    const courrierWhere: any = {};

    const dateArriveeRange = this.parseDateRange(
      filters.dateArriveeDebut,
      filters.dateArriveeFin,
      'dateArrivee',
    );
    if (dateArriveeRange) {
      courrierWhere.dateArrivee = dateArriveeRange;
    }

    if (filters.dateEnregistrement) {
      courrierWhere.dateEnregistrement = this.parseSingleDate(filters.dateEnregistrement, 'dateEnregistrement');
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

    if (filters.statut) {
      courrierWhere.statut = filters.statut;
    }

    if (filters.serviceId) {
      courrierWhere.idService = filters.serviceId;
    }

    if (Object.keys(courrierWhere).length > 0) {
      where.courriers = { some: { courrier: courrierWhere } };
    }

    const search = filters.search?.trim();
    if (search) {
      const numericSearch = Number(search);
      const orFilters: any[] = [
        { objet: { contains: search } },
        { commentairePublic: { contains: search } },
        { commentaireInterne: { contains: search } },
        { classeCourrier: { contains: search } },
        { typeTransmission: { contains: search } },
        { courriers: { some: { courrier: { numero: { contains: search } } } } },
        { courriers: { some: { courrier: { reference: { contains: search } } } } },
        { courriers: { some: { courrier: { objet: { contains: search } } } } },
        { courriers: { some: { courrier: { categorie: { contains: search } } } } },
        { courriers: { some: { courrier: { priorite: { contains: search } } } } },
        { courriers: { some: { courrier: { provenance: { is: { nom: { contains: search } } } } } } },
      ];

      if (!Number.isNaN(numericSearch)) {
        orFilters.push(
          { id: numericSearch },
          { idService: numericSearch },
          { idServiceDestinataire: numericSearch },
          { courriers: { some: { courrier: { id: numericSearch } } } },
          { courriers: { some: { courrier: { idService: numericSearch } } } },
          { courriers: { some: { courrier: { idProvenance: numericSearch } } } },
          { courriers: { some: { courrier: { idTypeCourrier: numericSearch } } } },
        );
      }

      where.OR = orFilters;
    }

    // Compter le total avant pagination
    const total = await this.prismaService.reponse.count({ where });

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const reponses = await this.prismaService.reponse.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, nom: true, sigle: true } },
        serviceDestinataire: { select: { id: true, nom: true, sigle: true } },
        redacteur: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        piecesJointes: { select: { id: true, nom: true, intitule: true, chemin: true, type: true } },
        courriers: {
          select: {
            courrier: {
              include: {
                provenance: true,
                typeCourrier: true,
                service: true,
                user: true,
                piecesJointes: true,
              },
            },
          },
        },
      },
    });

    const courrierIds = reponses
      .flatMap((r) => r.courriers.map((c) => c.courrier?.id))
      .filter((id): id is number => typeof id === 'number');

    const latestByCourrier = new Map<
      number,
      { statut: string | null; service: { id: number; nom: string; sigle: string | null } | null }
    >();

    if (courrierIds.length > 0 && (filters.dernierStatut || filters.dernierServiceId)) {
      const latestAll = await this.prismaService.transmission.findMany({
        where: { idCourrier: { in: courrierIds } },
        orderBy: { createdAt: 'desc' },
        select: {
          idCourrier: true,
          statut: true,
          service: { select: { id: true, nom: true, sigle: true } },
        },
      });

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
    }

    const typeCourrierIds = Array.from(
      new Set(
        reponses
          .flatMap((r) => (Array.isArray(r.typesCourrierIds) ? r.typesCourrierIds : []))
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id)),
      ),
    );

    const typeCourrierMap = new Map<number, { id: number; nom: string; type: string }>();
    if (typeCourrierIds.length > 0) {
      const types = await this.prismaService.typeCourrier.findMany({
        where: { id: { in: typeCourrierIds } },
        select: { id: true, nom: true, type: true },
      });

      for (const t of types) {
        typeCourrierMap.set(t.id, { id: t.id, nom: t.nom, type: t.type });
      }
    }

    // Récupérer les courriers à partir des idTransmission
    const allTransmissionIds = reponses
      .flatMap((r) => (Array.isArray(r.idTransmission) ? r.idTransmission : []))
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    const transmissionsMap = new Map<number, number>(); // transmissionId -> courrierId
    if (allTransmissionIds.length > 0) {
      const transmissions = await this.prismaService.transmission.findMany({
        where: { id: { in: allTransmissionIds }, isDelete: false },
        select: { id: true, idCourrier: true },
      });

      for (const t of transmissions) {
        if (t.idCourrier) {
          transmissionsMap.set(t.id, t.idCourrier);
        }
      }
    }

    // Récupérer tous les courriers liés aux transmissions
    const courrierIdsFromTransmissions = Array.from(new Set(transmissionsMap.values()));
    const courriersFromTransmissions = new Map();
    if (courrierIdsFromTransmissions.length > 0) {
      const courriers = await this.prismaService.courrier.findMany({
        where: { id: { in: courrierIdsFromTransmissions }, isDelete: false },
        include: {
          provenance: true,
          typeCourrier: true,
          service: true,
          user: true,
          piecesJointes: true,
        },
      });

      for (const c of courriers) {
        courriersFromTransmissions.set(c.id, c);
      }
    }

    let data = reponses.map((reponse) => {
      const redacteurFullName = reponse.redacteur
        ? `${reponse.redacteur.firstName || ''} ${reponse.redacteur.lastName || ''}`.trim() || reponse.redacteur.username
        : null;

      // Courriers de la table de jonction courrier_reponse
      const courriersFromRelation = reponse.courriers
        .map((item) => item.courrier)
        .filter((c): c is NonNullable<typeof reponse.courriers[number]['courrier']> => Boolean(c));

      // Courriers des transmissions
      const transmissionIds = Array.isArray(reponse.idTransmission) ? reponse.idTransmission : [];
      const courriersFromTransmissionsForThisReponse = transmissionIds
        .map((tId) => transmissionsMap.get(Number(tId)))
        .filter((cId): cId is number => cId !== undefined)
        .map((cId) => courriersFromTransmissions.get(cId))
        .filter(Boolean);

      // Fusionner les deux sources de courriers et éliminer les doublons
      const allCourriers = [...courriersFromRelation];
      const existingCourrierIds = new Set(courriersFromRelation.map((c) => c.id));
      for (const c of courriersFromTransmissionsForThisReponse) {
        if (!existingCourrierIds.has(c.id)) {
          allCourriers.push(c);
        }
      }

      // Formater les courriers pour retourner uniquement les champs nécessaires
      const courriersFormates = allCourriers.map((c) => ({
        id: c.id,
        numero: c.numero,
        reference: c.reference,
        objet: c.objet,
        dateArrivee: c.dateArrivee,
        dateEnregistrement: c.dateEnregistrement,
        categorie: c.categorie,
        priorite: c.priorite,
        typeCourrier: c.typeCourrier ? {
          id: c.typeCourrier.id,
          nom: c.typeCourrier.nom,
          type: c.typeCourrier.type,
          classeCourrier: c.typeCourrier.classeCourrier,
        } : null,
        provenance: c.provenance ? {
          id: c.provenance.id,
          nom: c.provenance.nom,
          telephone: c.provenance.telephone,
          email: c.provenance.email,
          type: c.provenance.type,
        } : null,
      }));

      const typesCourrier = (Array.isArray(reponse.typesCourrierIds) ? reponse.typesCourrierIds : [])
        .map((id) => typeCourrierMap.get(Number(id)))
        .filter(Boolean);

      return {
        id: reponse.id,
        objet: reponse.objet,
        commentairePublic: reponse.commentairePublic,
        classeCourrier: reponse.classeCourrier,
        typeTransmission: reponse.typeTransmission,
        dateReponse: reponse.dateReponse,
        createdAt: reponse.createdAt,
        courriers: courriersFormates,
        typesCourrier,
        idTransmission: reponse.idTransmission || [],
        service: reponse.service || null,
        serviceDestinataire: reponse.serviceDestinataire || null,
        redacteur: reponse.redacteur
          ? {
              id: reponse.redacteur.id,
              fullName: redacteurFullName,
              email: reponse.redacteur.email,
            }
          : null,
        piecesJointes: reponse.piecesJointes || [],
      };
    });

    if (filters.dernierStatut || filters.dernierServiceId) {
      data = data.filter((item) => {
        if (!item.courriers || item.courriers.length === 0) return false;

        return item.courriers.some((courrier) => {
          if (!courrier?.id) return false;
          const last = latestByCourrier.get(courrier.id);
          if (!last) return false;

          if (filters.dernierStatut && last.statut !== filters.dernierStatut) {
            return false;
          }

          if (filters.dernierServiceId && last.service?.id !== filters.dernierServiceId) {
            return false;
          }

          return true;
        });
      });
    }

    const totalPages = Math.ceil(total / limit);

    return this.responseFormatter.success(
      {
        items: data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      'Courriers internes envoyés', 
      `${data.length} courrier(s) interne(s) sur ${total} envoyé(s) par vous récupéré(s) avec succès (page ${page}/${totalPages}).`
    );
  }

  async findRecusByService(userId: number, query?: ListCourrierInterneQueryDto) {
    // Récupérer le service de l'utilisateur
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    if (!user.idService) {
      throw new BadRequestException('L\'utilisateur connecté doit avoir un service assigné.');
    }

    const serviceId = user.idService;
    const filters = query || {};
    const where: any = { isDelete: false, idService: serviceId };
    const courrierWhere: any = {};

    const dateArriveeRange = this.parseDateRange(
      filters.dateArriveeDebut,
      filters.dateArriveeFin,
      'dateArrivee',
    );
    if (dateArriveeRange) {
      courrierWhere.dateArrivee = dateArriveeRange;
    }

    if (filters.dateEnregistrement) {
      courrierWhere.dateEnregistrement = this.parseSingleDate(filters.dateEnregistrement, 'dateEnregistrement');
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

    if (filters.statut) {
      courrierWhere.statut = filters.statut;
    }

    if (filters.serviceId) {
      courrierWhere.idService = filters.serviceId;
    }

    if (Object.keys(courrierWhere).length > 0) {
      where.courriers = { some: { courrier: courrierWhere } };
    }

    const search = filters.search?.trim();
    if (search) {
      const numericSearch = Number(search);
      const orFilters: any[] = [
        { objet: { contains: search } },
        { commentairePublic: { contains: search } },
        { commentaireInterne: { contains: search } },
        { classeCourrier: { contains: search } },
        { typeTransmission: { contains: search } },
        { courriers: { some: { courrier: { numero: { contains: search } } } } },
        { courriers: { some: { courrier: { reference: { contains: search } } } } },
        { courriers: { some: { courrier: { objet: { contains: search } } } } },
        { courriers: { some: { courrier: { categorie: { contains: search } } } } },
        { courriers: { some: { courrier: { priorite: { contains: search } } } } },
        { courriers: { some: { courrier: { provenance: { is: { nom: { contains: search } } } } } } },
      ];

      if (!Number.isNaN(numericSearch)) {
        orFilters.push(
          { id: numericSearch },
          { idService: numericSearch },
          { idServiceDestinataire: numericSearch },
          { courriers: { some: { courrier: { id: numericSearch } } } },
          { courriers: { some: { courrier: { idService: numericSearch } } } },
          { courriers: { some: { courrier: { idProvenance: numericSearch } } } },
          { courriers: { some: { courrier: { idTypeCourrier: numericSearch } } } },
        );
      }

      where.OR = orFilters;
    }

    // Compter le total avant pagination
    const totalRecus = await this.prismaService.reponse.count({ where });

    // Pagination
    const pageRecus = filters.page || 1;
    const limitRecus = filters.limit || 10;
    const skipRecus = (pageRecus - 1) * limitRecus;

    const reponses = await this.prismaService.reponse.findMany({
      where,
      skip: skipRecus,
      take: limitRecus,
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, nom: true, sigle: true } },
        serviceDestinataire: { select: { id: true, nom: true, sigle: true } },
        redacteur: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        piecesJointes: { select: { id: true, nom: true, intitule: true, chemin: true, type: true } },
        courriers: {
          select: {
            courrier: {
              include: {
                provenance: true,
                typeCourrier: true,
              },
            },
          },
        },
      },
    });

    // Récupérer les courriers à partir des idTransmission
    const allTransmissionIdsRecus = reponses
      .flatMap((r) => (Array.isArray(r.idTransmission) ? r.idTransmission : []))
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    const transmissionsMapRecus = new Map<number, number>(); // transmissionId -> courrierId
    if (allTransmissionIdsRecus.length > 0) {
      const transmissions = await this.prismaService.transmission.findMany({
        where: { id: { in: allTransmissionIdsRecus }, isDelete: false },
        select: { id: true, idCourrier: true },
      });

      for (const t of transmissions) {
        if (t.idCourrier) {
          transmissionsMapRecus.set(t.id, t.idCourrier);
        }
      }
    }

    // Récupérer tous les courriers liés aux transmissions
    const courrierIdsFromTransmissionsRecus = Array.from(new Set(transmissionsMapRecus.values()));
    const courriersFromTransmissionsRecus = new Map();
    if (courrierIdsFromTransmissionsRecus.length > 0) {
      const courriers = await this.prismaService.courrier.findMany({
        where: { id: { in: courrierIdsFromTransmissionsRecus }, isDelete: false },
        include: {
          provenance: true,
          typeCourrier: true,
        },
      });

      for (const c of courriers) {
        courriersFromTransmissionsRecus.set(c.id, c);
      }
    }

    let data = reponses.map((r) => {
      // Courriers de la table de jonction courrier_reponse
      const courriersFromRelation = r.courriers.map((cr) => cr.courrier).filter(Boolean);

      // Courriers des transmissions
      const transmissionIds = Array.isArray(r.idTransmission) ? r.idTransmission : [];
      const courriersFromTransmissionsForThisReponse = transmissionIds
        .map((tId) => transmissionsMapRecus.get(Number(tId)))
        .filter((cId): cId is number => cId !== undefined)
        .map((cId) => courriersFromTransmissionsRecus.get(cId))
        .filter(Boolean);

      // Fusionner les deux sources de courriers et éliminer les doublons
      const allCourriers = [...courriersFromRelation];
      const existingCourrierIds = new Set(courriersFromRelation.map((c) => c?.id).filter(Boolean));
      for (const c of courriersFromTransmissionsForThisReponse) {
        if (!existingCourrierIds.has(c.id)) {
          allCourriers.push(c);
        }
      }

      // Formater les courriers pour retourner uniquement les champs nécessaires
      const courriersFormates = allCourriers
        .filter((c) => c !== null && c !== undefined)
        .map((c) => ({
          id: c.id,
          numero: c.numero,
          reference: c.reference,
          objet: c.objet,
          dateArrivee: c.dateArrivee,
          dateEnregistrement: c.dateEnregistrement,
          categorie: c.categorie,
          priorite: c.priorite,
          typeCourrier: c.typeCourrier ? {
            id: c.typeCourrier.id,
            nom: c.typeCourrier.nom,
            type: c.typeCourrier.type,
            classeCourrier: c.typeCourrier.classeCourrier,
          } : null,
          provenance: c.provenance ? {
            id: c.provenance.id,
            nom: c.provenance.nom,
            telephone: c.provenance.telephone,
            email: c.provenance.email,
            type: c.provenance.type,
          } : null,
        }));

      return {
        ...r,
        courriers: courriersFormates,
      };
    });

    if (filters.dernierStatut || filters.dernierServiceId) {
      const courrierIds = data.flatMap((r) => r.courriers.map((c) => c.id));
      const latestByCourrier = new Map<number, { statut: string | null; service: any }>();

      const latestAll = await this.prismaService.transmission.findMany({
        where: {
          idCourrier: { in: courrierIds },
          isDelete: false,
        },
        orderBy: { dateReception: 'desc' },
        select: {
          idCourrier: true,
          statut: true,
          service: { select: { id: true, nom: true, sigle: true } },
        },
      });

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

      data = data.filter((item) => {
        if (!item.courriers || item.courriers.length === 0) return false;

        return item.courriers.some((courrier) => {
          if (!courrier?.id) return false;
          const last = latestByCourrier.get(courrier.id);
          if (!last) return false;

          if (filters.dernierStatut && last.statut !== filters.dernierStatut) {
            return false;
          }

          if (filters.dernierServiceId && last.service?.id !== filters.dernierServiceId) {
            return false;
          }

          return true;
        });
      });
    }

    const totalPagesRecus = Math.ceil(totalRecus / limitRecus);

    return this.responseFormatter.success(
      {
        items: data,
        pagination: {
          total: totalRecus,
          page: pageRecus,
          limit: limitRecus,
          totalPages: totalPagesRecus,
        },
      },
      'Courriers internes reçus', 
      `${data.length} courrier(s) interne(s) sur ${totalRecus} reçu(s) par votre service récupéré(s) avec succès (page ${pageRecus}/${totalPagesRecus}).`
    );
  }

  async findOne(id: number) {
    const reponse = await this.prismaService.reponse.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, nom: true, sigle: true } },
        serviceDestinataire: { select: { id: true, nom: true, sigle: true } },
        redacteur: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        piecesJointes: { select: { id: true, nom: true, intitule: true, chemin: true, type: true } },
        courriers: {
          select: {
            courrier: {
              include: {
                provenance: true,
                typeCourrier: true,
                service: true,
                user: true,
                piecesJointes: true,
              },
            },
          },
        },
      },
    });

    if (!reponse || reponse.isDelete) {
      throw new NotFoundException(`Réponse avec l'ID ${id} introuvable.`);
    }

    const typeCourrierIds = Array.isArray(reponse.typesCourrierIds)
      ? reponse.typesCourrierIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      : [];

    const typesCourrier = typeCourrierIds.length > 0
      ? await this.prismaService.typeCourrier.findMany({
          where: { id: { in: typeCourrierIds } },
          select: { id: true, nom: true, type: true },
        })
      : [];

    const redacteurFullName = reponse.redacteur
      ? `${reponse.redacteur.firstName || ''} ${reponse.redacteur.lastName || ''}`.trim() || reponse.redacteur.username
      : null;

    const courriers = reponse.courriers
      .map((item) => item.courrier)
      .filter((c): c is NonNullable<typeof reponse.courriers[number]['courrier']> => Boolean(c));

    const payload = {
      id: reponse.id,
      objet: reponse.objet,
      commentairePublic: reponse.commentairePublic,
      classeCourrier: reponse.classeCourrier,
      typeTransmission: reponse.typeTransmission,
      dateReponse: reponse.dateReponse,
      createdAt: reponse.createdAt,
      courriers,
      typesCourrier,
      idTransmission: reponse.idTransmission || [],
      serviceDestinataire: reponse.serviceDestinataire || null,
      redacteur: reponse.redacteur
        ? {
            id: reponse.redacteur.id,
            fullName: redacteurFullName,
            email: reponse.redacteur.email,
          }
        : null,
      piecesJointes: reponse.piecesJointes || [],
    };

    return this.responseFormatter.success(payload, 'Détail réponse', 'Réponse récupérée avec succès.');
  }

  async delete(id: number) {
    const reponse = await this.prismaService.reponse.findUnique({ where: { id } });
    if (!reponse) {
      throw new NotFoundException(`Réponse avec l'ID ${id} introuvable.`);
    }

    await this.prismaService.$transaction(async (prisma) => {
      await prisma.courrierReponse.deleteMany({ where: { reponseId: id } });
      await prisma.pieceJointe.updateMany({
        where: { idReponse: id },
        data: { idReponse: null, idParent: null, typeParent: null },
      });
      await prisma.reponse.update({ where: { id }, data: { isDelete: true } });
    });

    return this.responseFormatter.success([], 'Suppression réponse', 'Réponse supprimée (logique) avec succès.');
  }

  async deletePermanent(id: number) {
    const reponse = await this.prismaService.reponse.findUnique({ where: { id } });
    if (!reponse) {
      throw new NotFoundException(`Réponse avec l'ID ${id} introuvable.`);
    }

    const pieces = await this.prismaService.pieceJointe.findMany({
      where: { idReponse: id },
      select: { id: true, chemin: true },
    });

    await this.prismaService.$transaction(async (prisma) => {
      await prisma.courrierReponse.deleteMany({ where: { reponseId: id } });
      await prisma.pieceJointe.deleteMany({ where: { idReponse: id } });
      await prisma.reponse.delete({ where: { id } });
    });

    for (const piece of pieces) {
      try {
        const filePath = path.join(process.cwd(), 'public', piece.chemin);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // ignore file delete errors
      }
    }

    return this.responseFormatter.success([], 'Suppression réponse', 'Réponse supprimée définitivement avec succès.');
  }
}
