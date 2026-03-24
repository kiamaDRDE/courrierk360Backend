import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from '../common/pagination.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { SearchService } from '../common/search.service';
import { CreateDechargeDto } from './dto/create.dto';
import { ListDechargeQueryDto } from './dto/list.dto';
import { UpdateDechargeDto } from './dto/update.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DechargeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  private getStorageDir() {
    return path.join(process.cwd(), 'public', 'decharges');
  }

  private ensureStorageDir() {
    const dir = this.getStorageDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private saveDocument(file?: Express.Multer.File) {
    if (!file) return null;
    const dir = this.ensureStorageDir();
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return `decharges/${fileName}`;
  }

  async create(dto: CreateDechargeDto, document?: Express.Multer.File) {
    const courrierDepart = await this.prisma.courrierDepart.findFirst({
      where: { id: dto.idCourrierDepart, isDelete: false },
      select: { id: true },
    });

    if (!courrierDepart) {
      return this.responseFormatter.notFound(
        'Courrier départ non trouvé',
        `Aucun courrier départ trouvé avec l'ID ${dto.idCourrierDepart}.`,
      );
    }

    const documentPath = this.saveDocument(document);

    const decharge = await this.prisma.decharge.create({
      data: {
        dateSignature: new Date(dto.dateSignature),
        signataire: dto.signataire,
        observation: dto.observation ?? null,
        document: documentPath ?? (dto.document ?? null),
        idCourrierDepart: dto.idCourrierDepart,
      },
      include: {
        courrierDepart: {
          select: {
            id: true,
            numeroReference: true,
            numeroActe: true,
            typeCourrier: true,
            objet: true,
            commentaire: true,
            document: true,
            destinataire: { select: { id: true, nom: true } },
            projet: { select: { id: true, name: true } },
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return this.responseFormatter.created(
      decharge,
      'Décharge créée',
      'La décharge a été créée avec succès.',
    );
  }

  async update(id: number, dto: UpdateDechargeDto, document?: Express.Multer.File) {
    const existing = await this.prisma.decharge.findUnique({
      where: { id },
      select: { id: true, idCourrierDepart: true },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Décharge non trouvée',
        `Aucune décharge trouvée avec l'ID ${id}.`,
      );
    }

    if (dto.idCourrierDepart !== undefined) {
      const courrierDepart = await this.prisma.courrierDepart.findFirst({
        where: { id: dto.idCourrierDepart, isDelete: false },
        select: { id: true },
      });

      if (!courrierDepart) {
        return this.responseFormatter.notFound(
          'Courrier départ non trouvé',
          `Aucun courrier départ trouvé avec l'ID ${dto.idCourrierDepart}.`,
        );
      }
    }

    const documentPath = this.saveDocument(document);

    const decharge = await this.prisma.decharge.update({
      where: { id },
      data: {
        ...(dto.dateSignature !== undefined && {
          dateSignature: new Date(dto.dateSignature),
        }),
        ...(dto.signataire !== undefined && { signataire: dto.signataire }),
        ...(dto.observation !== undefined && {
          observation: dto.observation ?? null,
        }),
        ...(documentPath !== null
          ? { document: documentPath }
          : dto.document !== undefined
            ? { document: dto.document ?? null }
            : {}),
        ...(dto.idCourrierDepart !== undefined && {
          idCourrierDepart: dto.idCourrierDepart,
        }),
      },
      include: {
        courrierDepart: {
          select: {
            id: true,
            numeroReference: true,
            numeroActe: true,
            typeCourrier: true,
            objet: true,
            commentaire: true,
            document: true,
            destinataire: { select: { id: true, nom: true } },
            projet: { select: { id: true, name: true } },
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return this.responseFormatter.updated(
      decharge,
      'Décharge mise à jour',
      'La décharge a été mise à jour avec succès.',
    );
  }

  async findOne(id: number) {
    const decharge = await this.prisma.decharge.findUnique({
      where: { id },
      include: {
        courrierDepart: {
          select: {
            id: true,
            numeroReference: true,
            numeroActe: true,
            typeCourrier: true,
            objet: true,
            commentaire: true,
            document: true,
            destinataire: { select: { id: true, nom: true } },
            projet: { select: { id: true, name: true } },
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!decharge) {
      return this.responseFormatter.notFound(
        'Décharge non trouvée',
        `Aucune décharge trouvée avec l'ID ${id}.`,
      );
    }

    return this.responseFormatter.success(
      decharge,
      'Décharge récupérée',
      'Les informations de la décharge ont été récupérées avec succès.',
    );
  }

  async list(query?: ListDechargeQueryDto) {
    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);

    const search = this.searchService.sanitizeSearchTerm(filters.search);

    const where: any = {};

    if (search) {
      const numericValue = Number(search);
      const orConditions: any[] = [
        { signataire: { contains: search } },
        { observation: { contains: search } },
        { document: { contains: search } },
        { courrierDepart: { numeroReference: { contains: search } } },
        { courrierDepart: { numeroActe: { contains: search } } },
        { courrierDepart: { typeCourrier: { contains: search } } },
        { courrierDepart: { objet: { contains: search } } },
        { courrierDepart: { commentaire: { contains: search } } },
        {
          courrierDepart: {
            destinataire: { is: { nom: { contains: search } } },
          },
        },
        {
          courrierDepart: {
            projet: { is: { name: { contains: search } } },
          },
        },
      ];

      if (!Number.isNaN(numericValue) && Number.isInteger(numericValue)) {
        orConditions.push({ id: numericValue });
        orConditions.push({ idCourrierDepart: numericValue });
      }

      where.OR = orConditions;
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.decharge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          courrierDepart: {
            select: {
              id: true,
              numeroReference: true,
              numeroActe: true,
              typeCourrier: true,
              objet: true,
              commentaire: true,
              document: true,
              destinataire: { select: { id: true, nom: true } },
              projet: { select: { id: true, name: true } },
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      this.prisma.decharge.count({ where }),
    ]);

    const paginatedResult = this.paginationService.createPaginatedResult(
      items,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des décharges',
      `${totalItems} décharge(s) récupérée(s) avec succès.`,
    );
  }
}
