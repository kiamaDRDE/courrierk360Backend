import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvantageDto } from './dto/create-avantage.dto';
import { UpdateAvantageDto } from './dto/update-avantage.dto';
import { QueryAvantageDto } from './dto/query-avantage.dto';
import { UpdateMultipleAvantageDto, UpdateAvantageItemDto } from './dto/update-multiple-avantage.dto';

@Injectable()
export class AvantageService {
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

  async create(createAvantageDto: CreateAvantageDto) {
    const { avantages } = createAvantageDto;

    // Vérifier si des avantages avec les mêmes noms existent déjà
    const existingAvantages = await this.prisma.avantage.findMany({
      where: {
        nom: { in: avantages.map(a => a.nom) },
      },
      select: { nom: true },
    });

    if (existingAvantages.length > 0) {
      const conflictingNames = existingAvantages.map(a => a.nom);
      throw new ConflictException(
        `Des avantages avec les noms suivants existent déjà : ${conflictingNames.join(', ')}`,
      );
    }

    // Créer les avantages
    const createdAvantages: any[] = [];
    
    for (const avantageData of avantages) {
      const avantage = await this.prisma.avantage.create({
        data: {
          nom: avantageData.nom,
          isGratuit: avantageData.isGratuit ?? false, // Valeur par défaut : false si non spécifiée
        },
      });

      createdAvantages.push(avantage);
    }

    return this.formatResponse(
      createdAvantages,
      'Avantages créés',
      `${avantages.length} avantage(s) créé(s) avec succès.`,
    );
  }

  async findAll(query: QueryAvantageDto) {
    const { nom, isGratuit, page = 1, limit = 10 } = query;

    const where: any = {};

    if (nom) {
      where.nom = {
        contains: nom,
      };
    }

    if (isGratuit !== undefined) {
      where.isGratuit = isGratuit;
    }

    const skip = (page - 1) * limit;

    const [avantages, total] = await Promise.all([
      this.prisma.avantage.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ nom: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.avantage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return this.formatResponse(
      {
        avantages: avantages,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des avantages',
      `${avantages.length} avantage(s) sur ${total} récupéré(s) avec succès.`,
    );
  }

  async findOne(id: number) {
    const avantage = await this.prisma.avantage.findUnique({
      where: { id },
    });

    if (!avantage) {
      throw new NotFoundException(
        `Avantage avec l'ID ${id} introuvable`,
      );
    }

    return this.formatResponse(
      avantage,
      'Avantage récupéré',
      `Avantage "${avantage.nom}" récupéré avec succès.`,
    );
  }

  async update(id: number, updateAvantageDto: UpdateAvantageDto) {
    const { nom, isGratuit } = updateAvantageDto;

    // Vérifier si l'avantage existe
    const existingAvantage = await this.prisma.avantage.findUnique({
      where: { id },
    });

    if (!existingAvantage) {
      throw new NotFoundException(
        `Avantage avec l'ID ${id} introuvable`,
      );
    }

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (nom && nom !== existingAvantage.nom) {
      const conflictingAvantage = await this.prisma.avantage.findFirst({
        where: {
          nom: nom,
          id: { not: id },
        },
      });

      if (conflictingAvantage) {
        throw new ConflictException(
          `Un avantage avec le nom "${nom}" existe déjà`,
        );
      }
    }

    // Mettre à jour l'avantage
    const updateData: any = {};
    if (nom !== undefined) updateData.nom = nom;
    if (isGratuit !== undefined) updateData.isGratuit = isGratuit;

    const updatedAvantage = await this.prisma.avantage.update({
      where: { id },
      data: updateData,
    });

    return this.formatResponse(
      updatedAvantage,
      'Avantage mis à jour',
      `Avantage "${updatedAvantage.nom}" mis à jour avec succès.`,
    );
  }

  async remove(id: number) {
    const avantage = await this.prisma.avantage.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            option: {
              select: { id: true, nom: true }
            }
          }
        },
      },
    });

    if (!avantage) {
      throw new NotFoundException(
        `Avantage avec l'ID ${id} introuvable`,
      );
    }

    // Collecter les informations sur les liaisons pour le message de retour
    const optionsLiees = avantage.options.map(opa => opa.option);
    const totalLiaisons = optionsLiees.length;
    
    // Messages informatifs sur les liaisons qui seront supprimées
    const liaisonsInfo: string[] = [];
    if (optionsLiees.length > 0) {
      liaisonsInfo.push(`${optionsLiees.length} option(s): ${optionsLiees.map(o => o.nom).join(', ')}`);
    }

    // Supprimer l'avantage (les liaisons avec les options seront supprimées automatiquement grâce à onDelete: Cascade)
    await this.prisma.avantage.delete({
      where: { id },
    });

    // Message de retour détaillé
    let message = `Avantage "${avantage.nom}" supprimé avec succès.`;
    if (totalLiaisons > 0) {
      message += ` Les liaisons suivantes ont été supprimées automatiquement: ${liaisonsInfo.join(', ')}.`;
    }

    return this.formatResponse(
      { 
        id,
        liaisonsSupprimeesCount: totalLiaisons,
        optionsLiees: optionsLiees.map(o => ({ id: o.id, nom: o.nom }))
      },
      'Avantage supprimé',
      message,
    );
  }

  async updateMultiple(updateData: UpdateMultipleAvantageDto) {
    const { avantages } = updateData;
    const updatedAvantages: any[] = [];
    const errors: string[] = [];

    // Récupérer tous les IDs pour vérifier leur existence
    const ids = avantages.map(a => a.id);
    const existingAvantages = await this.prisma.avantage.findMany({
      where: { id: { in: ids } },
      select: { id: true, nom: true },
    });

    const existingIds = new Set(existingAvantages.map(a => a.id));
    const notFoundIds = ids.filter(id => !existingIds.has(id));

    if (notFoundIds.length > 0) {
      throw new NotFoundException(
        `Avantage(s) avec les ID(s) ${notFoundIds.join(', ')} introuvable(s)`,
      );
    }

    // Vérifier les conflits de noms
    for (const avantage of avantages) {
      if (avantage.nom) {
        const conflictingAvantage = await this.prisma.avantage.findFirst({
          where: {
            nom: avantage.nom,
            id: { not: avantage.id },
          },
        });

        if (conflictingAvantage) {
          errors.push(`Un avantage avec le nom "${avantage.nom}" existe déjà (conflit avec ID ${avantage.id})`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ConflictException(errors.join('; '));
    }

    // Effectuer les mises à jour
    for (const avantage of avantages) {
      const { id, nom } = avantage;
      
      // Préparer les données de mise à jour
      const updateData: any = {};
      if (nom !== undefined) updateData.nom = nom;

      const updatedAvantage = await this.prisma.avantage.update({
        where: { id },
        data: updateData,
      });

      updatedAvantages.push(updatedAvantage);
    }

    return this.formatResponse(
      updatedAvantages,
      'Avantages mis à jour',
      `${updatedAvantages.length} avantage(s) mis à jour avec succès.`,
    );
  }
}
