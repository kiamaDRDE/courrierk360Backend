import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
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
      // Vérifier qu'il n'existe pas déjà un paramètre pour cette année
      const existingParametre = await this.prisma.parametre.findUnique({
        where: { annee: createParametreDto.annee }
      });

      if (existingParametre) {
        throw new ConflictException(`Un paramètre existe déjà pour l'année ${createParametreDto.annee}`);
      }

      // Calculer le coût total (somme de tous les coûts)
      const coutReseau = new Decimal(createParametreDto.coutReseau || 0);
      const coutCommerciaux = new Decimal(createParametreDto.coutsCommerciaux || 0);
      const taxe = new Decimal(createParametreDto.taxe || 0);
      const coutInterconnexion = new Decimal(createParametreDto.coutInterconnexion || 0);
      const cout = coutReseau.plus(coutCommerciaux).plus(taxe).plus(coutInterconnexion);

      // Créer le paramètre
      const parametre = await this.prisma.parametre.create({
        data: {
          type: createParametreDto.type,
          annee: createParametreDto.annee,
          redevanceFst: createParametreDto.redevanceFst || null,
          redevanceRegulation: createParametreDto.redevanceRegulation || null,
          droitEntree: createParametreDto.droitEntree || null,
          coutsCommerciaux: coutCommerciaux,
          tva: createParametreDto.tva || null,
          coutReseau: coutReseau,
          taxe: taxe,
          coutInterconnexion: coutInterconnexion,
          cout: cout,
          wacc: new Decimal(createParametreDto.wacc ?? 0),
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

      // Si l'année est modifiée, vérifier la contrainte d'unicité
      if (updateParametreDto.annee !== undefined && updateParametreDto.annee !== existingParametre.annee) {
        const existingConflict = await this.prisma.parametre.findFirst({
          where: {
            AND: [
              { annee: updateParametreDto.annee },
              { id: { not: id } }
            ]
          }
        });

        if (existingConflict) {
          throw new ConflictException(`Un paramètre existe déjà pour l'année ${updateParametreDto.annee}`);
        }
      }

      // Préparer les données de mise à jour
      const updateData: any = {};

      if (updateParametreDto.type !== undefined) {
        updateData.type = updateParametreDto.type;
      }

      if (updateParametreDto.annee !== undefined) {
        updateData.annee = updateParametreDto.annee;
      }

      if (updateParametreDto.redevanceFst !== undefined) {
        updateData.redevanceFst = updateParametreDto.redevanceFst;
      }

      if (updateParametreDto.redevanceRegulation !== undefined) {
        updateData.redevanceRegulation = updateParametreDto.redevanceRegulation;
      }

      if (updateParametreDto.droitEntree !== undefined) {
        updateData.droitEntree = updateParametreDto.droitEntree;
      }

      if (updateParametreDto.coutsCommerciaux !== undefined) {
        updateData.coutsCommerciaux = new Decimal(updateParametreDto.coutsCommerciaux);
      }

      if (updateParametreDto.tva !== undefined) {
        updateData.tva = updateParametreDto.tva;
      }

      if (updateParametreDto.coutReseau !== undefined) {
        updateData.coutReseau = new Decimal(updateParametreDto.coutReseau);
      }

      if (updateParametreDto.wacc !== undefined) {
        updateData.wacc = new Decimal(updateParametreDto.wacc);
      }


      if (updateParametreDto.taxe !== undefined) {
        updateData.taxe = new Decimal(updateParametreDto.taxe);
      }

      if (updateParametreDto.coutInterconnexion !== undefined) {
        updateData.coutInterconnexion = new Decimal(updateParametreDto.coutInterconnexion);
      }

      // Recalculer le coût total si au moins un des champs change
      if (updateParametreDto.coutReseau !== undefined || 
          updateParametreDto.coutsCommerciaux !== undefined || 
          updateParametreDto.taxe !== undefined || 
          updateParametreDto.coutInterconnexion !== undefined) {
        
        // Récupérer les valeurs actuelles ou les nouvelles valeurs
        const coutReseau = updateData.coutReseau || existingParametre.coutReseau;
        const coutCommerciaux = updateData.coutsCommerciaux || existingParametre.coutsCommerciaux || 0;
        const taxe = updateData.taxe || existingParametre.taxe;
        const coutInterconnexion = updateData.coutInterconnexion || existingParametre.coutInterconnexion || 0;
        
        updateData.cout = new Decimal(coutReseau)
          .plus(new Decimal(coutCommerciaux))
          .plus(new Decimal(taxe))
          .plus(new Decimal(coutInterconnexion));
      }

      const updatedParametre = await this.prisma.parametre.update({
        where: { id },
        data: updateData
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
    const coutReseau = parametre.coutReseau?.toString() || '0';
    const coutCommerciaux = parametre.coutsCommerciaux?.toString() || '0';
    const taxe = parametre.taxe?.toString() || '0';
    const coutInterconnexion = parametre.coutInterconnexion?.toString() || '0';
    const cout = parametre.cout?.toString() || '0';

    return {
      id: parametre.id,
      type: parametre.type,
      annee: parametre.annee,
      redevanceFst: parametre.redevanceFst ? Number(parametre.redevanceFst) : undefined,
      redevanceRegulation: parametre.redevanceRegulation ? Number(parametre.redevanceRegulation) : undefined,
      droitEntree: parametre.droitEntree ? Number(parametre.droitEntree) : undefined,
      coutsCommerciaux: parametre.coutsCommerciaux ? Number(parametre.coutsCommerciaux) : undefined,
      tva: parametre.tva ? Number(parametre.tva) : undefined,
      wacc: parametre.wacc ? Number(parametre.wacc) : 0,
      coutReseau: Number(coutReseau),
      taxe: Number(taxe),
      coutInterconnexion: parametre.coutInterconnexion ? Number(parametre.coutInterconnexion) : undefined,
      cout: Number(cout),
      coutFormule: `${coutReseau} + ${coutCommerciaux} + ${taxe} + ${coutInterconnexion} = ${cout}`,
      createdAt: parametre.createdAt,
      updatedAt: parametre.updatedAt
    };
  }
}
