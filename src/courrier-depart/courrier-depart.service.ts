// src/courrier-depart/courrier-depart.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { CreateCourrierDepartDto } from './dto/create-courrier-depart.dto';
import { ListCourrierDepartQueryDto } from './dto/list-courrier-depart-query.dto';
import { PaginationService } from '../common/pagination.service';
import { MailerService } from '../mailer/mailer.service';
import { SmsService } from '../sms/sms.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CourrierDepartService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly mailerService: MailerService,
    private readonly smsService: SmsService,
  ) {}

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
    const uploadDir = path.join(process.cwd(), 'public', 'courrier-depart');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  // 📋 Liste des courriers départ
  async list(query?: ListCourrierDepartQueryDto) {
    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);

    const where: any = { isDelete: false };
    const courrierFilters: any = {};

    const dateArriveeRange = this.parseDateRange(
      filters.dateArriveeDebut,
      filters.dateArriveeFin,
      'dateArrivee',
    );
    if (dateArriveeRange) {
      courrierFilters.dateArrivee = dateArriveeRange;
    }

    const dateEnregistrementRange = this.parseDateRange(
      filters.dateEnregistrementDebut,
      filters.dateEnregistrementFin,
      'dateEnregistrement',
    );
    if (dateEnregistrementRange) {
      courrierFilters.dateEnregistrement = dateEnregistrementRange;
    }

    if (filters.priorite) {
      courrierFilters.priorite = filters.priorite;
    }

    if (filters.categorie) {
      where.categorie = filters.categorie;
    } else if (filters.categorieId) {
      const categorie = await this.prismaService.categories.findUnique({
        where: { id: filters.categorieId },
        select: { nom: true },
      });

      if (!categorie) {
        throw new NotFoundException(`La catégorie avec l'ID ${filters.categorieId} n'existe pas.`);
      }

      where.categorie = categorie.nom;
    }

    if (filters.typeCourrierId) {
      courrierFilters.idTypeCourrier = filters.typeCourrierId;
    }

    if (filters.statut) {
      courrierFilters.statut = filters.statut;
    }

    if (filters.serviceId) {
      courrierFilters.idService = filters.serviceId;
    }

    if (filters.provenanceId) {
      courrierFilters.idProvenance = filters.provenanceId;
    }

    if (Object.keys(courrierFilters).length > 0) {
      where.courrier = { is: courrierFilters };
    }

    const search = filters.search?.trim();
    if (search) {
      const numericSearch = Number(search);
      const orFilters: any[] = [
        { numeroReference: { contains: search } },
        { numeroActe: { contains: search } },
        { commentaire: { contains: search } },
        { categorie: { contains: search } },
        { classeCourrier: { contains: search } },
        { typeCourrier: { contains: search } },
        { email: { contains: search } },
        { numeroTelephone: { contains: search } },
        { destinataire: { is: { nom: { contains: search } } } },
        { destinataire: { is: { email: { contains: search } } } },
        { destinataire: { is: { telephone: { contains: search } } } },
        { signataire: { is: { username: { contains: search } } } },
        { signataire: { is: { firstName: { contains: search } } } },
        { signataire: { is: { lastName: { contains: search } } } },
        { courrier: { is: { numero: { contains: search } } } },
        { courrier: { is: { reference: { contains: search } } } },
        { courrier: { is: { objet: { contains: search } } } },
        { courrier: { is: { provenance: { is: { nom: { contains: search } } } } } },
      ];

      if (!Number.isNaN(numericSearch)) {
        orFilters.push(
          { id: numericSearch },
          { idDestinataire: numericSearch },
          { idCourrier: numericSearch },
          { idSignataire: numericSearch },
        );
      }

      where.OR = orFilters;
    }

    const includePayload = {
      piecesJointes: { select: { id: true, nom: true, chemin: true, type: true } },
      courrier: { select: { id: true } },
    } as const;

    const requiresLastFilters = Boolean(filters.dernierStatut || filters.dernierServiceId);

    const [courriersDeparts, totalBeforeLastFilters] = await Promise.all([
      this.prismaService.courrierDepart.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: includePayload,
        ...(requiresLastFilters ? {} : { skip, take: limit }),
      }),
      requiresLastFilters
        ? Promise.resolve(0)
        : this.prismaService.courrierDepart.count({ where }),
    ]);

    const courrierIds = courriersDeparts
      .map((c) => c.courrier?.id)
      .filter((id): id is number => typeof id === 'number');

    const latestByCourrier = new Map<
      number,
      { statut: string | null; service: { id: number; nom: string; sigle: string | null } | null }
    >();

    if (courrierIds.length > 0) {
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

    let data = courriersDeparts.map((courrierDepart) => ({
      id: courrierDepart.id,
      numeroReference: courrierDepart.numeroReference,
      classeCourrier: courrierDepart.classeCourrier,
      categorie: courrierDepart.categorie,
      document: courrierDepart.document,
      nombrePieceJointe: courrierDepart.nombrePieceJointe,
      isArchive: courrierDepart.isArchive,
      provenancesCopie: courrierDepart.provenancesCopie || [],
      piecesJointes: courrierDepart.piecesJointes || [],
      courrierId: courrierDepart.courrier?.id || null,
    }));

    if (filters.dernierStatut || filters.dernierServiceId) {
      data = data.filter((item) => {
        if (!item.courrierId) return false;
        const last = latestByCourrier.get(item.courrierId);
        if (!last) return false;

        if (filters.dernierStatut && last.statut !== filters.dernierStatut) {
          return false;
        }

        if (filters.dernierServiceId && last.service?.id !== filters.dernierServiceId) {
          return false;
        }

        return true;
      });
    }

    const totalItems = requiresLastFilters ? data.length : totalBeforeLastFilters;
    const paginatedItems = (requiresLastFilters ? data.slice(skip, skip + limit) : data).map(
      ({ courrierId, ...rest }) => rest,
    );

    const paginatedResult = this.paginationService.createPaginatedResult(
      paginatedItems,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des courriers départ',
      `${totalItems} courrier(s) départ récupéré(s) avec succès.`,
    );
  }

  // 🔍 Détails d'un courrier départ par ID
  async findOne(id: number) {
    const courrierDepart = await this.prismaService.courrierDepart.findUnique({
      where: { id },
      include: {
        piecesJointes: { select: { id: true, nom: true, intitule: true, chemin: true, type: true, createdAt: true } },
      },
    });

    if (!courrierDepart || courrierDepart.isDelete) {
      throw new NotFoundException(`Courrier départ avec l'ID ${id} introuvable.`);
    }

    const response = {
      id: courrierDepart.id,
      numeroReference: courrierDepart.numeroReference,
      dateSignature: courrierDepart.dateSignature,
      typeCourrier: courrierDepart.typeCourrier,
      commentaire: courrierDepart.commentaire,
      classeCourrier: courrierDepart.classeCourrier,
      categorie: courrierDepart.categorie,
      document: courrierDepart.document,
      nombrePieceJointe: courrierDepart.nombrePieceJointe,
      provenancesCopie: courrierDepart.provenancesCopie || [],
      piecesJointes: courrierDepart.piecesJointes || [],
      isDelete: courrierDepart.isDelete,
      createdAt: courrierDepart.createdAt,
      updatedAt: courrierDepart.updatedAt,
    };

    return this.responseFormatter.success(
      response,
      'Détails courrier départ',
      'Courrier départ récupéré avec succès.',
    );
  }

  // 📦 Détails de plusieurs courriers départ
  async findManyByIds(ids: number[]) {
    const cleanIds = (ids || []).filter((id) => typeof id === 'number' && !Number.isNaN(id));
    if (cleanIds.length === 0) {
      throw new BadRequestException('La liste des IDs est invalide.');
    }

    const courriersDeparts = await this.prismaService.courrierDepart.findMany({
      where: { id: { in: cleanIds }, isDelete: false },
      include: {
        destinataire: { select: { id: true, nom: true, adresse: true, telephone: true, email: true } },
        signataire: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, username: true } },
        piecesJointes: { select: { id: true, nom: true, intitule: true, chemin: true, type: true, createdAt: true } },
        courrier: {
          select: {
            id: true,
            numero: true,
            reference: true,
            objet: true,
            commentaire: true,
            dateArrivee: true,
            dateEnregistrement: true,
            priorite: true,
            statut: true,
            isConfidentiel: true,
            provenance: { select: { id: true, nom: true } },
            typeCourrier: { select: { nom: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const fallbackReferences = courriersDeparts
      .filter((c) => !c.courrier && c.numeroReference)
      .map((c) => c.numeroReference as string);

    const courrierByReference = new Map<string, any>();
    if (fallbackReferences.length > 0) {
      const courriers = await this.prismaService.courrier.findMany({
        where: {
          OR: [
            { reference: { in: fallbackReferences } },
            { numero: { in: fallbackReferences } },
          ],
        },
        select: {
          id: true,
          numero: true,
          reference: true,
          objet: true,
          commentaire: true,
          dateArrivee: true,
          dateEnregistrement: true,
          priorite: true,
          statut: true,
          isConfidentiel: true,
          provenance: { select: { id: true, nom: true } },
          typeCourrier: { select: { nom: true } },
        },
      });

      for (const courrier of courriers) {
        if (courrier.reference) {
          courrierByReference.set(courrier.reference, courrier);
        }
        if (courrier.numero) {
          courrierByReference.set(courrier.numero, courrier);
        }
      }
    }

    const data = courriersDeparts.map((courrierDepart) => {
      const signataireFullName = courrierDepart.signataire
        ? `${courrierDepart.signataire.firstName || ''} ${courrierDepart.signataire.lastName || ''}`.trim() || courrierDepart.signataire.username
        : null;

      const courrierLinked =
        courrierDepart.courrier ||
        (courrierDepart.numeroReference
          ? courrierByReference.get(courrierDepart.numeroReference)
          : null);

      return {
        id: courrierDepart.id,
        numeroReference: courrierDepart.numeroReference,
        numeroActe: courrierDepart.numeroActe,
        dateSignature: courrierDepart.dateSignature,
        typeCourrier: courrierDepart.typeCourrier,
        commentaire: courrierDepart.commentaire,
        classeCourrier: courrierDepart.classeCourrier,
        categorie: courrierDepart.categorie,
        document: courrierDepart.document,
        email: courrierDepart.email,
        numeroTelephone: courrierDepart.numeroTelephone,
        provenancesCopie: courrierDepart.provenancesCopie || [],
        piecesJointes: courrierDepart.piecesJointes || [],
        destinataire: courrierDepart.destinataire,
        signataire: courrierDepart.signataire
          ? {
              id: courrierDepart.signataire.id,
              fullName: signataireFullName,
              email: courrierDepart.signataire.email,
              phone: courrierDepart.signataire.phone,
            }
          : null,
        courrier: courrierLinked
          ? {
              id: courrierLinked.id,
              numero: courrierLinked.numero,
              reference: courrierLinked.reference,
              objet: courrierLinked.objet,
              commentaire: courrierLinked.commentaire,
              dateArrivee: courrierLinked.dateArrivee,
              dateEnregistrement: courrierLinked.dateEnregistrement,
              typeCourrier: courrierLinked.typeCourrier?.nom || null,
              provenance: courrierLinked.provenance || null,
              priorite: courrierLinked.priorite,
              statut: courrierLinked.statut,
              isConfidentiel: courrierLinked.isConfidentiel,
            }
          : null,
        isDelete: courrierDepart.isDelete,
        createdAt: courrierDepart.createdAt,
        updatedAt: courrierDepart.updatedAt,
      };
    });

    return this.responseFormatter.success(
      data,
      'Détails courriers départ',
      'Courriers départ récupérés avec succès.',
    );
  }

  async create(
    dto: CreateCourrierDepartDto,
    document?: Express.Multer.File,
    piecesJointes?: Express.Multer.File[],
  ) {
    if (!document || !dto.categorie || !dto.classeCourrier || !dto.typeCourrier || !dto.dateSignature || !dto.idSignataire) {
      throw new BadRequestException(
        'Les champs document, categorie, classeCourrier, typeCourrier, dateSignature et idSignataire sont obligatoires.',
      );
    }
    const uploadDir = this.ensureUploadDir();

    let documentPath: string | null = null;
    if (document) {
      const timestamp = Date.now();
      const documentFileName = `${timestamp}-${document.originalname}`;
      const documentFullPath = path.join(uploadDir, documentFileName);
      fs.writeFileSync(documentFullPath, document.buffer);
      documentPath = `courrier-depart/${documentFileName}`;
    }

    const piecesJointesInfo = this.parsePiecesJointesData(dto.piecesJointesData);

    const result = await this.prismaService.$transaction(async (prisma) => {
      const courrierDepart = await prisma.courrierDepart.create({
        data: {
          document: documentPath,
          numeroReference: dto.numeroReference || null,
          categorie: dto.categorie || null,
          idSignataire: dto.idSignataire || null,
          classeCourrier: dto.classeCourrier || null,
          typeCourrier: dto.typeCourrier || null,
          dateSignature: dto.dateSignature ? new Date(dto.dateSignature) : null,
          commentaire: dto.commentaire || null,
          email: dto.email || null,
          numeroTelephone: dto.numeroTelephone || null,
          nombrePieceJointe: dto.nombrePieceJointe || (piecesJointes?.length ?? 0),
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
              chemin: `courrier-depart/${fileName}`,
              type: file.mimetype,
              idCourrierDepart: courrierDepart.id,
              idParent: courrierDepart.id,
              typeParent: 'courrier_depart',
            },
          });
          piecesJointesCreees.push(pieceJointe);
        }
      }

      return { courrierDepart, piecesJointes: piecesJointesCreees };
    });

    const shouldNotify = dto.sendNotification === true;
    if (shouldNotify) {
      const subject = `Courrier départ - ${result.courrierDepart.numeroReference || 'Sans référence'}`;
      const message = `Votre courrier départ a été enregistré. Référence: ${result.courrierDepart.numeroReference || 'N/A'}.`;

      if (dto.email) {
        this.mailerService
          .sendCourrierDepartNotification(dto.email, subject, message, {
            numeroReference: result.courrierDepart.numeroReference || '',
            categorie: result.courrierDepart.categorie || '',
            classeCourrier: result.courrierDepart.classeCourrier || '',
            typeCourrier: result.courrierDepart.typeCourrier || '',
            dateSignature: result.courrierDepart.dateSignature,
          })
          .catch(() => undefined);
      }

      if (dto.numeroTelephone) {
        this.smsService.sendSms(dto.numeroTelephone, message, true).catch(() => undefined);
      }
    }

    return this.responseFormatter.success(
      result,
      'Création courrier départ',
      `Courrier départ créé avec succès. ${result.piecesJointes.length} pièce(s) jointe(s) ajoutée(s).`,
    );
  }

  async update(
    id: number,
    dto: CreateCourrierDepartDto,
    document?: Express.Multer.File,
    piecesJointes?: Express.Multer.File[],
  ) {
    const existing = await this.prismaService.courrierDepart.findUnique({ where: { id } });
    if (!existing || existing.isDelete) {
      throw new NotFoundException(`Courrier départ avec l'ID ${id} introuvable.`);
    }

    if (!document || !dto.categorie || !dto.classeCourrier || !dto.typeCourrier || !dto.dateSignature || !dto.idSignataire) {
      throw new BadRequestException(
        'Les champs document, categorie, classeCourrier, typeCourrier, dateSignature et idSignataire sont obligatoires.',
      );
    }

    const uploadDir = this.ensureUploadDir();

    let documentPath: string | null = existing.document || null;
    if (document) {
      const timestamp = Date.now();
      const documentFileName = `${timestamp}-${document.originalname}`;
      const documentFullPath = path.join(uploadDir, documentFileName);
      fs.writeFileSync(documentFullPath, document.buffer);
      documentPath = `courrier-depart/${documentFileName}`;
    }

    const piecesJointesInfo = this.parsePiecesJointesData(dto.piecesJointesData);

    const result = await this.prismaService.$transaction(async (prisma) => {
      const courrierDepart = await prisma.courrierDepart.update({
        where: { id },
        data: {
          document: documentPath,
          numeroReference: dto.numeroReference || null,
          categorie: dto.categorie || null,
          idSignataire: dto.idSignataire || null,
          classeCourrier: dto.classeCourrier || null,
          typeCourrier: dto.typeCourrier || null,
          dateSignature: dto.dateSignature ? new Date(dto.dateSignature) : null,
          commentaire: dto.commentaire || null,
          email: dto.email || null,
          numeroTelephone: dto.numeroTelephone || null,
          nombrePieceJointe: dto.nombrePieceJointe || (piecesJointes?.length ?? 0),
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
              chemin: `courrier-depart/${fileName}`,
              type: file.mimetype,
              idCourrierDepart: courrierDepart.id,
              idParent: courrierDepart.id,
              typeParent: 'courrier_depart',
            },
          });
          piecesJointesCreees.push(pieceJointe);
        }
      }

      return { courrierDepart, piecesJointes: piecesJointesCreees };
    });

    const shouldNotify = dto.sendNotification === true;
    if (shouldNotify) {
      const subject = `Courrier départ - ${result.courrierDepart.numeroReference || 'Sans référence'}`;
      const message = `Votre courrier départ a été mis à jour. Référence: ${result.courrierDepart.numeroReference || 'N/A'}.`;

      if (dto.email) {
        this.mailerService
          .sendCourrierDepartNotification(dto.email, subject, message, {
            numeroReference: result.courrierDepart.numeroReference || '',
            categorie: result.courrierDepart.categorie || '',
            classeCourrier: result.courrierDepart.classeCourrier || '',
            typeCourrier: result.courrierDepart.typeCourrier || '',
            dateSignature: result.courrierDepart.dateSignature,
          })
          .catch(() => undefined);
      }

      if (dto.numeroTelephone) {
        this.smsService.sendSms(dto.numeroTelephone, message, true).catch(() => undefined);
      }
    }

    return this.responseFormatter.success(
      result,
      'Mise à jour courrier départ',
      `Courrier départ mis à jour avec succès. ${result.piecesJointes.length} pièce(s) jointe(s) ajoutée(s).`,
    );
  }

  async notify(id: number) {
    const courrierDepart = await this.prismaService.courrierDepart.findUnique({ where: { id } });
    if (!courrierDepart || courrierDepart.isDelete) {
      throw new NotFoundException(`Courrier départ avec l'ID ${id} introuvable.`);
    }

    const subject = `Courrier départ - ${courrierDepart.numeroReference || 'Sans référence'}`;
    const message = `Votre courrier départ a été enregistré. Référence: ${courrierDepart.numeroReference || 'N/A'}.`;

    let emailSent = false;
    let smsSent = false;

    if (courrierDepart.email) {
      emailSent = await this.mailerService.sendCourrierDepartNotification(
        courrierDepart.email,
        subject,
        message,
        {
          numeroReference: courrierDepart.numeroReference || '',
          categorie: courrierDepart.categorie || '',
          classeCourrier: courrierDepart.classeCourrier || '',
          typeCourrier: courrierDepart.typeCourrier || '',
          dateSignature: courrierDepart.dateSignature,
        },
      );
    }

    if (courrierDepart.numeroTelephone) {
      const smsResult = await this.smsService.sendSms(courrierDepart.numeroTelephone, message, true);
      smsSent = smsResult.success === true;
    }

    return this.responseFormatter.success(
      { id, emailSent, smsSent },
      'Notification courrier départ',
      'Notification envoyée avec succès.',
    );
  }

  async delete(id: number) {
    const courrierDepart = await this.prismaService.courrierDepart.findUnique({ where: { id } });
    if (!courrierDepart) {
      throw new NotFoundException(`Courrier départ avec l'ID ${id} introuvable.`);
    }

    await this.prismaService.$transaction(async (prisma) => {
      await prisma.pieceJointe.updateMany({
        where: { idCourrierDepart: id },
        data: { idCourrierDepart: null, idParent: null, typeParent: null },
      });
      await prisma.courrierDepart.update({ where: { id }, data: { isDelete: true } });
    });

    return this.responseFormatter.success(
      [],
      'Suppression courrier départ',
      'Courrier départ supprimé (logique) avec succès.',
    );
  }

  async deletePermanent(id: number) {
    const courrierDepart = await this.prismaService.courrierDepart.findUnique({ where: { id } });
    if (!courrierDepart) {
      throw new NotFoundException(`Courrier départ avec l'ID ${id} introuvable.`);
    }

    const pieces = await this.prismaService.pieceJointe.findMany({
      where: { idCourrierDepart: id },
      select: { id: true, chemin: true },
    });

    await this.prismaService.$transaction(async (prisma) => {
      await prisma.pieceJointe.deleteMany({ where: { idCourrierDepart: id } });
      await prisma.courrierDepart.delete({ where: { id } });
    });

    for (const piece of pieces) {
      try {
        const filePath = path.join(process.cwd(), 'public', piece.chemin);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // ignore
      }
    }

    return this.responseFormatter.success(
      [],
      'Suppression courrier départ',
      'Courrier départ supprimé définitivement avec succès.',
    );
  }
}
