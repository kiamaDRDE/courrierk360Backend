import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { CreatePieceJointeDto } from './dto/create-piece-jointe.dto';
import { UpdatePieceJointeDto } from './dto/update-piece-jointe.dto';
import { UpdatePieceJointeIntituleDto } from './dto/update-piece-jointe-intitule.dto';
import { ListPieceJointeQueryDto } from './dto/list-piece-jointe-query.dto';
import { DeletePieceJointeDto } from './dto/delete-piece-jointe.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PieceJointeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
  ) {}

  private getStorageDir() {
    return path.join(process.cwd(), 'public', 'pieces-jointes');
  }

  private ensureStorageDir() {
    const dir = this.getStorageDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private async validateRelations(dto: CreatePieceJointeDto | UpdatePieceJointeDto) {
    if (dto.idTransmission) {
      const transmission = await this.prismaService.transmission.findUnique({
        where: { id: dto.idTransmission },
        select: { id: true },
      });
      if (!transmission) {
        throw new NotFoundException(`La transmission avec l'ID ${dto.idTransmission} n'existe pas.`);
      }
    }

    if (dto.idCourrier) {
      const courrier = await this.prismaService.courrier.findUnique({
        where: { id: dto.idCourrier },
        select: { id: true },
      });
      if (!courrier) {
        throw new NotFoundException(`Le courrier avec l'ID ${dto.idCourrier} n'existe pas.`);
      }
    }
  }

  async upload(dto: CreatePieceJointeDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Le fichier est obligatoire.');
    }

    await this.validateRelations(dto);
    const dir = this.ensureStorageDir();

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const pieceJointe = await this.prismaService.pieceJointe.create({
      data: {
        nom: file.originalname,
        intitule: dto.intitule || file.originalname,
        chemin: `pieces-jointes/${fileName}`,
        type: file.mimetype,
        idParent: dto.idParent ?? dto.idTransmission ?? dto.idCourrier ?? null,
        typeParent: dto.typeParent ?? null,
        idTransmission: dto.idTransmission ?? null,
        idCourrier: dto.idCourrier ?? null,
      },
    });

    return this.responseFormatter.created(
      pieceJointe,
      'Pièce jointe créée',
      'Pièce jointe uploadée avec succès.',
    );
  }

  async update(id: number, dto: UpdatePieceJointeDto, file?: Express.Multer.File) {
    const existing = await this.prismaService.pieceJointe.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`La pièce jointe avec l'ID ${id} n'existe pas.`);
    }

    await this.validateRelations(dto);

    const dataToUpdate: any = {};
    if (dto.intitule !== undefined) dataToUpdate.intitule = dto.intitule;
    if (dto.idParent !== undefined) dataToUpdate.idParent = dto.idParent;
    if (dto.typeParent !== undefined) dataToUpdate.typeParent = dto.typeParent;
    if (dto.idTransmission !== undefined) dataToUpdate.idTransmission = dto.idTransmission;
    if (dto.idCourrier !== undefined) dataToUpdate.idCourrier = dto.idCourrier;

    if (file) {
      const dir = this.ensureStorageDir();
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.originalname}`;
      const filePath = path.join(dir, fileName);
      fs.writeFileSync(filePath, file.buffer);

      dataToUpdate.nom = file.originalname;
      dataToUpdate.chemin = `pieces-jointes/${fileName}`;
      dataToUpdate.type = file.mimetype;
    }

    const updated = await this.prismaService.pieceJointe.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.responseFormatter.updated(
      updated,
      'Mise à jour pièce jointe',
      'Pièce jointe mise à jour avec succès.',
    );
  }

  async updateIntitule(id: number, dto: UpdatePieceJointeIntituleDto) {
    const existing = await this.prismaService.pieceJointe.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`La pièce jointe avec l'ID ${id} n'existe pas.`);
    }

    const updated = await this.prismaService.pieceJointe.update({
      where: { id },
      data: { intitule: dto.intitule },
    });

    return this.responseFormatter.updated(
      updated,
      'Mise à jour intitulé',
      'Intitulé mis à jour avec succès.',
    );
  }

  async list(query?: ListPieceJointeQueryDto) {
    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);

    const where: any = {};
    if (filters.typeParent) where.typeParent = filters.typeParent;
    if (filters.idParent) where.idParent = filters.idParent;
    if (filters.idTransmission) where.idTransmission = filters.idTransmission;
    if (filters.idCourrier) where.idCourrier = filters.idCourrier;
    if (filters.type) where.type = filters.type;

    const search = filters.search?.trim();
    if (search) {
      const numericSearch = Number(search);
      const orFilters: any[] = [
        { nom: { contains: search } },
        { intitule: { contains: search } },
        { chemin: { contains: search } },
        { type: { contains: search } },
        { typeParent: { contains: search } },
      ];
      if (!Number.isNaN(numericSearch)) {
        orFilters.push(
          { id: numericSearch },
          { idParent: numericSearch },
          { idTransmission: numericSearch },
          { idCourrier: numericSearch },
        );
      }
      where.OR = orFilters;
    }

    const [items, totalItems] = await Promise.all([
      this.prismaService.pieceJointe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.pieceJointe.count({ where }),
    ]);

    const paginatedResult = this.paginationService.createPaginatedResult(
      items,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des pièces jointes',
      `${totalItems} pièce(s) jointe(s) récupérée(s).`,
    );
  }

  async findOne(id: number) {
    const piece = await this.prismaService.pieceJointe.findUnique({
      where: { id },
    });

    if (!piece) {
      throw new NotFoundException(`La pièce jointe avec l'ID ${id} n'existe pas.`);
    }

    return this.responseFormatter.success(
      piece,
      'Détails pièce jointe',
      'Pièce jointe récupérée avec succès.',
    );
  }

  async deleteMany(dto: DeletePieceJointeDto) {
    const pieces = await this.prismaService.pieceJointe.findMany({
      where: { id: { in: dto.ids } },
    });

    if (pieces.length === 0) {
      throw new NotFoundException('Aucune pièce jointe trouvée pour ces IDs.');
    }

    await this.prismaService.pieceJointe.updateMany({
      where: { id: { in: dto.ids } },
      data: {
        idTransmission: null,
        idCourrier: null,
        idParent: null,
        typeParent: null,
      },
    });

    await this.prismaService.pieceJointe.deleteMany({
      where: { id: { in: dto.ids } },
    });

    for (const piece of pieces) {
      if (piece.chemin) {
        const filePath = path.join(process.cwd(), 'public', piece.chemin);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.error(`Erreur suppression fichier ${filePath}:`, error);
          }
        }
      }
    }

    return this.responseFormatter.success(
      { ids: dto.ids, deleted: pieces.length },
      'Suppression pièces jointes',
      'Pièces jointes supprimées avec succès.',
    );
  }
}
