import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeAppelDto } from './dto/create-type-appel.dto';
import { UpdateTypeAppelDto } from './dto/update-type-appel.dto';
import { TypeAppelQueryDto } from './dto/type-appel-query.dto';

@Injectable()
export class TypeAppelService {
  constructor(private readonly prisma: PrismaService) {}

  // Créer un ou plusieurs types d'appel
  async createTypeAppel(data: CreateTypeAppelDto | CreateTypeAppelDto[]) {
    const typesAppel = Array.isArray(data) ? data : [data];
    const isMultiple = Array.isArray(data);

    // Vérifier si des types d'appel avec ces libellés existent déjà
    const existingTypes = await this.prisma.typeAppel.findMany({
      where: {
        libelle: { in: typesAppel.map(t => t.libelle) },
      },
      select: { libelle: true },
    });

    if (existingTypes.length > 0) {
      const conflictingLabels = existingTypes.map(t => t.libelle);
      throw new ConflictException(
        `Des types d'appel avec les libellés suivants existent déjà : ${conflictingLabels.join(', ')}`,
      );
    }

    // Créer les types d'appel
    const createdTypes: any[] = [];
    
    for (const typeData of typesAppel) {
      const typeAppel = await this.prisma.typeAppel.create({
        data: {
          libelle: typeData.libelle,
          description: typeData.description || null,
          categorie: typeData.categorie,
        },
      });

      createdTypes.push(typeAppel);
    }

    return {
      success: true,
      message: isMultiple 
        ? `${createdTypes.length} type(s) d'appel créé(s) avec succès`
        : 'Type d\'appel créé avec succès',
      data: isMultiple ? createdTypes : createdTypes[0],
    };
  }

  // Modifier un type d'appel
  async updateTypeAppel(id: number, updateTypeAppelDto: UpdateTypeAppelDto) {
    // Vérifier si le type d'appel existe
    const typeAppel = await this.prisma.typeAppel.findUnique({
      where: { id },
    });

    if (!typeAppel) {
      throw new NotFoundException(`Type d'appel avec l'ID ${id} introuvable`);
    }

    // Si le libellé est modifié, vérifier qu'il n'existe pas déjà
    if (updateTypeAppelDto.libelle && updateTypeAppelDto.libelle !== typeAppel.libelle) {
      const existingTypeAppel = await this.prisma.typeAppel.findUnique({
        where: { libelle: updateTypeAppelDto.libelle },
      });

      if (existingTypeAppel) {
        throw new ConflictException(
          `Un type d'appel avec le libellé "${updateTypeAppelDto.libelle}" existe déjà`,
        );
      }
    }

    const updatedTypeAppel = await this.prisma.typeAppel.update({
      where: { id },
      data: updateTypeAppelDto,
    });

    return {
      success: true,
      message: 'Type d\'appel modifié avec succès',
      data: updatedTypeAppel,
    };
  }

  // Supprimer un type d'appel
  async deleteTypeAppel(id: number) {
    // Vérifier si le type d'appel existe
    const typeAppel = await this.prisma.typeAppel.findUnique({
      where: { id },
    });

    if (!typeAppel) {
      throw new NotFoundException(`Type d'appel avec l'ID ${id} introuvable`);
    }

    await this.prisma.typeAppel.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Type d\'appel supprimé avec succès',
    };
  }

  // Lister les types d'appel avec filtres et pagination
  async listTypesAppel(query: TypeAppelQueryDto) {
    const { page = 1, limit = 10, libelle, categorie } = query;

    // Construction des filtres
    const where: any = {};

    if (libelle) {
      where.libelle = { contains: libelle };
    }

    if (categorie) {
      where.categorie = categorie;
    }

    // Compter le total
    const total = await this.prisma.typeAppel.count({ where });

    // Si limit est 0, retourner tous les résultats
    if (limit === 0) {
      const typesAppel = await this.prisma.typeAppel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: typesAppel,
        pagination: {
          total,
          page: 1,
          limit: total,
          totalPages: 1,
        },
      };
    }

    // Pagination normale
    const skip = (page - 1) * limit;
    const typesAppel = await this.prisma.typeAppel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: typesAppel,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Obtenir un type d'appel par ID
  async getTypeAppelById(id: number) {
    const typeAppel = await this.prisma.typeAppel.findUnique({
      where: { id },
    });

    if (!typeAppel) {
      throw new NotFoundException(`Type d'appel avec l'ID ${id} introuvable`);
    }

    return {
      success: true,
      data: typeAppel,
    };
  }
}
