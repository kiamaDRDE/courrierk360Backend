import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTarifInterconnexionDto } from './dto/create-tarif-interconnexion.dto';
import { UpdateTarifInterconnexionDto } from './dto/update-tarif-interconnexion.dto';
import { QueryTarifInterconnexionDto } from './dto/query-tarif-interconnexion.dto';

@Injectable()
export class TarifInterconnexionService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(createDto: CreateTarifInterconnexionDto) {
    const { serviceIds, ...rest } = createDto;

    // Vérifier si l'opérateur existe
    const operateur = await this.prisma.operateur.findUnique({
      where: { id: createDto.operateurId },
    });

    if (!operateur) {
      throw new NotFoundException(
        `Opérateur avec l'ID ${createDto.operateurId} introuvable`,
      );
    }

    // Vérifier si un tarif avec le même type existe déjà pour cet opérateur et cette année
    const existingTarif = await this.prisma.tarifInterconnexion.findFirst({
      where: {
        operateurId: createDto.operateurId,
        annee: createDto.annee,
        typeTarif: createDto.typeTarif,
      },
    });

    if (existingTarif) {
      throw new BadRequestException(
        `Un tarif d'interconnexion de type "${createDto.typeTarif}" existe déjà pour l'opérateur "${operateur.nom}" pour l'année ${createDto.annee}`,
      );
    }

    // Vérifier qu'il n'y a pas plus de 2 tarifs pour cette année et cet opérateur
    const tarifsCount = await this.prisma.tarifInterconnexion.count({
      where: {
        operateurId: createDto.operateurId,
        annee: createDto.annee,
      },
    });

    if (tarifsCount >= 2) {
      throw new BadRequestException(
        `L'opérateur "${operateur.nom}" a déjà 2 tarifs pour l'année ${createDto.annee}. Maximum autorisé atteint.`,
      );
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

    const data: any = {
      operateurId: createDto.operateurId,
      annee: createDto.annee,
      tarifOffNetHeureCreuse: createDto.tarifOffNetHeureCreuse,
      tarifOffNetHeurePleine: createDto.tarifOffNetHeurePleine,
      tarifOnNetHeureCreuse: createDto.tarifOnNetHeureCreuse,
      tarifOnNetHeurePleine: createDto.tarifOnNetHeurePleine,
      typeTarif: createDto.typeTarif,
      description: createDto.description,
      services: {
        create: serviceIds?.map(serviceId => ({
          serviceId,
        })) || [],
      },
    };

    const tarif = await this.prisma.tarifInterconnexion.create({
      data,
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
          },
        },
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

    // Transformer les services pour simplifier la structure
    const tarifWithSimpleServices = {
      ...tarif,
      tarifOffNetHeureCreuse: Number((tarif as any).tarifOffNetHeureCreuse),
      tarifOffNetHeurePleine: Number((tarif as any).tarifOffNetHeurePleine),
      tarifOnNetHeureCreuse: Number((tarif as any).tarifOnNetHeureCreuse),
      tarifOnNetHeurePleine: Number((tarif as any).tarifOnNetHeurePleine),
      services: tarif.services.map(s => ({
        id: s.service.id,
        nom: s.service.nom,
      })),
    };

    return this.formatResponse(
      tarifWithSimpleServices,
      'Tarif créé',
      `Tarif d'interconnexion pour "${operateur.nom}" (${createDto.annee}) créé avec succès.`,
    );
  }

  async findAll(query: QueryTarifInterconnexionDto) {
    const { operateurId, annee, typeTarif, service, search, page = 1, limit = 10 } = query;

    const where: any = {};

    if (operateurId) {
      where.operateurId = operateurId;
    }

    if (annee) {
      where.annee = annee;
    }

    if (typeTarif) {
      where.typeTarif = typeTarif;
    }

    // Recherche globale
    if (search) {
      const searchTerm = search.trim();
      const searchNumber = parseFloat(searchTerm);
      const isNumeric = !isNaN(searchNumber);

      where.OR = [
        // Recherche dans le nom de l'opérateur
        {
          operateur: {
            nom: {
              contains: searchTerm
            }
          }
        },
        // Recherche dans le code de l'opérateur
        {
          operateur: {
            code: {
              contains: searchTerm
            }
          }
        },
        // Recherche dans le type de tarif
        {
          typeTarif: {
            contains: searchTerm
          }
        },
        // Recherche dans la description
        {
          description: {
            contains: searchTerm
          }
        }
      ];

      // Si c'est numérique, rechercher aussi dans les tarifs et l'année
      if (isNumeric) {
        where.OR.push(
          { annee: Math.floor(searchNumber) },
          { tarifOffNetHeureCreuse: searchNumber },
          { tarifOffNetHeurePleine: searchNumber },
          { tarifOnNetHeureCreuse: searchNumber },
          { tarifOnNetHeurePleine: searchNumber }
        );
      }
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

    // Cas où limit = 0 : récupérer tous les tarifs
    if (limit === 0) {
      const tarifsRaw = await this.prisma.tarifInterconnexion.findMany({
        where,
        include: {
          operateur: {
            select: {
              id: true,
              nom: true,
              code: true,
              type: true,
              statut: true,
            },
          },
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
        orderBy: [{ annee: 'desc' }, { operateur: { nom: 'asc' } }],
      });

      const tarifsFormatted = tarifsRaw.map((tarif) => ({
        ...tarif,
        tarifOffNetHeureCreuse: Number((tarif as any).tarifOffNetHeureCreuse),
        tarifOffNetHeurePleine: Number((tarif as any).tarifOffNetHeurePleine),
        tarifOnNetHeureCreuse: Number((tarif as any).tarifOnNetHeureCreuse),
        tarifOnNetHeurePleine: Number((tarif as any).tarifOnNetHeurePleine),
        operateur: tarif.operateur,
        services: tarif.services?.map(s => ({
          id: s.service.id,
          nom: s.service.nom,
        })),
      }));

      return this.formatResponse(
        {
          tarifs: tarifsFormatted,
        },
        'Liste des tarifs',
        `${tarifsFormatted.length} tarif(s) d'interconnexion récupéré(s) avec succès.`,
      );
    }

    // Cas avec pagination
    const [tarifsRaw, total] = await Promise.all([
      this.prisma.tarifInterconnexion.findMany({
        where,
        include: {
          operateur: {
            select: {
              id: true,
              nom: true,
              code: true,
              type: true,
              statut: true,
            },
          },
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ annee: 'desc' }, { operateur: { nom: 'asc' } }],
      }),
      this.prisma.tarifInterconnexion.count({ where }),
    ]);

    const tarifsFormatted = tarifsRaw.map((tarif) => ({
      ...tarif,
      tarifOffNetHeureCreuse: Number((tarif as any).tarifOffNetHeureCreuse),
      tarifOffNetHeurePleine: Number((tarif as any).tarifOffNetHeurePleine),
      tarifOnNetHeureCreuse: Number((tarif as any).tarifOnNetHeureCreuse),
      tarifOnNetHeurePleine: Number((tarif as any).tarifOnNetHeurePleine),
      services: tarif.services.map(s => ({
        id: s.service.id,
        nom: s.service.nom,
      })),
    }));

    const totalPages = Math.ceil(total / limit);

    return this.formatResponse(
      {
        tarifs: tarifsFormatted,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des tarifs',
      `${tarifsFormatted.length} tarif(s) d'interconnexion sur ${total} récupéré(s) avec succès.`,
    );
  }

  async findOne(id: number) {
    const tarifRaw = await this.prisma.tarifInterconnexion.findUnique({
      where: { id },
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            statut: true,
          },
        },
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

    if (!tarifRaw) {
      throw new NotFoundException(
        `Tarif d'interconnexion avec l'ID ${id} introuvable`,
      );
    }

    // Transformer les services pour simplifier la structure
    const tarif = {
      ...tarifRaw,
      tarifOffNetHeureCreuse: Number((tarifRaw as any).tarifOffNetHeureCreuse),
      tarifOffNetHeurePleine: Number((tarifRaw as any).tarifOffNetHeurePleine),
      tarifOnNetHeureCreuse: Number((tarifRaw as any).tarifOnNetHeureCreuse),
      tarifOnNetHeurePleine: Number((tarifRaw as any).tarifOnNetHeurePleine),
      services: tarifRaw.services.map(s => ({
        id: s.service.id,
        nom: s.service.nom,
      })),
    };

    return this.formatResponse(
      tarif,
      'Tarif récupéré',
      `Tarif d'interconnexion pour "${tarif.operateur.nom}" (${tarif.annee}) récupéré avec succès.`,
    );
  }

  async update(id: number, updateDto: UpdateTarifInterconnexionDto) {
    const { serviceIds, ...data } = updateDto;

    // Vérifier si le tarif existe
    const existingTarif = await this.prisma.tarifInterconnexion.findUnique({
      where: { id },
      include: { operateur: true },
    });

    if (!existingTarif) {
      throw new NotFoundException(
        `Tarif d'interconnexion avec l'ID ${id} introuvable`,
      );
    }

    // Valider les services s'ils sont fournis
    if (serviceIds && serviceIds.length > 0) {
      const existingServices = await this.prisma.service.findMany({
        where: { id: { in: serviceIds } }
      });
      
      if (existingServices.length !== serviceIds.length) {
        const existingIds = existingServices.map(s => s.id);
        const missingIds = serviceIds.filter(id => !existingIds.includes(id));
        throw new BadRequestException(`Services non trouvés avec les IDs: ${missingIds.join(', ')}`);
      }
    }

    // Si on change l'opérateur ou l'année, vérifier la contrainte unique
    if (data.operateurId || data.annee) {
      const newOperateurId = data.operateurId || existingTarif.operateurId;
      const newAnnee = data.annee || existingTarif.annee;

      // Vérifier si l'opérateur existe
      if (data.operateurId) {
        const operateur = await this.prisma.operateur.findUnique({
          where: { id: data.operateurId },
        });

        if (!operateur) {
          throw new NotFoundException(
            `Opérateur avec l'ID ${data.operateurId} introuvable`,
          );
        }
      }

      // Vérifier si un autre tarif existe pour cette combinaison  
      const conflictingTarif = await this.prisma.tarifInterconnexion.findFirst({
        where: {
          operateurId: newOperateurId,
          annee: newAnnee,
          typeTarif: data.typeTarif || 'Standard',
          NOT: { id },
        },
      });

      if (conflictingTarif && conflictingTarif.id !== id) {
        throw new BadRequestException(
          `Un tarif d'interconnexion existe déjà pour cet opérateur pour l'année ${newAnnee}`,
        );
      }
    }

    const updatedTarif = await this.prisma.tarifInterconnexion.update({
      where: { id },
      data: {
        ...data,
        services: serviceIds ? {
          deleteMany: {}, // Supprimer toutes les relations existantes
          create: serviceIds.map(serviceId => ({ serviceId }))
        } : undefined
      },
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
          },
        },
        services: {
          include: {
            service: {
              select: { id: true, nom: true }
            }
          }
        }
      },
    });

    const tarifWithSimpleServices = {
      ...updatedTarif,
      tarifOffNetHeureCreuse: Number((updatedTarif as any).tarifOffNetHeureCreuse),
      tarifOffNetHeurePleine: Number((updatedTarif as any).tarifOffNetHeurePleine),
      tarifOnNetHeureCreuse: Number((updatedTarif as any).tarifOnNetHeureCreuse),
      tarifOnNetHeurePleine: Number((updatedTarif as any).tarifOnNetHeurePleine),
      services: updatedTarif.services.map(ts => ts.service)
    };

    return this.formatResponse(
      tarifWithSimpleServices,
      'Tarif mis à jour',
      `Tarif d'interconnexion pour "${updatedTarif.operateur.nom}" (${updatedTarif.annee}) mis à jour avec succès.`,
    );
  }

  async remove(id: number) {
    const tarif = await this.prisma.tarifInterconnexion.findUnique({
      where: { id },
      include: { operateur: true },
    });

    if (!tarif) {
      throw new NotFoundException(
        `Tarif d'interconnexion avec l'ID ${id} introuvable`,
      );
    }

    await this.prisma.tarifInterconnexion.delete({
      where: { id },
    });

    return this.formatResponse(
      null,
      'Tarif supprimé',
      `Tarif d'interconnexion pour "${tarif.operateur.nom}" (${tarif.annee}) supprimé avec succès.`,
    );
  }

  async findByOperateurAndAnnee(operateurId: number, annee: number) {
    const tarifs = await this.prisma.tarifInterconnexion.findMany({
      where: {
        operateurId,
        annee,
      },
      include: {
        operateur: {
          select: {
            id: true,
            nom: true,
            code: true,
            type: true,
            statut: true,
          },
        },
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
      orderBy: {
        typeTarif: 'asc',
      },
    });

    if (!tarifs || tarifs.length === 0) {
      throw new NotFoundException(
        `Aucun tarif d'interconnexion trouvé pour l'opérateur ID ${operateurId} pour l'année ${annee}`,
      );
    }

    const tarifsFormatted = tarifs.map((tarif) => ({
      ...tarif,
      tarifOffNetHeureCreuse: Number((tarif as any).tarifOffNetHeureCreuse),
      tarifOffNetHeurePleine: Number((tarif as any).tarifOffNetHeurePleine),
      tarifOnNetHeureCreuse: Number((tarif as any).tarifOnNetHeureCreuse),
      tarifOnNetHeurePleine: Number((tarif as any).tarifOnNetHeurePleine),
      services: tarif.services?.map(s => ({
        id: s.service.id,
        nom: s.service.nom,
      })) || [],
    }));

    const operateurNom = tarifs[0].operateur.nom;
    const message = tarifs.length === 1 
      ? `Tarif d'interconnexion pour "${operateurNom}" (${annee}) récupéré avec succès.`
      : `${tarifs.length} tarifs d'interconnexion pour "${operateurNom}" (${annee}) récupérés avec succès.`;

    return this.formatResponse(
      {
        tarifs: tarifsFormatted,
        operateur: tarifs[0].operateur,
        annee,
        count: tarifs.length,
      },
      'Tarifs récupérés',
      message,
    );
  }
}
