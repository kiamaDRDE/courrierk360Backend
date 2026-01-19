// src/operateur/operateur.service.ts

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperateurDto } from './dto/create-operateur.dto';
import { UpdateOperateurDto } from './dto/update-operateur.dto';
import { OperateurQueryDto } from './dto/operateur-query.dto';

@Injectable()
export class OperateurService {
  constructor(private readonly prisma: PrismaService) {}

  // Fonction utilitaire pour formater les réponses
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

  // 🔐 API 1: Créer un opérateur
  async createOperateur(createOperateurDto: CreateOperateurDto) {
    const { nom, code, serviceIds, ...rest } = createOperateurDto;

    // Vérifier si le nom existe déjà (le nom doit rester unique)
    const existingNom = await this.prisma.operateur.findUnique({
      where: { nom },
    });

    if (existingNom) {
      throw new ConflictException(`Un opérateur avec le nom "${nom}" existe déjà.`);
    }

    // Vérifier que tous les services existent
    if (serviceIds && serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: {
          id: { in: serviceIds },
        },
      });

      if (services.length !== serviceIds.length) {
        throw new NotFoundException('Un ou plusieurs services spécifiés sont introuvables.');
      }
    }

    // Créer l'opérateur
    const operateur = await this.prisma.operateur.create({
      data: {
        nom,
        code,
        ...rest,
        services: {
          create: serviceIds?.map(serviceId => ({
            serviceId,
          })) || [],
        },
      },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return this.formatResponse(
      operateur,
      'Opérateur créé',
      `L'opérateur "${nom}" a été créé avec succès.`,
    );
  }

  // 🔐 API 2: Mettre à jour un opérateur
  async updateOperateur(id: number, updateOperateurDto: UpdateOperateurDto) {
    const { serviceIds, ...rest } = updateOperateurDto;

    // Vérifier si l'opérateur existe
    const operateur = await this.prisma.operateur.findUnique({
      where: { id },
    });

    if (!operateur) {
      throw new NotFoundException(`Opérateur avec l'ID ${id} introuvable.`);
    }

    // Vérifier l'unicité du nom si modifié (le nom doit rester unique)
    if (updateOperateurDto.nom) {
      const existingNom = await this.prisma.operateur.findUnique({
        where: { 
          nom: updateOperateurDto.nom,
        },
      });

      if (existingNom && existingNom.id !== id) {
        throw new ConflictException(
          `Un opérateur avec le nom "${updateOperateurDto.nom}" existe déjà.`,
        );
      }
    }

    // Vérifier que tous les services existent si serviceIds est fourni
    if (serviceIds && serviceIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: {
          id: { in: serviceIds },
        },
      });

      if (services.length !== serviceIds.length) {
        throw new NotFoundException('Un ou plusieurs services spécifiés sont introuvables.');
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = { ...rest };

    // Gérer la mise à jour des services si serviceIds est fourni
    if (serviceIds !== undefined) {
      updateData.services = {
        deleteMany: {}, // Supprimer toutes les relations existantes
        create: serviceIds.map(serviceId => ({
          serviceId,
        })),
      };
    }

    // Mettre à jour l'opérateur
    const updatedOperateur = await this.prisma.operateur.update({
      where: { id },
      data: updateData,
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return this.formatResponse(
      updatedOperateur,
      'Opérateur mis à jour',
      `L'opérateur "${updatedOperateur.nom}" a été mis à jour avec succès.`,
    );
  }

  // 🔐 API 3: Supprimer un opérateur
  async deleteOperateur(id: number) {
    // Vérifier si l'opérateur existe
    const operateur = await this.prisma.operateur.findUnique({
      where: { id },
    });

    if (!operateur) {
      throw new NotFoundException(`Opérateur avec l'ID ${id} introuvable.`);
    }

    // Supprimer l'opérateur
    await this.prisma.operateur.delete({
      where: { id },
    });

    return this.formatResponse(
      { id },
      'Opérateur supprimé',
      `L'opérateur "${operateur.nom}" a été supprimé avec succès.`,
    );
  }

  // 🔐 API 4: Lister les opérateurs avec pagination et filtres
  async listOperateurs(query: OperateurQueryDto) {
  const { page = 1, limit = 10, nom, code, type, service, statut, annee, anneeCreation } = query;

    // Construction des filtres
    const where: any = {};

    if (nom) {
      where.nom = { contains: nom };
    }

    if (code) {
      where.code = code;
    }

    if (type) {
      where.type = type;
    }

    if (service) {
      // Le paramètre service peut être :
      // - Un ID unique : "1"  
      // - Plusieurs IDs séparés par des virgules : "1,2,3"
      // - Un tableau JSON : "[1,2,3]"
      let serviceIds: number[] = [];
      
      try {
        // Essayer de parser comme JSON array d'abord
        const parsed = JSON.parse(service as string);
        if (Array.isArray(parsed)) {
          serviceIds = parsed.map(id => Number(id)).filter(id => !isNaN(id));
        }
      } catch (e) {
        // Pas du JSON, essayer de séparer par virgules
        const serviceStrings = String(service).split(',').map(s => s.trim());
        serviceIds = serviceStrings.map(s => Number(s)).filter(id => !isNaN(id));
      }

      if (serviceIds.length > 0) {
        // Filtrer par service en utilisant la relation
        where.services = {
          some: {
            serviceId: { in: serviceIds }
          }
        };
      }
    }

    if (statut) {
      where.statut = statut;
    }

    if (anneeCreation) {
      where.anneeCreation = anneeCreation;
    }

    if (annee) {
      where.annee = annee;
    }

    // Inclure les services dans la requête
    const include = {
      services: {
        include: {
          service: {
            select: {
              id: true,
              nom: true,
            },
          },
        },
      },
    };

    // Si limit = 0, récupérer tous les éléments
    if (limit === 0) {
      const operateursRaw = await this.prisma.operateur.findMany({
        where,
        include,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transformer les données pour simplifier la structure des services
      const operateurs = operateursRaw.map(operateur => ({
        ...operateur,
        services: operateur.services.map(s => ({
          id: s.service.id,
          nom: s.service.nom,
        })),
      }));

      // Retourner tous les opérateurs sans pagination
      return this.formatResponse(
        {
          operateurs: operateurs,
          pagination: {
            total: operateurs.length,
            page: 1,
            limit: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        'Liste des opérateurs',
        `${operateurs.length} opérateur(s) récupéré(s).`,
      );
    }

    // Pagination normale
    const skip = (page - 1) * limit;

    const [operateursRaw, total] = await Promise.all([
      this.prisma.operateur.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.operateur.count({ where }),
    ]);

    // Transformer les données pour simplifier la structure des services
    const operateurs = operateursRaw.map(operateur => ({
      ...operateur,
      services: operateur.services.map(s => ({
        id: s.service.id,
        nom: s.service.nom,
      })),
    }));

    const totalPages = Math.ceil(total / limit);

    // Retourner les opérateurs avec pagination
    return this.formatResponse(
      {
        operateurs: operateurs,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des opérateurs',
      `${operateurs.length} opérateur(s) récupéré(s) sur ${total} au total.`,
    );
  }

  // 🔐 API 5: Afficher un opérateur spécifique
  async getOperateurById(id: number) {
    const operateurRaw = await this.prisma.operateur.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    if (!operateurRaw) {
      throw new NotFoundException(`Opérateur avec l'ID ${id} introuvable.`);
    }

    // Transformer les données pour simplifier la structure des services
    const operateur = {
      ...operateurRaw,
      services: operateurRaw.services.map(s => ({
        id: s.service.id,
        nom: s.service.nom,
      })),
    };

    return this.formatResponse(
      operateur,
      'Détails de l\'opérateur',
      `Informations de l'opérateur "${operateur.nom}" récupérées avec succès.`,
    );
  }
}
