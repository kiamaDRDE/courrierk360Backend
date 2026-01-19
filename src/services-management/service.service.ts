import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@Injectable()
export class ServiceService {
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

  async create(data: CreateServiceDto | CreateServiceDto[]) {
    // Vérifier si c'est un tableau ou un seul objet
    const isArray = Array.isArray(data);
    const services = isArray ? data : [data];

    // Vérifier si des services avec ces noms existent déjà
    const existingServices = await this.prisma.service.findMany({
      where: {
        nom: { in: services.map(s => s.nom) },
      },
      select: { nom: true },
    });

    if (existingServices.length > 0) {
      const conflictingNames = existingServices.map(s => s.nom);
      if (isArray) {
        throw new ConflictException(
          `Des services avec les noms suivants existent déjà : ${conflictingNames.join(', ')}.`,
        );
      } else {
        throw new ConflictException(
          `Un service avec le nom "${conflictingNames[0]}" existe déjà.`,
        );
      }
    }

    // Créer les services
    const createdServices: any[] = [];
    
    for (const serviceData of services) {
      const newService = await this.prisma.service.create({
        data: serviceData,
      });

      createdServices.push(newService);
    }

    // Retourner la réponse selon le format d'entrée
    if (isArray) {
      return this.formatResponse(
        createdServices,
        'Services créés',
        `${createdServices.length} service(s) créé(s) avec succès.`,
      );
    } else {
      return this.formatResponse(
        createdServices[0],
        'Service créé',
        `Le service "${createdServices[0].nom}" a été créé avec succès.`,
      );
    }
  }

  async findAll(query: QueryServiceDto) {
    const { nom, page = 1, limit = 10 } = query;

    const where: any = {};

    if (nom) {
      where.nom = { contains: nom };
    }

    if (limit === 0) {
      const services = await this.prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return this.formatResponse(
        {
          services,
          pagination: {
            total: services.length,
            page: 1,
            limit: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        'Liste des services',
        `${services.length} service(s) récupéré(s).`,
      );
    }

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return this.formatResponse(
      {
        services,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des services',
      `${services.length} service(s) récupéré(s) sur ${total} au total.`,
    );
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        operateurs: {
          include: {
            operateur: {
              select: {
                id: true,
                nom: true,
                code: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service avec l'ID ${id} introuvable.`);
    }

    return this.formatResponse(
      service,
      'Détails du service',
      `Informations du service "${service.nom}" récupérées avec succès.`,
    );
  }

  async update(id: number, updateServiceDto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service avec l'ID ${id} introuvable.`);
    }

    // Vérifier l'unicité du nom si modifié
    if (updateServiceDto.nom) {
      const existingService = await this.prisma.service.findUnique({
        where: { nom: updateServiceDto.nom },
      });

      if (existingService && existingService.id !== id) {
        throw new ConflictException(
          `Un service avec le nom "${updateServiceDto.nom}" existe déjà.`,
        );
      }
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });

    return this.formatResponse(
      updatedService,
      'Service mis à jour',
      `Le service "${updatedService.nom}" a été mis à jour avec succès.`,
    );
  }

  async remove(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service avec l'ID ${id} introuvable.`);
    }

    await this.prisma.service.delete({
      where: { id },
    });

    return this.formatResponse(
      { id },
      'Service supprimé',
      `Le service "${service.nom}" a été supprimé avec succès.`,
    );
  }
}
