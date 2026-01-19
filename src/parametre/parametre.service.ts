import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParametreDto } from './dto/create-parametre.dto';
import { UpdateParametreDto } from './dto/update-parametre.dto';
import { QueryParametreDto } from './dto/query-parametre.dto';
import { ParametreResponseDto } from './dto/parametre-response.dto';

@Injectable()
export class ParametreService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un nouveau paramètre
   */
  async create(createParametreDto: CreateParametreDto): Promise<ParametreResponseDto> {
    try {
      // Vérifier qu'il n'existe pas déjà un paramètre de ce type
      const existingParametre = await this.prisma.parametre.findFirst({
        where: { type: createParametreDto.type }
      });

      if (existingParametre) {
        throw new ConflictException(`Un paramètre de type "${createParametreDto.type}" existe déjà`);
      }

      // Créer le paramètre
      const parametre = await this.prisma.parametre.create({
        data: {
          type: createParametreDto.type,
          redevanceFst: createParametreDto.redevanceFst || null,
          redevanceRegulation: createParametreDto.redevanceRegulation || null,
          droitEntree: createParametreDto.droitEntree || null,
          coutsCommerciaux: createParametreDto.coutsCommerciaux || null,
          tva: createParametreDto.tva || null,
        }
      });

      return this.mapToResponseDto(parametre);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la création du paramètre: ${error.message}`);
    }
  }

  /**
   * Récupérer tous les paramètres avec filtrage optionnel
   */
  async findAll(query?: QueryParametreDto): Promise<{
    parametres: ParametreResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Filtrage par type
      if (query?.type) {
        where.type = query.type;
      }

      // Filtrage par TVA
      if (query?.tva !== undefined) {
        where.tva = query.tva;
      }

      // Compter le total
      const total = await this.prisma.parametre.count({ where });

      // Récupérer les paramètres
      const parametres = await this.prisma.parametre.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        parametres: parametres.map(p => this.mapToResponseDto(p)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new BadRequestException(`Erreur lors de la récupération des paramètres: ${error.message}`);
    }
  }

  /**
   * Récupérer un paramètre par ID
   */
  async findOne(id: number): Promise<ParametreResponseDto> {
    try {
      const parametre = await this.prisma.parametre.findUnique({
        where: { id }
      });

      if (!parametre) {
        throw new NotFoundException(`Paramètre avec l'ID ${id} non trouvé`);
      }

      return this.mapToResponseDto(parametre);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la récupération du paramètre: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un paramètre
   */
  async update(id: number, updateParametreDto: UpdateParametreDto): Promise<ParametreResponseDto> {
    try {
      // Vérifier que le paramètre existe
      const existingParametre = await this.prisma.parametre.findUnique({
        where: { id }
      });

      if (!existingParametre) {
        throw new NotFoundException(`Paramètre avec l'ID ${id} non trouvé`);
      }

      // Si le type est modifié, vérifier qu'il n'existe pas déjà un paramètre avec ce type
      if (updateParametreDto.type && updateParametreDto.type !== existingParametre.type) {
        const conflictParametre = await this.prisma.parametre.findUnique({
          where: { type: updateParametreDto.type }
        });

        if (conflictParametre) {
          throw new ConflictException(`Un paramètre de type "${updateParametreDto.type}" existe déjà`);
        }
      }

      // Mettre à jour le paramètre
      const updatedParametre = await this.prisma.parametre.update({
        where: { id },
        data: {
          ...(updateParametreDto.type && { type: updateParametreDto.type }),
          ...(updateParametreDto.redevanceFst !== undefined && { redevanceFst: updateParametreDto.redevanceFst }),
          ...(updateParametreDto.redevanceRegulation !== undefined && { redevanceRegulation: updateParametreDto.redevanceRegulation }),
          ...(updateParametreDto.droitEntree !== undefined && { droitEntree: updateParametreDto.droitEntree }),
          ...(updateParametreDto.coutsCommerciaux !== undefined && { coutsCommerciaux: updateParametreDto.coutsCommerciaux }),
          ...(updateParametreDto.tva !== undefined && { tva: updateParametreDto.tva }),
        }
      });

      return this.mapToResponseDto(updatedParametre);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la mise à jour du paramètre: ${error.message}`);
    }
  }

  /**
   * Supprimer un paramètre
   */
  async remove(id: number): Promise<{ message: string }> {
    try {
      // Vérifier que le paramètre existe
      const existingParametre = await this.prisma.parametre.findUnique({
        where: { id }
      });

      if (!existingParametre) {
        throw new NotFoundException(`Paramètre avec l'ID ${id} non trouvé`);
      }

      // Supprimer le paramètre
      await this.prisma.parametre.delete({
        where: { id }
      });

      return { message: `Paramètre de type "${existingParametre.type}" supprimé avec succès` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la suppression du paramètre: ${error.message}`);
    }
  }

  /**
   * Convertir un objet Parametre en ParametreResponseDto
   */
  private mapToResponseDto(parametre: any): ParametreResponseDto {
    return {
      id: parametre.id,
      type: parametre.type,
      redevanceFst: parametre.redevanceFst ? Number(parametre.redevanceFst) : undefined,
      redevanceRegulation: parametre.redevanceRegulation ? Number(parametre.redevanceRegulation) : undefined,
      droitEntree: parametre.droitEntree ? Number(parametre.droitEntree) : undefined,
      coutsCommerciaux: parametre.coutsCommerciaux ? Number(parametre.coutsCommerciaux) : undefined,
      tva: parametre.tva ? Number(parametre.tva) : undefined,
      createdAt: parametre.createdAt,
      updatedAt: parametre.updatedAt
    };
  }
}
