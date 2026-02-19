// src/coffre/coffre.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMultipleCoffresDto } from './dto/create-multiple-coffres.dto';
import { UpdateCoffreDto } from './dto/update-coffre.dto';
import { CoffreQueryDto } from './dto/coffre-query.dto';
import { GroupedCoffreQueryDto } from './dto/grouped-coffre-query.dto';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';

@Injectable()
export class CoffreService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
  ) {}

  // 📝 Créer plusieurs coffres dans une salle
  async createMultiple(createMultipleCoffresDto: CreateMultipleCoffresDto) {
    const { idSalle, coffres } = createMultipleCoffresDto;

    // Vérifier que la salle existe
    const salle = await this.prismaService.salle.findFirst({
      where: { id: idSalle, isDelete: false },
    });

    if (!salle) {
      throw new BadRequestException(`La salle avec l'ID ${idSalle} n'existe pas.`);
    }

    // Vérifier l'unicité des noms dans la requête
    const noms = coffres.map(c => c.nom);
    const duplicatesInRequest = noms.filter((nom, index) => noms.indexOf(nom) !== index);
    if (duplicatesInRequest.length > 0) {
      throw new BadRequestException(`Noms de coffres dupliqués dans la requête : ${duplicatesInRequest.join(', ')}`);
    }

    // Vérifier que les noms n'existent pas déjà en base
    const existingCoffres = await this.prismaService.coffre.findMany({
      where: {
        nom: { in: noms },
        isDelete: false,
      },
    });

    if (existingCoffres.length > 0) {
      const existingNames = existingCoffres.map(c => c.nom).join(', ');
      throw new BadRequestException(`Les coffres suivants existent déjà : ${existingNames}`);
    }

    // Créer les coffres
    const createdCoffres = await this.prismaService.$transaction(
      coffres.map(coffre =>
        this.prismaService.coffre.create({
          data: {
            nom: coffre.nom,
            tailleMaximale: coffre.tailleMaximale ?? 20, // Défaut: 20
            nombrePlaceActuelle: 0, // Initialement vide
            idSalle,
            isActive: coffre.isActive ?? true, // Défaut: true
          },
        }),
      ),
    );

    return this.responseFormatter.success(
      {
        idSalle,
        coffres: createdCoffres,
        totalCreated: createdCoffres.length,
      },
      'Création coffres',
      `${createdCoffres.length} coffre(s) créé(s) avec succès.`,
    );
  }

  // 📋 Liste de tous les coffres avec filtres et pagination
  async findAll(query: CoffreQueryDto) {
    const { page = 1, limit = 10, search, isActive, isDelete, idSalle } = query;

    // Construction des filtres
    const where: any = {};

    // Filtre par recherche globale
    if (search) {
      where.nom = { contains: search };
    }

    // Filtre par statut actif
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filtre par suppression logique
    if (isDelete !== undefined) {
      where.isDelete = isDelete;
    } else {
      // Par défaut, exclure les coffres supprimés
      where.isDelete = false;
    }

    // Filtre par salle
    if (idSalle !== undefined) {
      where.idSalle = idSalle;
    }

    const total = await this.prismaService.coffre.count({ where });

    // Si limit est 0, retourner tous les résultats
    if (limit === 0) {
      const coffres = await this.prismaService.coffre.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return this.responseFormatter.success(
        {
          coffres,
          pagination: {
            total,
            page: 1,
            limit: total,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        'Liste des coffres',
        `${total} coffre(s) récupéré(s) avec succès.`,
      );
    }

    // Pagination normale
    const skip = this.paginationService.getSkip(page, limit);
    const totalPages = Math.ceil(total / limit);

    const coffres = await this.prismaService.coffre.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return this.responseFormatter.success(
      {
        coffres,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des coffres',
      `${coffres.length} coffre(s) sur ${total} récupéré(s) avec succès.`,
    );
  }

  // 🔍 Récupérer un coffre par ID
  async findOne(id: number) {
    const coffre = await this.prismaService.coffre.findUnique({
      where: { id },
    });

    if (!coffre) {
      throw new NotFoundException('Coffre non trouvé.');
    }

    return this.responseFormatter.success(
      coffre,
      'Détails du coffre',
      'Coffre récupéré avec succès.',
    );
  }

  // ✏️ Mettre à jour un coffre
  async update(id: number, updateCoffreDto: UpdateCoffreDto) {
    // Vérifier si le coffre existe
    const existingCoffre = await this.prismaService.coffre.findUnique({
      where: { id },
    });

    if (!existingCoffre) {
      throw new NotFoundException('Coffre non trouvé.');
    }

    // Vérifier l'unicité du nom si modifié
    if (updateCoffreDto.nom && updateCoffreDto.nom !== existingCoffre.nom) {
      const duplicateCoffre = await this.prismaService.coffre.findFirst({
        where: {
          nom: updateCoffreDto.nom,
          isDelete: false,
          id: { not: id },
        },
      });

      if (duplicateCoffre) {
        throw new BadRequestException('Un coffre avec ce nom existe déjà.');
      }
    }

    // Vérifier que la salle existe si modifiée
    if (updateCoffreDto.idSalle) {
      const salle = await this.prismaService.salle.findFirst({
        where: { id: updateCoffreDto.idSalle, isDelete: false },
      });

      if (!salle) {
        throw new BadRequestException(`La salle avec l'ID ${updateCoffreDto.idSalle} n'existe pas.`);
      }
    }

    const updatedCoffre = await this.prismaService.coffre.update({
      where: { id },
      data: updateCoffreDto,
    });

    return this.responseFormatter.success(
      updatedCoffre,
      'Mise à jour coffre',
      'Coffre mis à jour avec succès.',
    );
  }

  // 🗑️ Suppression logique (soft delete)
  async softDelete(id: number) {
    const coffre = await this.prismaService.coffre.findUnique({
      where: { id },
    });

    if (!coffre) {
      throw new NotFoundException('Coffre non trouvé.');
    }

    if (coffre.isDelete) {
      throw new BadRequestException('Ce coffre est déjà supprimé.');
    }

    const deletedCoffre = await this.prismaService.coffre.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.success(
      { id: deletedCoffre.id },
      'Suppression logique',
      'Coffre supprimé logiquement avec succès.',
    );
  }

  // 🗑️ Suppression définitive (hard delete)
  async hardDelete(id: number) {
    const coffre = await this.prismaService.coffre.findUnique({
      where: { id },
    });

    if (!coffre) {
      throw new NotFoundException('Coffre non trouvé.');
    }

    await this.prismaService.coffre.delete({
      where: { id },
    });

    return this.responseFormatter.success(
      { id },
      'Suppression définitive',
      'Coffre supprimé définitivement avec succès.',
    );
  }

  // 📂 Liste des coffres groupés par salle
  async findGroupedBySalle(filters?: GroupedCoffreQueryDto) {
    // LOG: Filtres reçus
    console.log('=== COFFRES GROUPÉS PAR SALLE - DÉBUT ===');
    console.log('Filtres reçus:', JSON.stringify(filters, null, 2));
    
    const { page = 1, limit = 10, coffrePage = 1, coffreLimit = 10 } = filters || {};

    // Construction des filtres pour les salles (filtres indépendants)
    const salleWhere: any = { isDelete: false };

    // Filtre par ID de salle spécifique
    if (filters?.idSalle) {
      salleWhere.id = filters.idSalle;
    }

    // Construction des filtres pour les coffres (filtres indépendants)
    const coffreWhere: any = { isDelete: false };

    // Filtre par statut actif
    if (filters?.isActive !== undefined) {
      console.log('Filtre isActive détecté:');
      console.log('  - Type:', typeof filters.isActive);
      console.log('  - Valeur:', filters.isActive);
      console.log('  - Est boolean:', filters.isActive === true || filters.isActive === false);
      
      coffreWhere.isActive = filters.isActive;
      
      console.log('  - Filtre appliqué aux coffres:', coffreWhere.isActive);
    } else {
      console.log('Aucun filtre isActive (undefined) - tous les coffres retournés');
    }

    // Filtre par recherche sur le nom du coffre
    if (filters?.search) {
      coffreWhere.nom = { contains: filters.search };
    }

    console.log('Filtre coffres final:', JSON.stringify(coffreWhere, null, 2));

    // Compter le total de salles
    const totalSalles = await this.prismaService.salle.count({ where: salleWhere });

    // Pagination des salles
    const skipSalles = limit === 0 ? 0 : this.paginationService.getSkip(page, limit);
    const takeSalles = limit === 0 ? undefined : limit;

    // Pagination des coffres
    const skipCoffres = coffreLimit === 0 ? 0 : this.paginationService.getSkip(coffrePage, coffreLimit);
    const takeCoffres = coffreLimit === 0 ? undefined : coffreLimit;

    // Récupérer les salles avec pagination
    const salles = await this.prismaService.salle.findMany({
      where: salleWhere,
      skip: skipSalles,
      take: takeSalles,
      include: {
        coffres: {
          where: coffreWhere,
          skip: skipCoffres,
          take: takeCoffres,
          orderBy: { nom: 'asc' },
        },
      },
      orderBy: { nom: 'asc' },
    });

    console.log(`Nombre de salles récupérées: ${salles.length}`);
    salles.forEach((salle, index) => {
      console.log(`Salle ${index + 1}: ${salle.nom}`);
      console.log(`  - Nombre de coffres: ${salle.coffres.length}`);
      if (salle.coffres.length > 0) {
        console.log(`  - Coffres:`, salle.coffres.map(c => ({
          nom: c.nom,
          isActive: c.isActive
        })));
      }
    });

    // Compter le total de coffres pour chaque salle
    const sallesWithCounts = await Promise.all(
      salles.map(async (salle) => {
        const totalCoffresSalle = await this.prismaService.coffre.count({
          where: { ...coffreWhere, idSalle: salle.id },
        });
        return { ...salle, totalCoffresSalle };
      }),
    );

    // Formater la réponse groupée
    const groupedData = sallesWithCounts.map(salle => ({
      salle: {
        id: salle.id,
        nom: salle.nom,
        isActive: salle.isActive,
        isDelete: salle.isDelete,
        createdAt: salle.createdAt,
        updatedAt: salle.updatedAt,
      },
      coffres: salle.coffres.map(coffre => ({
        id: coffre.id,
        nom: coffre.nom,
        nombrePlaceActuelle: coffre.nombrePlaceActuelle,
        tailleMaximale: coffre.tailleMaximale,
        idSalle: coffre.idSalle,
        isActive: coffre.isActive,
        isDelete: coffre.isDelete,
        createdAt: coffre.createdAt,
        updatedAt: coffre.updatedAt,
      })),
      totalCoffres: salle.totalCoffresSalle,
      coffresPagination: {
        total: salle.totalCoffresSalle,
        page: coffrePage,
        limit: coffreLimit,
        totalPages: coffreLimit === 0 ? 1 : Math.ceil(salle.totalCoffresSalle / coffreLimit),
        hasNextPage: coffreLimit === 0 ? false : coffrePage < Math.ceil(salle.totalCoffresSalle / coffreLimit),
        hasPreviousPage: coffrePage > 1,
      },
      placesTotales: salle.coffres.reduce((sum, coffre) => sum + coffre.tailleMaximale, 0),
      placesOccupees: salle.coffres.reduce((sum, coffre) => sum + coffre.nombrePlaceActuelle, 0),
    }));

    const totalCoffresGlobal = groupedData.reduce((sum, group) => sum + group.totalCoffres, 0);
    const totalPagesSalles = limit === 0 ? 1 : Math.ceil(totalSalles / limit);

    console.log('=== RÉSUMÉ ===');
    console.log(`Total salles: ${totalSalles}`);
    console.log(`Total coffres global: ${totalCoffresGlobal}`);
    console.log(`Salles retournées: ${groupedData.length}`);
    console.log('=== FIN ===\n');

    return this.responseFormatter.success(
      {
        salles: groupedData,
        sallesPagination: {
          total: totalSalles,
          page,
          limit,
          totalPages: totalPagesSalles,
          hasNextPage: limit === 0 ? false : page < totalPagesSalles,
          hasPreviousPage: page > 1,
        },
        resume: {
          totalSalles,
          totalCoffres: totalCoffresGlobal,
          totalPlacesDisponibles: groupedData.reduce((sum, group) => sum + group.placesTotales, 0),
          totalPlacesOccupees: groupedData.reduce((sum, group) => sum + group.placesOccupees, 0),
        },
      },
      'Coffres groupés par salle',
      `${groupedData.length} salle(s) sur ${totalSalles} avec ${totalCoffresGlobal} coffre(s) au total récupéré(s) avec succès.`,
    );
  }
}
