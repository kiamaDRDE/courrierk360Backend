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

    return { gte: start, lte: end };
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

  private sanitizeCourrierDepartForResponse<T extends Record<string, any>>(courrierDepart: T | null) {
    if (!courrierDepart) return courrierDepart;
    const { categorie, classeCourrier, dateSignature, idDestinataire, email, numeroTelephone, ...rest } =
      courrierDepart;
    return rest as Omit<
      T,
      'categorie' | 'classeCourrier' | 'dateSignature' | 'idDestinataire' | 'email' | 'numeroTelephone'
    >;
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

    // Filtrer sur dateSignature avec dateArriveeDebut/Fin
    if (filters.dateArriveeDebut || filters.dateArriveeFin) {
      // Si les dates sont identiques, utiliser parseSingleDate
      if (filters.dateArriveeDebut && filters.dateArriveeDebut === filters.dateArriveeFin) {
        where.dateSignature = this.parseSingleDate(
          filters.dateArriveeDebut,
          'dateSignature',
        );
      } else {
        // Sinon utiliser parseDateRange
        const dateSignatureRange = this.parseDateRange(
          filters.dateArriveeDebut,
          filters.dateArriveeFin,
          'dateSignature',
        );
        if (dateSignatureRange) {
          where.dateSignature = dateSignatureRange;
        }
      }
    }

    if (filters.dateEnregistrement) {
      courrierFilters.dateEnregistrement = this.parseSingleDate(
        filters.dateEnregistrement,
        'dateEnregistrement',
      );
    }

    if (filters.priorite) {
      courrierFilters.priorite = filters.priorite;
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
      
      // Conditions de recherche sur le courrier départ
      const courrierDepartOrFilters: any[] = [
        { numeroReference: { contains: search } },
        { numeroActe: { contains: search } },
        { commentaire: { contains: search } },
        { typeCourrier: { contains: search } },
        { statutArchive: { contains: search } },
        { signataire: { is: { username: { contains: search } } } },
        { signataire: { is: { firstName: { contains: search } } } },
        { signataire: { is: { lastName: { contains: search } } } },
        { signataire: { is: { email: { contains: search } } } },
        { signataire: { is: { phone: { contains: search } } } },
        { signataire: { is: { numero: { contains: search } } } },
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
        { typeCourrier: { is: { nom: { contains: search } } } },
        { provenance: { is: { nom: { contains: search } } } },
        { provenance: { is: { email: { contains: search } } } },
        { provenance: { is: { telephone: { contains: search } } } },
        { provenance: { is: { adresse: { contains: search } } } },
      ];

      // Recherche numérique
        if (!Number.isNaN(numericSearch)) {
          courrierDepartOrFilters.push(
            { id: numericSearch },
            { idCourrier: numericSearch },
            { idSignataire: numericSearch },
            { nombrePieceJointe: numericSearch },
          );
        
        // IDs dans le courrier lié
        courrierSearchFilters.push(
          { id: numericSearch },
          { idProvenance: numericSearch },
          { idTypeCourrier: numericSearch },
          { idService: numericSearch },
          { idUser: numericSearch },
          { nombrePieceJointe: numericSearch },
        );
      }

      // Ajouter les recherches sur le courrier lié
      courrierSearchFilters.forEach((filter) => {
        courrierDepartOrFilters.push({
          courrier: { is: filter },
        });
      });

      where.OR = courrierDepartOrFilters;
    }

    const includePayload = {
      signataire: { select: { id: true, firstName: true, lastName: true } },
      piecesJointes: { select: { id: true, nom: true, chemin: true, type: true } },
      courrier: {
        select: {
          id: true,
          numero: true,
          reference: true,
          objet: true,
          isGeled: true,
          dateArrivee: true,
          dateEnregistrement: true,
          categorie: true,
          priorite: true,
          statut: true,
          typeCourrier: { select: { nom: true } },
          provenance: { select: { nom: true } },
        },
      },
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

    // Récupérer tous les IDs des correspondants en copie
    const allProvenancesCopieIds = new Set<number>();
    courriersDeparts.forEach((cd) => {
      if (cd.provenancesCopie && Array.isArray(cd.provenancesCopie)) {
        cd.provenancesCopie.forEach((id: any) => {
          if (typeof id === 'number') allProvenancesCopieIds.add(id);
        });
      }
    });

    // Charger tous les correspondants en une seule requête
    const correspondantsMap = new Map<number, { id: number; nom: string }>();
    if (allProvenancesCopieIds.size > 0) {
      const correspondants = await this.prismaService.correspondant.findMany({
        where: { id: { in: Array.from(allProvenancesCopieIds) } },
        select: { id: true, nom: true },
      });
      correspondants.forEach((c) => correspondantsMap.set(c.id, c));
    }

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

    let data = courriersDeparts.map((courrierDepart) => {
      const courrierId = courrierDepart.courrier?.id || null;
      const dernierStatutService = courrierId ? latestByCourrier.get(courrierId) : null;

      // Mapper les provenancesCopie avec les détails des correspondants
      const provenancesCopieDetaillees: { id: number; nom: string }[] = [];
      if (courrierDepart.provenancesCopie && Array.isArray(courrierDepart.provenancesCopie)) {
        courrierDepart.provenancesCopie.forEach((id: any) => {
          if (typeof id === 'number') {
            const correspondant = correspondantsMap.get(id);
            if (correspondant) {
              provenancesCopieDetaillees.push(correspondant);
            }
          }
        });
      }

      return {
        id: courrierDepart.id,
        numeroReference: courrierDepart.numeroReference,
        numeroActe: courrierDepart.numeroActe,
        typeCourrier: courrierDepart.typeCourrier,
        commentaire: courrierDepart.commentaire,
        document: courrierDepart.document,
        nombrePieceJointe: courrierDepart.nombrePieceJointe,
        provenancesCopie: provenancesCopieDetaillees,
        piecesJointes: (courrierDepart.piecesJointes || []).map((pj) => ({
          id: pj.id,
          nom: pj.nom,
          chemin: pj.chemin,
          type: pj.type,
        })),
        signataire: courrierDepart.signataire
          ? {
              id: courrierDepart.signataire.id,
              fullName: `${courrierDepart.signataire.firstName} ${courrierDepart.signataire.lastName}`,
            }
          : { id: null, fullName: null },
        courrier: courrierDepart.courrier
          ? {
              id: courrierDepart.courrier.id,
              numero: courrierDepart.courrier.numero,
              reference: courrierDepart.courrier.reference,
              objet: courrierDepart.courrier.objet,
              is_geled: courrierDepart.courrier.isGeled,
              dateArrivee: courrierDepart.courrier.dateArrivee,
              dateEnregistrement: courrierDepart.courrier.dateEnregistrement,
              typeCourrier: courrierDepart.courrier.typeCourrier?.nom || null,
              provenance: courrierDepart.courrier.provenance?.nom || null,
              categorie: courrierDepart.courrier.categorie,
              priorite: courrierDepart.courrier.priorite,
              statut: courrierDepart.courrier.statut,
            }
          : null,
        dernierStatutService: dernierStatutService
          ? {
              statut: dernierStatutService.statut,
              service: dernierStatutService.service,
            }
          : null,
        isDelete: courrierDepart.isDelete,
        isArchive: courrierDepart.isArchive,
        statutArchive: courrierDepart.statutArchive,
        viderPar: courrierDepart.viderPar,
        createdAt: courrierDepart.createdAt,
        courrierId,
      };
    });

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
        signataire: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        piecesJointes: { select: { id: true, nom: true, intitule: true, chemin: true, type: true, createdAt: true } },
        courrier: {
          select: {
            id: true,
            numero: true,
            reference: true,
            objet: true,
            isGeled: true,
            dateArrivee: true,
            dateEnregistrement: true,
            categorie: true,
            priorite: true,
            typeCourrier: { select: { nom: true } },
            provenance: { select: { nom: true } },
          },
        },
      },
    });

    if (!courrierDepart || courrierDepart.isDelete) {
      throw new NotFoundException(`Courrier départ avec l'ID ${id} introuvable.`);
    }

    // Charger les correspondants en copie
    const provenancesCopieDetaillees: { id: number; nom: string; email: string | null; telephone: string; adresse: string | null }[] = [];
    if (courrierDepart.provenancesCopie && Array.isArray(courrierDepart.provenancesCopie)) {
      const correspondantIds = courrierDepart.provenancesCopie.filter((id: any) => typeof id === 'number');
      if (correspondantIds.length > 0) {
        const correspondants = await this.prismaService.correspondant.findMany({
          where: { id: { in: correspondantIds } },
          select: { id: true, nom: true, email: true, telephone: true, adresse: true },
        });
        provenancesCopieDetaillees.push(...correspondants);
      }
    }

    const response = {
      id: courrierDepart.id,
      numeroReference: courrierDepart.numeroReference,
      numeroActe: courrierDepart.numeroActe,
      typeCourrier: courrierDepart.typeCourrier,
      commentaire: courrierDepart.commentaire,
      document: courrierDepart.document,
      nombrePieceJointe: courrierDepart.nombrePieceJointe,
      provenancesCopie: provenancesCopieDetaillees,
      piecesJointes: courrierDepart.piecesJointes || [],
      signataire: courrierDepart.signataire
        ? {
            id: courrierDepart.signataire.id,
            fullName: `${courrierDepart.signataire.firstName} ${courrierDepart.signataire.lastName}`,
            email: courrierDepart.signataire.email,
            phone: courrierDepart.signataire.phone,
          }
        : null,
      courrier: courrierDepart.courrier
        ? {
            id: courrierDepart.courrier.id,
            numero: courrierDepart.courrier.numero,
            reference: courrierDepart.courrier.reference,
            objet: courrierDepart.courrier.objet,
            is_geled: courrierDepart.courrier.isGeled,
            dateArrivee: courrierDepart.courrier.dateArrivee,
            dateEnregistrement: courrierDepart.courrier.dateEnregistrement,
            typeCourrier: courrierDepart.courrier.typeCourrier?.nom || null,
            provenance: courrierDepart.courrier.provenance?.nom || null,
            categorie: courrierDepart.courrier.categorie,
            priorite: courrierDepart.courrier.priorite,
          }
        : null,
      isDelete: courrierDepart.isDelete,
      isArchive: courrierDepart.isArchive,
      statutArchive: courrierDepart.statutArchive,
      viderPar: courrierDepart.viderPar,
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
        typeCourrier: courrierDepart.typeCourrier,
        commentaire: courrierDepart.commentaire,
        document: courrierDepart.document,
        provenancesCopie: courrierDepart.provenancesCopie || [],
        piecesJointes: courrierDepart.piecesJointes || [],
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
    if (!document || !dto.typeCourrier || !dto.idSignataire) {
      throw new BadRequestException(
        'Les champs document, typeCourrier et idSignataire sont obligatoires.',
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
    
    // Parser provenancesCopie (array d'IDs de correspondants)
    let provenancesCopieArray: number[] = [];
    if (dto.provenancesCopie) {
      try {
        provenancesCopieArray = JSON.parse(dto.provenancesCopie);
        if (!Array.isArray(provenancesCopieArray)) {
          provenancesCopieArray = [];
        }
      } catch (error) {
        provenancesCopieArray = [];
      }
    }

    const result = await this.prismaService.$transaction(async (prisma) => {
      const courrierDepart = await prisma.courrierDepart.create({
        data: {
          document: documentPath,
          numeroReference: dto.numeroReference || null,
          numeroActe: dto.numeroActe || null,
          idCourrier: dto.idCourrier || null,
          idSignataire: dto.idSignataire || null,
          typeCourrier: dto.typeCourrier || null,
          commentaire: dto.commentaire || null,
          nombrePieceJointe: dto.nombrePieceJointe || (piecesJointes?.length ?? 0),
          provenancesCopie: provenancesCopieArray.length > 0 ? provenancesCopieArray : undefined,
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
      // Récupérer le destinataire via la provenance du courrier lié (si existant)
      const courrierLinked = dto.idCourrier
        ? await this.prismaService.courrier.findUnique({
            where: { id: dto.idCourrier },
            select: { provenance: { select: { nom: true, email: true } } },
          })
        : null;

      // Récupérer les informations du signataire
      const signataire = await this.prismaService.user.findUnique({
        where: { id: dto.idSignataire },
        select: { firstName: true, lastName: true },
      });

      const destinataireNom = courrierLinked?.provenance?.nom || 'Monsieur/Madame';
      const destinataireEmail = courrierLinked?.provenance?.email || null;
      const signataireNom = signataire
        ? `${signataire.firstName} ${signataire.lastName}`
        : 'N/A';

      // Envoyer l'email avec le nouveau template
      if (destinataireEmail) {
        this.mailerService
          .sendCourrierDepartNotification(destinataireEmail, destinataireNom, {
            numeroReference: result.courrierDepart.numeroReference,
            numeroActe: result.courrierDepart.numeroActe,
            typeCourrier: result.courrierDepart.typeCourrier,
            categorie: result.courrierDepart.categorie,
            classeCourrier: result.courrierDepart.classeCourrier,
            dateSignature: result.courrierDepart.dateSignature,
            signataire: signataireNom,
            commentaire: result.courrierDepart.commentaire,
          })
          .catch(() => undefined);
      }

      // 📵 Ne pas envoyer de SMS lors de la création d'un courrier départ — seul l'email est envoyé.
    }

    const sanitizedResult = {
      ...result,
      courrierDepart: this.sanitizeCourrierDepartForResponse(result.courrierDepart),
    };

    return this.responseFormatter.success(
      sanitizedResult,
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
    
    // Parser provenancesCopie (array d'IDs de correspondants)
    let provenancesCopieArray: number[] = [];
    if (dto.provenancesCopie) {
      try {
        provenancesCopieArray = JSON.parse(dto.provenancesCopie);
        if (!Array.isArray(provenancesCopieArray)) {
          provenancesCopieArray = [];
        }
      } catch (error) {
        provenancesCopieArray = [];
      }
    }

      const result = await this.prismaService.$transaction(async (prisma) => {
        const updateData: any = {
          numeroReference: dto.numeroReference !== undefined ? dto.numeroReference : existing.numeroReference,
          numeroActe: dto.numeroActe !== undefined ? dto.numeroActe : existing.numeroActe,
          idCourrier: dto.idCourrier !== undefined ? dto.idCourrier : existing.idCourrier,
          idSignataire: dto.idSignataire !== undefined ? dto.idSignataire : existing.idSignataire,
          typeCourrier: dto.typeCourrier !== undefined ? dto.typeCourrier : existing.typeCourrier,
          commentaire: dto.commentaire !== undefined ? dto.commentaire : existing.commentaire,
          nombrePieceJointe: dto.nombrePieceJointe !== undefined ? dto.nombrePieceJointe : (piecesJointes?.length ?? existing.nombrePieceJointe),
        };

      // Mettre à jour le document seulement si fourni
      if (document) {
        updateData.document = documentPath;
      }

      // Ajouter provenancesCopie seulement si fourni dans le DTO
      if (dto.provenancesCopie !== undefined) {
        updateData.provenancesCopie = provenancesCopieArray.length > 0 ? provenancesCopieArray : undefined;
      }

      const courrierDepart = await prisma.courrierDepart.update({
        where: { id },
        data: updateData,
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
      // Récupérer le destinataire via la provenance du courrier lié (si mis à jour ou existant)
      const courrierId = dto.idCourrier !== undefined ? dto.idCourrier : existing.idCourrier;
      const courrierLinked = courrierId
        ? await this.prismaService.courrier.findUnique({
            where: { id: courrierId },
            select: { provenance: { select: { nom: true, email: true } } },
          })
        : null;

      // Récupérer les informations du signataire
      const signataire = await this.prismaService.user.findUnique({
        where: { id: dto.idSignataire },
        select: { firstName: true, lastName: true },
      });

      const destinataireNom = courrierLinked?.provenance?.nom || 'Monsieur/Madame';
      const destinataireEmail = courrierLinked?.provenance?.email || null;
      const signataireNom = signataire
        ? `${signataire.firstName} ${signataire.lastName}`
        : 'N/A';

      // Envoyer l'email avec le nouveau template
      if (destinataireEmail) {
        this.mailerService
          .sendCourrierDepartNotification(destinataireEmail, destinataireNom, {
            numeroReference: result.courrierDepart.numeroReference,
            numeroActe: result.courrierDepart.numeroActe,
            typeCourrier: result.courrierDepart.typeCourrier,
            categorie: result.courrierDepart.categorie,
            classeCourrier: result.courrierDepart.classeCourrier,
            dateSignature: result.courrierDepart.dateSignature,
            signataire: signataireNom,
            commentaire: result.courrierDepart.commentaire,
          })
          .catch(() => undefined);
      }

      // 📵 Ne pas envoyer de SMS lors de la mise à jour d'un courrier départ — seul l'email est envoyé.
    }

    const sanitizedResult = {
      ...result,
      courrierDepart: this.sanitizeCourrierDepartForResponse(result.courrierDepart),
    };

    return this.responseFormatter.success(
      sanitizedResult,
      'Mise à jour courrier départ',
      `Courrier départ mis à jour avec succès. ${result.piecesJointes.length} pièce(s) jointe(s) ajoutée(s).`,
    );
  }

  async notify(id: number) {
    const courrierDepart = await this.prismaService.courrierDepart.findUnique({
      where: { id },
      include: {
        signataire: { select: { firstName: true, lastName: true } },
        courrier: { select: { provenance: { select: { nom: true, email: true } } } },
      },
    });

    if (!courrierDepart || courrierDepart.isDelete) {
      throw new NotFoundException(`Courrier départ avec l'ID ${id} introuvable.`);
    }

    const destinataireNom = courrierDepart.courrier?.provenance?.nom || 'Monsieur/Madame';
    const signataireNom = courrierDepart.signataire
      ? `${courrierDepart.signataire.firstName} ${courrierDepart.signataire.lastName}`
      : 'N/A';

    let emailSent = false;
    let smsSent = false;

    const destinataireEmail = courrierDepart.courrier?.provenance?.email || null;
    if (destinataireEmail) {
      emailSent = await this.mailerService.sendCourrierDepartNotification(
        destinataireEmail,
        destinataireNom,
        {
          numeroReference: courrierDepart.numeroReference,
          numeroActe: courrierDepart.numeroActe,
          typeCourrier: courrierDepart.typeCourrier,
          categorie: courrierDepart.categorie,
          classeCourrier: courrierDepart.classeCourrier,
          dateSignature: courrierDepart.dateSignature,
          signataire: signataireNom,
          commentaire: courrierDepart.commentaire,
        },
      );
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
