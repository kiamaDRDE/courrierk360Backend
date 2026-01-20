import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsommationMoyenneDto } from './dto/create-consommation-moyenne.dto';
import { UpdateConsommationMoyenneDto } from './dto/update-consommation-moyenne.dto';
import { QueryConsommationMoyenneDto } from './dto/query-consommation-moyenne.dto';

@Injectable()
export class ConsommationMoyenneService {
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

  async create(data: CreateConsommationMoyenneDto) {
    const { offreId, consommationsMoyennes } = data;

    // Vérifier si des consommations moyennes avec ces noms existent déjà
    const existingConsommations = await this.prisma.consommationMoyenne.findMany({
      where: {
        nom: { in: consommationsMoyennes.map(c => c.nom) },
      },
      select: { nom: true },
    });

    if (existingConsommations.length > 0) {
      const conflictingNames = existingConsommations.map(c => c.nom);
      throw new ConflictException(
        `Des consommations moyennes avec les noms suivants existent déjà : ${conflictingNames.join(', ')}`,
      );
    }

    // Vérifier l'offre si un offreId est fourni
    if (offreId) {
      const existingOffre = await this.prisma.offre.findUnique({
        where: { id: offreId },
        select: { id: true, nom: true },
      });

      if (!existingOffre) {
        throw new BadRequestException(
          `L'offre avec l'ID ${offreId} n'existe pas`,
        );
      }
    }

    // Créer les consommations moyennes
    const createdConsommations: any[] = [];
    
    for (const consommationData of consommationsMoyennes) {
      const consommation = await this.prisma.consommationMoyenne.create({
        data: {
          nom: consommationData.nom,
          offres: offreId ? {
            create: {
              offreId: offreId,
            },
          } : undefined,
        },
        include: {
          offres: {
            include: {
              offre: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      });

      const consommationWithOffres = {
        ...consommation,
        offres: consommation.offres.map(o => o.offre),
      };

      createdConsommations.push(consommationWithOffres);
    }

    return this.formatResponse(
      createdConsommations,
      'Consommations créées',
      `${createdConsommations.length} consommation(s) moyenne(s) créée(s) avec succès.`,
    );
  }

  async findAll(query: QueryConsommationMoyenneDto) {
    const { nom, page = 1, limit = 10 } = query;

    const where: any = {};

    if (nom) {
      where.nom = {
        contains: nom,
      };
    }

    const skip = (page - 1) * limit;

    const [consommations, total] = await Promise.all([
      this.prisma.consommationMoyenne.findMany({
        where,
        skip,
        take: limit,
        include: {
          offres: {
            include: {
              offre: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
        orderBy: [{ nom: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.consommationMoyenne.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const consommationsWithOffres = consommations.map(consommation => ({
      ...consommation,
      offres: consommation.offres.map(o => o.offre),
    }));

    return {
      success: true,
      statusCode: 200,
      code: 'success',
      title: 'Consommations récupérées',
      message: `${consommations.length} consommation(s) moyenne(s) trouvée(s).`,
      data: consommationsWithOffres,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const consommation = await this.prisma.consommationMoyenne.findUnique({
      where: { id },
      include: {
        offres: {
          include: {
            offre: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    if (!consommation) {
      throw new NotFoundException(
        `Consommation moyenne avec l'ID ${id} introuvable`,
      );
    }

    const consommationWithOffres = {
      ...consommation,
      offres: consommation.offres.map(o => o.offre),
    };

    return this.formatResponse(
      consommationWithOffres,
      'Consommation récupérée',
      `Consommation moyenne "${consommation.nom}" récupérée avec succès.`,
    );
  }

  async update(id: number, updateConsommationMoyenneDto: UpdateConsommationMoyenneDto) {
    const { offreId, nom } = updateConsommationMoyenneDto;

    // Vérifier si la consommation existe
    const existingConsommation = await this.prisma.consommationMoyenne.findUnique({
      where: { id },
    });

    if (!existingConsommation) {
      throw new NotFoundException(
        `Consommation moyenne avec l'ID ${id} introuvable`,
      );
    }

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (nom && nom !== existingConsommation.nom) {
      const conflictingConsommation = await this.prisma.consommationMoyenne.findFirst({
        where: {
          nom: nom,
          id: { not: id },
        },
      });

      if (conflictingConsommation) {
        throw new ConflictException(
          `Une consommation moyenne avec le nom "${nom}" existe déjà`,
        );
      }
    }

    // Si offreId est fourni, vérifier qu'elle existe
    if (offreId) {
      const existingOffre = await this.prisma.offre.findUnique({
        where: { id: offreId },
        select: { id: true, nom: true },
      });

      if (!existingOffre) {
        throw new BadRequestException(
          `L'offre avec l'ID ${offreId} n'existe pas`,
        );
      }
    }

    // Mettre à jour la consommation
    const updateData: any = {};
    if (nom !== undefined) updateData.nom = nom;

    if (offreId !== undefined) {
      updateData.offres = {
        deleteMany: {}, // Supprimer toutes les relations existantes
        create: offreId ? [{ offreId }] : [], // Créer la nouvelle relation si offreId existe
      };
    }

    const updatedConsommation = await this.prisma.consommationMoyenne.update({
      where: { id },
      data: updateData,
      include: {
        offres: {
          include: {
            offre: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    const consommationWithOffres = {
      ...updatedConsommation,
      offres: updatedConsommation.offres.map(o => o.offre),
    };

    return this.formatResponse(
      consommationWithOffres,
      'Consommation mise à jour',
      `Consommation moyenne "${updatedConsommation.nom}" mise à jour avec succès.`,
    );
  }

  async remove(id: number) {
    const consommation = await this.prisma.consommationMoyenne.findUnique({
      where: { id },
      select: { id: true, nom: true },
    });

    if (!consommation) {
      throw new NotFoundException(
        `Consommation moyenne avec l'ID ${id} introuvable`,
      );
    }

    await this.prisma.consommationMoyenne.delete({
      where: { id },
    });

    return this.formatResponse(
      { id: consommation.id, nom: consommation.nom },
      'Consommation supprimée',
      `Consommation moyenne "${consommation.nom}" supprimée avec succès.`,
    );
  }
}
