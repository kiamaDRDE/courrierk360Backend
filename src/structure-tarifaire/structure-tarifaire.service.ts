import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStructureTarifaireDto } from './dto/create-structure-tarifaire.dto';
import { UpdateStructureTarifaireDto } from './dto/update-structure-tarifaire.dto';
import { QueryStructureTarifaireDto } from './dto/query-structure-tarifaire.dto';
import { UpdateMultipleStructureTarifaireDto, UpdateStructureTarifaireItemDto } from './dto/update-multiple-structure-tarifaire.dto';

@Injectable()
export class StructureTarifaireService {
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

  async create(data: CreateStructureTarifaireDto | CreateStructureTarifaireDto[]) {
    // Vérifier si c'est un tableau ou un seul objet
    const isArray = Array.isArray(data);
    const structures = isArray ? data : [data];

    // Vérifier si des structures avec ces noms existent déjà
    const existingStructures = await this.prisma.structureTarifaire.findMany({
      where: {
        nom: { in: structures.map(s => s.nom) },
      },
      select: { nom: true },
    });

    if (existingStructures.length > 0) {
      const conflictingNames = existingStructures.map(s => s.nom);
      if (isArray) {
        throw new ConflictException(
          `Des structures tarifaires avec les noms suivants existent déjà : ${conflictingNames.join(', ')}`,
        );
      } else {
        throw new ConflictException(
          `Une structure tarifaire avec le nom "${conflictingNames[0]}" existe déjà`,
        );
      }
    }

    // Créer les structures tarifaires
    const createdStructures: any[] = [];
    
    for (const structureData of structures) {
      const dataToCreate = {
        nom: structureData.nom,
        valeur: structureData.valeur ?? 0, // Valeur par défaut : 0 si non spécifiée
        estObligatoire: structureData.estObligatoire ?? false, // Valeur par défaut : false si non spécifiée
      };

      const structure = await this.prisma.structureTarifaire.create({
        data: dataToCreate,
      });

      const structureWithNumber = {
        ...structure,
        valeur: Number(structure.valeur),
      };

      createdStructures.push(structureWithNumber);
    }

    // Retourner la réponse selon le format d'entrée
    if (isArray) {
      return this.formatResponse(
        createdStructures,
        'Structures créées',
        `${createdStructures.length} structure(s) tarifaire(s) créée(s) avec succès.`,
      );
    } else {
      return this.formatResponse(
        createdStructures[0],
        'Structure créée',
        `Structure tarifaire "${createdStructures[0].nom}" créée avec succès.`,
      );
    }
  }

  async findAll(query: QueryStructureTarifaireDto) {
    const { nom, valeurMin, valeurMax, estObligatoire, page = 1, limit = 10 } = query;

    const where: any = {};

    if (nom) {
      where.nom = {
        contains: nom,
      };
    }

    if (valeurMin !== undefined || valeurMax !== undefined) {
      where.valeur = {};
      if (valeurMin !== undefined) {
        where.valeur.gte = valeurMin;
      }
      if (valeurMax !== undefined) {
        where.valeur.lte = valeurMax;
      }
    }

    if (estObligatoire !== undefined) {
      where.estObligatoire = estObligatoire;
    }

    const skip = (page - 1) * limit;

    const [structures, total] = await Promise.all([
      this.prisma.structureTarifaire.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ valeur: 'desc' }, { nom: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.structureTarifaire.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Convertir les valeurs Decimal en nombres
    const structuresWithNumbers = structures.map(structure => ({
      ...structure,
      valeur: Number(structure.valeur),
    }));

    return this.formatResponse(
      {
        structures: structuresWithNumbers,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des structures',
      `${structures.length} structure(s) tarifaire(s) sur ${total} récupérée(s) avec succès.`,
    );
  }

  async findOne(id: number) {
    const structure = await this.prisma.structureTarifaire.findUnique({
      where: { id },
    });

    if (!structure) {
      throw new NotFoundException(
        `Structure tarifaire avec l'ID ${id} introuvable`,
      );
    }

    const structureWithNumber = {
      ...structure,
      valeur: Number(structure.valeur),
    };

    return this.formatResponse(
      structureWithNumber,
      'Structure récupérée',
      `Structure tarifaire "${structure.nom}" récupérée avec succès.`,
    );
  }

  async update(id: number, updateStructureTarifaireDto: UpdateStructureTarifaireDto) {
    // Vérifier si la structure existe
    const existingStructure = await this.prisma.structureTarifaire.findUnique({
      where: { id },
    });

    if (!existingStructure) {
      throw new NotFoundException(
        `Structure tarifaire avec l'ID ${id} introuvable`,
      );
    }

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (updateStructureTarifaireDto.nom && updateStructureTarifaireDto.nom !== existingStructure.nom) {
      const conflictingStructure = await this.prisma.structureTarifaire.findFirst({
        where: {
          nom: updateStructureTarifaireDto.nom,
          id: { not: id },
        },
      });

      if (conflictingStructure) {
        throw new ConflictException(
          `Une structure tarifaire avec le nom "${updateStructureTarifaireDto.nom}" existe déjà`,
        );
      }
    }

    // Pour la mise à jour : si valeur n'est pas fourni, on garde l'ancienne valeur
    // Si valeur est fourni, on prend la valeur fournie (même si c'est 0)
    const updatedStructure = await this.prisma.structureTarifaire.update({
      where: { id },
      data: updateStructureTarifaireDto,
    });

    const structureWithNumber = {
      ...updatedStructure,
      valeur: Number(updatedStructure.valeur),
    };

    return this.formatResponse(
      structureWithNumber,
      'Structure mise à jour',
      `Structure tarifaire "${updatedStructure.nom}" mise à jour avec succès.`,
    );
  }

  async remove(id: number) {
    const structure = await this.prisma.structureTarifaire.findUnique({
      where: { id },
    });

    if (!structure) {
      throw new NotFoundException(
        `Structure tarifaire avec l'ID ${id} introuvable`,
      );
    }

    // Vérifier si la structure est obligatoire
    if (structure.estObligatoire) {
      throw new BadRequestException(
        `Impossible de supprimer la structure tarifaire "${structure.nom}" car elle est marquée comme obligatoire. Veuillez d'abord modifier le champ estObligatoire à false avant de pouvoir la supprimer.`,
      );
    }

    await this.prisma.structureTarifaire.delete({
      where: { id },
    });

    return this.formatResponse(
      { id },
      'Structure supprimée',
      `Structure tarifaire "${structure.nom}" supprimée avec succès.`,
    );
  }

  async updateMultiple(updateData: UpdateMultipleStructureTarifaireDto) {
    const { structures } = updateData;
    const updatedStructures: any[] = [];
    const errors: string[] = [];

    // Récupérer tous les IDs pour vérifier leur existence
    const ids = structures.map(s => s.id);
    const existingStructures = await this.prisma.structureTarifaire.findMany({
      where: { id: { in: ids } },
      select: { id: true, nom: true },
    });

    const existingIds = new Set(existingStructures.map(s => s.id));
    const notFoundIds = ids.filter(id => !existingIds.has(id));

    if (notFoundIds.length > 0) {
      throw new NotFoundException(
        `Structure(s) tarifaire(s) avec les ID(s) ${notFoundIds.join(', ')} introuvable(s)`,
      );
    }

    // Vérifier les conflits de noms
    for (const structure of structures) {
      if (structure.nom) {
        const conflictingStructure = await this.prisma.structureTarifaire.findFirst({
          where: {
            nom: structure.nom,
            id: { not: structure.id },
          },
        });

        if (conflictingStructure) {
          errors.push(`Une structure tarifaire avec le nom "${structure.nom}" existe déjà (conflit avec ID ${structure.id})`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ConflictException(errors.join('; '));
    }

    // Effectuer les mises à jour
    for (const structure of structures) {
      const { id, ...updateData } = structure;
      
      const updatedStructure = await this.prisma.structureTarifaire.update({
        where: { id },
        data: updateData,
      });

      const structureWithNumber = {
        ...updatedStructure,
        valeur: Number(updatedStructure.valeur),
      };

      updatedStructures.push(structureWithNumber);
    }

    return this.formatResponse(
      updatedStructures,
      'Structures mises à jour',
      `${updatedStructures.length} structure(s) tarifaire(s) mise(s) à jour avec succès.`,
    );
  }
}
