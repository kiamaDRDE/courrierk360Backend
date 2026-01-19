import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEffetClubDto } from './dto/create-effet-club.dto';
import { UpdateEffetClubDto } from './dto/update-effet-club.dto';
import { EffetClubQueryDto } from './dto/effet-club-query.dto';

interface PaginatedEffetClubResponse {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CiseauTarifaireService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEffetClubDto: CreateEffetClubDto) {
    // Vérifier qu'il n'existe pas déjà un ciseau tarifaire pour cette année
    const existingEffetClub = await this.prisma.ciseauTarifaire.findUnique({
      where: { annee: createEffetClubDto.annee }
    });

    if (existingEffetClub) {
      throw new ConflictException(`Un ciseau tarifaire existe déjà pour l'année ${createEffetClubDto.annee}`);
    }

    // Calculer le coût total (somme de tous les coûts + taxe)
    const coutReseau = new Decimal(createEffetClubDto.coutReseau);
    const coutCommerciaux = new Decimal(createEffetClubDto.coutCommerciaux);
    const coutInterconnexion = new Decimal(createEffetClubDto.coutInterconnexion);
    const taxe = new Decimal(createEffetClubDto.taxe);
    const cout = coutReseau.plus(coutCommerciaux).plus(coutInterconnexion).plus(taxe);

    const effetClub = await this.prisma.ciseauTarifaire.create({
      data: {
        annee: createEffetClubDto.annee,
        coutReseau,
        coutCommerciaux,
        coutInterconnexion,
        taxe,
        cout
      }
    });

    return this.mapToResponseDto(effetClub);
  }

  async findAll(query: EffetClubQueryDto): Promise<PaginatedEffetClubResponse> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Construction du tri
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    if (limit === 0) {
      // Retourner tous les résultats sans pagination
      const effetsClub = await this.prisma.ciseauTarifaire.findMany({
        orderBy
      });

      return {
        data: effetsClub.map(item => this.mapToResponseDto(item)),
        meta: {
          total: effetsClub.length,
          page: 1,
          limit: 0,
          totalPages: 1
        }
      };
    }

    // Pagination normale
    const skip = (page - 1) * limit;
    const [effetsClub, total] = await Promise.all([
      this.prisma.ciseauTarifaire.findMany({
        skip,
        take: limit,
        orderBy
      }),
      this.prisma.ciseauTarifaire.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: effetsClub.map(item => this.mapToResponseDto(item)),
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async update(id: number, updateEffetClubDto: UpdateEffetClubDto) {
    // Vérifier que l'effet club existe
    const existingEffetClub = await this.prisma.ciseauTarifaire.findUnique({
      where: { id }
    });

    if (!existingEffetClub) {
      throw new NotFoundException(`Effet club avec l'ID ${id} non trouvé`);
    }

    // Si l'année est modifiée, vérifier la contrainte d'unicité
    if (updateEffetClubDto.annee !== undefined && updateEffetClubDto.annee !== existingEffetClub.annee) {
      const existingConflict = await this.prisma.ciseauTarifaire.findFirst({
        where: {
          AND: [
            { annee: updateEffetClubDto.annee },
            { id: { not: id } }
          ]
        }
      });

      if (existingConflict) {
        throw new ConflictException(`Un ciseau tarifaire existe déjà pour l'année ${updateEffetClubDto.annee}`);
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (updateEffetClubDto.annee !== undefined) {
      updateData.annee = updateEffetClubDto.annee;
    }

    if (updateEffetClubDto.coutReseau !== undefined) {
      updateData.coutReseau = new Decimal(updateEffetClubDto.coutReseau);
    }

    if (updateEffetClubDto.coutCommerciaux !== undefined) {
      updateData.coutCommerciaux = new Decimal(updateEffetClubDto.coutCommerciaux);
    }

    if (updateEffetClubDto.coutInterconnexion !== undefined) {
      updateData.coutInterconnexion = new Decimal(updateEffetClubDto.coutInterconnexion);
    }

    if (updateEffetClubDto.taxe !== undefined) {
      updateData.taxe = new Decimal(updateEffetClubDto.taxe);
    }

    // Recalculer le coût total si au moins un des champs change
    if (updateEffetClubDto.coutReseau !== undefined || 
        updateEffetClubDto.coutCommerciaux !== undefined || 
        updateEffetClubDto.coutInterconnexion !== undefined || 
        updateEffetClubDto.taxe !== undefined) {
      
      // Récupérer les valeurs actuelles ou les nouvelles valeurs
      const coutReseau = updateData.coutReseau || existingEffetClub.coutReseau;
      const coutCommerciaux = updateData.coutCommerciaux || existingEffetClub.coutCommerciaux;
      const coutInterconnexion = updateData.coutInterconnexion || existingEffetClub.coutInterconnexion;
      const taxe = updateData.taxe || existingEffetClub.taxe;
      
      updateData.cout = new Decimal(coutReseau)
        .plus(new Decimal(coutCommerciaux))
        .plus(new Decimal(coutInterconnexion))
        .plus(new Decimal(taxe));
    }

    const effetClub = await this.prisma.ciseauTarifaire.update({
      where: { id },
      data: updateData
    });

    return this.mapToResponseDto(effetClub);
  }

  private mapToResponseDto(effetClub: any) {
    const coutReseau = effetClub.coutReseau?.toString() || '0';
    const coutCommerciaux = effetClub.coutCommerciaux?.toString() || '0';
    const coutInterconnexion = effetClub.coutInterconnexion?.toString() || '0';
    const taxe = effetClub.taxe?.toString() || '0';
    const cout = effetClub.cout?.toString() || '0';

    return {
      id: effetClub.id,
      annee: effetClub.annee,
      coutReseau,
      coutCommerciaux,
      coutInterconnexion,
      taxe,
      cout,
      coutFormule: `${coutReseau} + ${coutCommerciaux} + ${coutInterconnexion} + ${taxe} = ${cout}`,
      createdAt: effetClub.createdAt,
      updatedAt: effetClub.updatedAt
    };
  }
}
