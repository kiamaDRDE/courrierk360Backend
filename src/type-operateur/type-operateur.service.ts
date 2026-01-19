                                                                                    import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeOperateurDto } from './dto/create-type-operateur.dto';
import { UpdateTypeOperateurDto } from './dto/update-type-operateur.dto';
import { QueryTypeOperateurDto } from './dto/query-type-operateur.dto';

@Injectable()
export class TypeOperateurService {
  constructor(private prisma: PrismaService) {}

  private formatResponse(data: any, title: string, message: string) {
    return {
      success: true,
      statusCode: 201,
      code: 'success',
      title,
      message,
      data,
    };
  }

  async create(data: CreateTypeOperateurDto | CreateTypeOperateurDto[]) {
    const typesOperateur = Array.isArray(data) ? data : [data];
    const isMultiple = Array.isArray(data);

    // Vérifier si des types d'opérateur avec ces noms existent déjà
    const existingTypes = await this.prisma.typeOperateur.findMany({
      where: {
        nom: { in: typesOperateur.map(t => t.nom) },
      },
      select: { nom: true },
    });

    if (existingTypes.length > 0) {
      const conflictingNames = existingTypes.map(t => t.nom);
      throw new ConflictException(
        `Des types d'opérateur avec les noms suivants existent déjà : ${conflictingNames.join(', ')}`,
      );
    }

    // Créer les types d'opérateur
    const createdTypes: any[] = [];
    
    for (const typeData of typesOperateur) {
      const typeOperateur = await this.prisma.typeOperateur.create({
        data: {
          nom: typeData.nom,
          description: typeData.description || null,
        },
      });

      createdTypes.push(typeOperateur);
    }

    return this.formatResponse(
      isMultiple ? createdTypes : createdTypes[0],
      isMultiple ? 'Types d\'opérateur créés' : 'Type d\'opérateur créé',
      isMultiple 
        ? `${createdTypes.length} type(s) d'opérateur créé(s) avec succès.`
        : `Type d'opérateur "${createdTypes[0].nom}" créé avec succès.`,
    );
  }

  async findAll(query: QueryTypeOperateurDto) {
    const { nom, description, page = 1, limit = 10 } = query;

    const where: any = {};

    if (nom) {
      where.nom = {
        contains: nom,
      };
    }

    if (description) {
      where.description = {
        contains: description,
      };
    }

    const skip = (page - 1) * limit;

    const [typesOperateur, total] = await Promise.all([
      this.prisma.typeOperateur.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ nom: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.typeOperateur.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return this.formatResponse(
      {
        typesOperateur,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des types d\'opérateur',
      `${typesOperateur.length} type(s) d'opérateur sur ${total} récupéré(s) avec succès.`,
    );
  }

  async findOne(id: number) {
    const typeOperateur = await this.prisma.typeOperateur.findUnique({
      where: { id },
    });

    if (!typeOperateur) {
      throw new NotFoundException(
        `Type d'opérateur avec l'ID ${id} introuvable`,
      );
    }

    return this.formatResponse(
      typeOperateur,
      'Type d\'opérateur récupéré',
      `Type d'opérateur "${typeOperateur.nom}" récupéré avec succès.`,
    );
  }

  async update(id: number, updateTypeOperateurDto: UpdateTypeOperateurDto) {
    // Vérifier si le type d'opérateur existe
    const existingType = await this.prisma.typeOperateur.findUnique({
      where: { id },
    });

    if (!existingType) {
      throw new NotFoundException(
        `Type d'opérateur avec l'ID ${id} introuvable`,
      );
    }

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (updateTypeOperateurDto.nom && updateTypeOperateurDto.nom !== existingType.nom) {
      const conflictingType = await this.prisma.typeOperateur.findFirst({
        where: {
          nom: updateTypeOperateurDto.nom,
          id: { not: id },
        },
      });

      if (conflictingType) {
        throw new ConflictException(
          `Un type d'opérateur avec le nom "${updateTypeOperateurDto.nom}" existe déjà`,
        );
      }
    }

    const updatedType = await this.prisma.typeOperateur.update({
      where: { id },
      data: updateTypeOperateurDto,
    });

    return this.formatResponse(
      updatedType,
      'Type d\'opérateur mis à jour',
      `Type d'opérateur "${updatedType.nom}" mis à jour avec succès.`,
    );
  }

  async remove(id: number) {
    const typeOperateur = await this.prisma.typeOperateur.findUnique({
      where: { id },
    });

    if (!typeOperateur) {
      throw new NotFoundException(
        `Type d'opérateur avec l'ID ${id} introuvable`,
      );
    }

    await this.prisma.typeOperateur.delete({
      where: { id },
    });

    return this.formatResponse(
      { id },
      'Type d\'opérateur supprimé',
      `Type d'opérateur "${typeOperateur.nom}" supprimé avec succès.`,
    );
  }
}
