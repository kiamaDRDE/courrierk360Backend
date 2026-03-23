import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';
import { CreateProjetDto } from './dto/create.dto';
import { UpdateProjetDto } from './dto/update.dto';
import { ListProjetQueryDto } from './dto/list.dto';

@Injectable()
export class ProjetService {
  private readonly logger = new Logger(ProjetService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Sync projects from an external API into the local `projet` table.
   * Maps: id -> id, name -> name
   */
  async syncFromExternal(externalUrl?: string) {
    const url =
      externalUrl ||
      process.env.EXTERNAL_SERVICES_PROJECTS_URL ||
      'http://api-kiama360-test.kiama.cm/courrier/projet?page=1&limit=0';
    this.logger.log(`Sync projects from external URL: ${url}`);

    const externalToken = process.env.EXTERNAL_SERVICES_TOKEN;
    const headers: any = {};
    if (externalToken) {
      headers.Authorization = `Bearer ${externalToken}`;
      this.logger.log(
        'Using EXTERNAL_SERVICES_TOKEN for Authorization header (projects)',
      );
    }

    const resp = await axios.get(url, { timeout: 20000, headers });
    const items = Array.isArray(resp.data?.data?.data)
      ? resp.data.data.data
      : Array.isArray(resp.data?.data)
        ? resp.data.data
        : [];

    let processed = 0;
    for (const item of items) {
      try {
        const projetId = Number(item.id);
        if (!Number.isInteger(projetId)) continue;

        const name = String(item.name ?? item.nom ?? '').trim();
        if (!name) continue;

        await this.prisma.projet.upsert({
          where: { id: projetId },
          update: { name },
          create: { id: projetId, name },
        });

        processed++;
      } catch (err) {
        this.logger.error(
          `Error processing external projet item: ${err?.message || err}`,
        );
      }
    }

    return { processed };
  }

  async create(dto: CreateProjetDto) {
    const projet = await this.prisma.projet.create({ data: dto });
    return this.responseFormatter.created(
      projet,
      'Projet créé',
      'Le projet a été créé avec succès.',
    );
  }

  async update(id: number, dto: UpdateProjetDto) {
    const existing = await this.prisma.projet.findUnique({ where: { id } });
    if (!existing) {
      return this.responseFormatter.notFound(
        'Projet non trouvé',
        `Aucun projet trouvé avec l'ID ${id}.`,
      );
    }

    const projet = await this.prisma.projet.update({
      where: { id },
      data: dto,
    });

    return this.responseFormatter.updated(
      projet,
      'Projet mis à jour',
      'Le projet a été mis à jour avec succès.',
    );
  }

  async list(query?: ListProjetQueryDto) {
    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);

    const search = this.searchService.sanitizeSearchTerm(filters.search);
    const where = this.searchService.buildSearchWhere(search, {
      stringFields: ['name'],
      numberFields: ['id'],
    });

    const [items, totalItems] = await Promise.all([
      this.prisma.projet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.projet.count({ where }),
    ]);

    const paginatedResult = this.paginationService.createPaginatedResult(
      items,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des projets',
      `${totalItems} projet(s) récupéré(s) avec succès.`,
    );
  }

  async findOne(id: number) {
    const projet = await this.prisma.projet.findUnique({ where: { id } });
    if (!projet) {
      return this.responseFormatter.notFound(
        'Projet non trouvé',
        `Aucun projet trouvé avec l'ID ${id}.`,
      );
    }

    return this.responseFormatter.success(
      projet,
      'Projet récupéré',
      'Les informations du projet ont été récupérées avec succès.',
    );
  }
}
