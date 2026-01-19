import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartMarcheDto } from './dto/create-part-marche.dto';
import { UpdatePartMarcheDto } from './dto/update-part-marche.dto';
import { PartMarcheResponseDto } from './dto/part-marche-response.dto';
import { PartMarcheQueryDto } from './dto/part-marche-query.dto';

interface PaginatedPartMarcheResponse {
  data: PartMarcheResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class IhhService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPartMarcheDto: CreatePartMarcheDto): Promise<PartMarcheResponseDto> {
    // Vérifier que l'opérateur existe
    const operateur = await this.prisma.operateur.findUnique({
      where: { id: createPartMarcheDto.operateurId }
    });

    if (!operateur) {
      throw new NotFoundException(`Opérateur avec l'ID ${createPartMarcheDto.operateurId} non trouvé`);
    }

    // Vérifier qu'il n'existe pas déjà une part de marché pour cet opérateur cette année
    const existingPartMarche = await this.prisma.partMarche.findUnique({
      where: {
        unique_operateur_annee_part_marche: {
          operateurId: createPartMarcheDto.operateurId,
          annee: createPartMarcheDto.annee
        }
      }
    });

    if (existingPartMarche) {
      throw new ConflictException(`Une part de marché existe déjà pour l'opérateur ${operateur.nom} en ${createPartMarcheDto.annee}`);
    }

    // Créer la part de marché
    const partMarche = await this.prisma.partMarche.create({
      data: {
        operateurId: createPartMarcheDto.operateurId,
        annee: createPartMarcheDto.annee,
        partMarcheTrafic: createPartMarcheDto.partMarcheTrafic 
          ? new Decimal(createPartMarcheDto.partMarcheTrafic) 
          : null,
        partMarcheChiffreAffaire: createPartMarcheDto.partMarcheChiffreAffaire 
          ? new Decimal(createPartMarcheDto.partMarcheChiffreAffaire) 
          : null,
        partMarcheAbonnes: createPartMarcheDto.partMarcheAbonnes 
          ? new Decimal(createPartMarcheDto.partMarcheAbonnes) 
          : null
      },
      include: {
        operateur: true
      }
    });

    return this.mapToResponseDto(partMarche);
  }

  async findAll(query: PartMarcheQueryDto): Promise<PaginatedPartMarcheResponse> {
    const { page = 1, limit = 10, operateur, annee, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Construction des filtres
    const where: any = {};

    if (operateur) {
      where.operateur = {
        nom: {
          contains: operateur,
          mode: 'insensitive'
        }
      };
    }

    if (annee) {
      where.annee = annee;
    }

    // Construction du tri
    const orderBy: any = {};
    if (sortBy === 'operateur') {
      orderBy.operateur = { nom: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    if (limit === 0) {
      // Retourner tous les résultats sans pagination
      const partsMarche = await this.prisma.partMarche.findMany({
        where,
        include: {
          operateur: true
        },
        orderBy
      });

      return {
        data: partsMarche.map(partMarche => this.mapToResponseDto(partMarche)),
        meta: {
          total: partsMarche.length,
          page: 1,
          limit: 0,
          totalPages: 1
        }
      };
    }

    // Pagination normale
    const skip = (page - 1) * limit;
    const [partsMarche, total] = await Promise.all([
      this.prisma.partMarche.findMany({
        where,
        skip,
        take: limit,
        include: {
          operateur: true
        },
        orderBy
      }),
      this.prisma.partMarche.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: partsMarche.map(partMarche => this.mapToResponseDto(partMarche)),
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async findOne(id: number): Promise<PartMarcheResponseDto> {
    const partMarche = await this.prisma.partMarche.findUnique({
      where: { id },
      include: {
        operateur: true
      }
    });

    if (!partMarche) {
      throw new NotFoundException(`Part de marché avec l'ID ${id} non trouvée`);
    }

    return this.mapToResponseDto(partMarche);
  }

  async update(id: number, updatePartMarcheDto: UpdatePartMarcheDto): Promise<PartMarcheResponseDto> {
    // Vérifier que la part de marché existe
    const existingPartMarche = await this.prisma.partMarche.findUnique({
      where: { id }
    });

    if (!existingPartMarche) {
      throw new NotFoundException(`Part de marché avec l'ID ${id} non trouvée`);
    }

    // Si l'opérateur est modifié, vérifier qu'il existe
    if (updatePartMarcheDto.operateurId) {
      const operateur = await this.prisma.operateur.findUnique({
        where: { id: updatePartMarcheDto.operateurId }
      });

      if (!operateur) {
        throw new NotFoundException(`Opérateur avec l'ID ${updatePartMarcheDto.operateurId} non trouvé`);
      }

      // Vérifier qu'il n'existe pas déjà une part de marché pour cet opérateur cette année
      const checkYear = updatePartMarcheDto.annee ?? existingPartMarche.annee;
      const existingConflict = await this.prisma.partMarche.findFirst({
        where: {
          AND: [
            { operateurId: updatePartMarcheDto.operateurId },
            { annee: checkYear },
            { id: { not: id } }
          ]
        }
      });

      if (existingConflict) {
        throw new ConflictException(`Une part de marché existe déjà pour l'opérateur en ${checkYear}`);
      }
    }

    // Si l'année est modifiée, vérifier la contrainte d'unicité
    if (updatePartMarcheDto.annee) {
      const checkOperateurId = updatePartMarcheDto.operateurId ?? existingPartMarche.operateurId;
      const existingConflict = await this.prisma.partMarche.findFirst({
        where: {
          AND: [
            { operateurId: checkOperateurId },
            { annee: updatePartMarcheDto.annee },
            { id: { not: id } }
          ]
        }
      });

      if (existingConflict) {
        throw new ConflictException(`Une part de marché existe déjà pour l'opérateur en ${updatePartMarcheDto.annee}`);
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (updatePartMarcheDto.operateurId !== undefined) {
      updateData.operateurId = updatePartMarcheDto.operateurId;
    }

    if (updatePartMarcheDto.annee !== undefined) {
      updateData.annee = updatePartMarcheDto.annee;
    }

    if (updatePartMarcheDto.partMarcheTrafic !== undefined) {
      updateData.partMarcheTrafic = updatePartMarcheDto.partMarcheTrafic 
        ? new Decimal(updatePartMarcheDto.partMarcheTrafic) 
        : null;
    }

    if (updatePartMarcheDto.partMarcheChiffreAffaire !== undefined) {
      updateData.partMarcheChiffreAffaire = updatePartMarcheDto.partMarcheChiffreAffaire 
        ? new Decimal(updatePartMarcheDto.partMarcheChiffreAffaire) 
        : null;
    }

    if (updatePartMarcheDto.partMarcheAbonnes !== undefined) {
      updateData.partMarcheAbonnes = updatePartMarcheDto.partMarcheAbonnes 
        ? new Decimal(updatePartMarcheDto.partMarcheAbonnes) 
        : null;
    }

    const partMarche = await this.prisma.partMarche.update({
      where: { id },
      data: updateData,
      include: {
        operateur: true
      }
    });

    return this.mapToResponseDto(partMarche);
  }

  async remove(id: number): Promise<{ deletedPartMarche: any }> {
    const partMarche = await this.prisma.partMarche.findUnique({
      where: { id },
      include: {
        operateur: true
      }
    });

    if (!partMarche) {
      throw new NotFoundException(`Part de marché avec l'ID ${id} non trouvée`);
    }

    await this.prisma.partMarche.delete({
      where: { id }
    });

    return {
      deletedPartMarche: {
        id: partMarche.id,
        operateurId: partMarche.operateurId,
        operateur: partMarche.operateur?.nom,
        annee: partMarche.annee,
        partMarcheTrafic: partMarche.partMarcheTrafic?.toString(),
        partMarcheChiffreAffaire: partMarche.partMarcheChiffreAffaire?.toString(),
        partMarcheAbonnes: partMarche.partMarcheAbonnes?.toString()
      }
    };
  }

  private mapToResponseDto(partMarche: any): PartMarcheResponseDto {
    return {
      id: partMarche.id,
      operateurId: partMarche.operateurId,
      operateurName: partMarche.operateur?.nom,
      annee: partMarche.annee,
      trafic: {
        partMarcheTrafic: partMarche.partMarcheTrafic?.toString(),
        ihhTrafic: partMarche.ihhTrafic?.toString(),
        isConcentreTrafic: partMarche.isConcentreTrafic
      },
      abonnement: {
        partMarcheAbonnes: partMarche.partMarcheAbonnes?.toString(),
        ihhAbonne: partMarche.ihhAbonne?.toString(),
        isConcentreAbonne: partMarche.isConcentreAbonne
      },
      chiffreAffaire: {
        partMarcheChiffreAffaire: partMarche.partMarcheChiffreAffaire?.toString(),
        ihhChiffreAffaire: partMarche.ihhChiffreAffaire?.toString(),
        isConcentreChiffreAffaire: partMarche.isConcentreChiffreAffaire
      },
      sommeTrafic: partMarche.sommeTrafic?.toString(),
      sommeAbonnement: partMarche.sommeAbonnement?.toString(),
      sommeChiffreAffaire: partMarche.sommeChiffreAffaire?.toString(),
      createdAt: partMarche.createdAt,
      updatedAt: partMarche.updatedAt
    };
  }

  /**
   * Calculer la somme totale des volumes de trafic pour une année donnée
   */
  async calculateSommeTrafic(annee: number): Promise<number> {
    const result = await this.prisma.trafic.aggregate({
      where: {
        annee: annee
      },
      _sum: {
        volume: true
      }
    });

    return result._sum.volume ? Number(result._sum.volume) : 0;
  }

  /**
   * Calculer la somme totale du nombre d'abonnés pour une année donnée
   */
  async calculateSommeAbonnement(annee: number): Promise<number> {
    const result = await this.prisma.abonnement.aggregate({
      where: {
        annee: annee
      },
      _sum: {
        nombreAbonnes: true
      }
    });

    return result._sum.nombreAbonnes || 0;
  }

  /**
   * Calculer la somme totale du chiffre d'affaires pour une année donnée
   */
  async calculateSommeChiffreAffaire(annee: number): Promise<number> {
    const result = await this.prisma.chiffreAffaire.aggregate({
      where: {
        annee: annee
      },
      _sum: {
        chiffreAffaire: true
      }
    });

    return result._sum.chiffreAffaire ? Number(result._sum.chiffreAffaire) : 0;
  }

  /**
   * Calculer toutes les sommes pour une année donnée
   */
  async calculateAllSommes(annee: number): Promise<{
    sommeTrafic: number;
    sommeAbonnement: number; 
    sommeChiffreAffaire: number;
  }> {
    const [sommeTrafic, sommeAbonnement, sommeChiffreAffaire] = await Promise.all([
      this.calculateSommeTrafic(annee),
      this.calculateSommeAbonnement(annee), 
      this.calculateSommeChiffreAffaire(annee)
    ]);

    return {
      sommeTrafic,
      sommeAbonnement,
      sommeChiffreAffaire
    };
  }

  /**
   * Calculer la part de marché trafic pour un opérateur
   * partMarcheTrafic = (volume du trafic de l'opérateur/sommeTrafic)*100
   */
  async calculatePartMarcheTrafic(volumeTrafic: number, annee: number): Promise<number> {
    const sommeTrafic = await this.calculateSommeTrafic(annee);
    if (sommeTrafic === 0) return 0;
    
    return parseFloat(((volumeTrafic / sommeTrafic) * 100).toFixed(2));
  }

  /**
   * Calculer la part de marché chiffre d'affaires pour un opérateur
   * partMarcheChiffreAffaire = (chiffreAffaire de l'opérateur/sommeChiffreAffaire)*100
   */
  async calculatePartMarcheChiffreAffaire(chiffreAffaire: number, annee: number): Promise<number> {
    const sommeChiffreAffaire = await this.calculateSommeChiffreAffaire(annee);
    if (sommeChiffreAffaire === 0) return 0;
    
    return parseFloat(((chiffreAffaire / sommeChiffreAffaire) * 100).toFixed(2));
  }

  /**
   * Calculer la part de marché abonnés pour un opérateur
   * partMarcheAbonnes = (nombreAbonnes de l'opérateur/sommeAbonnement)*100
   */
  async calculatePartMarcheAbonnes(nombreAbonne: number, annee: number): Promise<number> {
    const sommeAbonnement = await this.calculateSommeAbonnement(annee);
    if (sommeAbonnement === 0) return 0;
    
    return parseFloat(((nombreAbonne / sommeAbonnement) * 100).toFixed(2));
  }

  /**
   * Calculer toutes les données complètes pour un enregistrement
   */
  async calculateDonneesCompletes(
    volumeTrafic: number,
    chiffreAffaire: number,
    nombreAbonne: number,
    annee: number
  ): Promise<{
    sommeTrafic: number;
    sommeAbonnement: number;
    sommeChiffreAffaire: number;
    partMarcheTrafic: number;
    partMarcheChiffreAffaire: number;
    partMarcheAbonnes: number;
  }> {
    // Calculer d'abord les sommes
    const sommes = await this.calculateAllSommes(annee);
    
    // Puis calculer les parts de marché
    const [partMarcheTrafic, partMarcheChiffreAffaire, partMarcheAbonnes] = await Promise.all([
      this.calculatePartMarcheTrafic(volumeTrafic, annee),
      this.calculatePartMarcheChiffreAffaire(chiffreAffaire, annee),
      this.calculatePartMarcheAbonnes(nombreAbonne, annee)
    ]);

    return {
      ...sommes,
      partMarcheTrafic,
      partMarcheChiffreAffaire,
      partMarcheAbonnes
    };
  }

  /**
   * Calculer l'IHH trafic pour une année donnée
   * ihhTrafic = somme des carrés des partMarcheTrafic de tous les opérateurs pour l'année
   */
  async calculateIhhTrafic(annee: number): Promise<number> {
    const partsMarche = await this.prisma.partMarche.findMany({
      where: { 
        annee,
        partMarcheTrafic: { not: null }
      },
      select: {
        partMarcheTrafic: true
      }
    });

    const sommeCarre = partsMarche.reduce((somme, partMarche) => {
      const part = partMarche.partMarcheTrafic ? Number(partMarche.partMarcheTrafic) : 0;
      return somme + (part * part);
    }, 0);

    return parseFloat(sommeCarre.toFixed(4));
  }

  /**
   * Calculer l'IHH abonnés pour une année donnée
   * ihhAbonne = somme des carrés des partMarcheAbonnes de tous les opérateurs pour l'année
   */
  async calculateIhhAbonne(annee: number): Promise<number> {
    const partsMarche = await this.prisma.partMarche.findMany({
      where: { 
        annee,
        partMarcheAbonnes: { not: null }
      },
      select: {
        partMarcheAbonnes: true
      }
    });

    const sommeCarre = partsMarche.reduce((somme, partMarche) => {
      const part = partMarche.partMarcheAbonnes ? Number(partMarche.partMarcheAbonnes) : 0;
      return somme + (part * part);
    }, 0);

    return parseFloat(sommeCarre.toFixed(4));
  }

  /**
   * Calculer l'IHH chiffre d'affaires pour une année donnée
   * ihhChiffreAffaire = somme des carrés des partMarcheChiffreAffaire de tous les opérateurs pour l'année
   */
  async calculateIhhChiffreAffaire(annee: number): Promise<number> {
    const partsMarche = await this.prisma.partMarche.findMany({
      where: { 
        annee,
        partMarcheChiffreAffaire: { not: null }
      },
      select: {
        partMarcheChiffreAffaire: true
      }
    });

    const sommeCarre = partsMarche.reduce((somme, partMarche) => {
      const part = partMarche.partMarcheChiffreAffaire ? Number(partMarche.partMarcheChiffreAffaire) : 0;
      return somme + (part * part);
    }, 0);

    return parseFloat(sommeCarre.toFixed(4));
  }

  /**
   * Calculer tous les IHH pour une année donnée
   */
  async calculateAllIhh(annee: number): Promise<{
    ihhTrafic: number;
    ihhAbonne: number;
    ihhChiffreAffaire: number;
  }> {
    const [ihhTrafic, ihhAbonne, ihhChiffreAffaire] = await Promise.all([
      this.calculateIhhTrafic(annee),
      this.calculateIhhAbonne(annee),
      this.calculateIhhChiffreAffaire(annee)
    ]);

    return {
      ihhTrafic,
      ihhAbonne,
      ihhChiffreAffaire
    };
  }

  /**
   * Calculer toutes les données complètes incluant les IHH
   */
  async calculateDonneesCompletesAvecIhh(
    volumeTrafic: number,
    chiffreAffaire: number,
    nombreAbonne: number,
    annee: number
  ): Promise<{
    sommeTrafic: number;
    sommeAbonnement: number;
    sommeChiffreAffaire: number;
    partMarcheTrafic: number;
    partMarcheChiffreAffaire: number;
    partMarcheAbonnes: number;
    ihhTrafic: number;
    ihhAbonne: number;
    ihhChiffreAffaire: number;
    isConcentreTrafic: boolean;
    isConcentreAbonne: boolean;
    isConcentreChiffreAffaire: boolean;
  }> {
    const [donneesBase, ihhData] = await Promise.all([
      this.calculateDonneesCompletes(volumeTrafic, chiffreAffaire, nombreAbonne, annee),
      this.calculateAllIhh(annee)
    ]);

    return {
      ...donneesBase,
      ...ihhData,
      isConcentreTrafic: this.isMarketConcentrated(ihhData.ihhTrafic),
      isConcentreAbonne: this.isMarketConcentrated(ihhData.ihhAbonne),
      isConcentreChiffreAffaire: this.isMarketConcentrated(ihhData.ihhChiffreAffaire)
    };
  }

  /**
   * Déterminer si un marché est concentré selon l'indice IHH
   * Seuils personnalisés :
   * - IHH > 2000 : marché concentré (true)
   * - IHH ≤ 2000 : marché non concentré (false)
   */
  private isMarketConcentrated(ihh: number): boolean {
    return ihh > 2000; // Marché considéré comme concentré si IHH > 2000
  }

  /**
   * Calculer les parts de marché et IHH pour tous les opérateurs d'une année
   */
  async calculerPartsMarCheTousOperateurs(annee: number): Promise<any> {
    // 1. Récupérer tous les opérateurs avec leurs données pour l'année
    const operateurs = await this.prisma.operateur.findMany({
      include: {
        trafics: {
          where: { annee },
          select: { volume: true }
        },
        abonnements: {
          where: { annee },
          select: { nombreAbonnes: true }
        },
        chiffresAffaire: {
          where: { annee },
          select: { chiffreAffaire: true }
        }
      }
    });

    // 2. Calculer les sommes totales
    const sommesTotales = await this.calculateAllSommes(annee);

    // 3. Calculer les parts de marché et contributions IHH pour chaque opérateur
    const operateursData: any[] = [];
    
    for (const operateur of operateurs) {
      // Calculer les totaux de l'opérateur
      const volumeTrafic = operateur.trafics.reduce((sum, t) => sum + parseFloat(t.volume.toString()), 0);
      const nombreAbonne = operateur.abonnements.reduce((sum, a) => sum + a.nombreAbonnes, 0);
      const chiffreAffaire = operateur.chiffresAffaire.reduce((sum, c) => sum + parseFloat(c.chiffreAffaire.toString()), 0);

      // Calculer les parts de marché
      const partMarcheTrafic = await this.calculatePartMarcheTrafic(volumeTrafic, annee);
      const partMarcheAbonnes = await this.calculatePartMarcheAbonnes(nombreAbonne, annee);
      const partMarcheChiffreAffaire = await this.calculatePartMarcheChiffreAffaire(chiffreAffaire, annee);

      // Calculer les contributions à l'IHH (part²)
      const contributionIhhTrafic = Math.pow(partMarcheTrafic, 2);
      const contributionIhhAbonne = Math.pow(partMarcheAbonnes, 2);
      const contributionIhhChiffreAffaire = Math.pow(partMarcheChiffreAffaire, 2);

      operateursData.push({
        operateurId: operateur.id,
        operateur: {
          nom: operateur.nom,
          code: operateur.code,
          type: operateur.type
        },
        donnees: {
          volumeTrafic,
          nombreAbonne,
          chiffreAffaire
        },
        partsMarche: {
          partMarcheTrafic,
          partMarcheAbonnes,
          partMarcheChiffreAffaire
        },
        concentration: {
          contributionIhhTrafic: parseFloat(contributionIhhTrafic.toFixed(2)),
          contributionIhhAbonne: parseFloat(contributionIhhAbonne.toFixed(2)),
          contributionIhhChiffreAffaire: parseFloat(contributionIhhChiffreAffaire.toFixed(2))
        }
      });
    }

    // 4. Calculer les IHH globaux
    const ihhGlobal = await this.calculateAllIhh(annee);

    // 5. Déterminer la concentration globale
    const concentrationGlobale = {
      isConcentreTrafic: this.isMarketConcentrated(ihhGlobal.ihhTrafic),
      isConcentreAbonne: this.isMarketConcentrated(ihhGlobal.ihhAbonne),
      isConcentreChiffreAffaire: this.isMarketConcentrated(ihhGlobal.ihhChiffreAffaire)
    };

    // 6. Sauvegarder toutes les données calculées en base
    for (const operateurData of operateursData) {
      await this.prisma.partMarche.upsert({
        where: {
          unique_operateur_annee_part_marche: {
            operateurId: operateurData.operateurId,
            annee: annee
          }
        },
        update: {
          // Parts de marché
          partMarcheTrafic: operateurData.partsMarche.partMarcheTrafic,
          partMarcheChiffreAffaire: operateurData.partsMarche.partMarcheChiffreAffaire,
          partMarcheAbonnes: operateurData.partsMarche.partMarcheAbonnes,
          
          // Sommes totales
          sommeTrafic: sommesTotales.sommeTrafic,
          sommeAbonnement: sommesTotales.sommeAbonnement,
          sommeChiffreAffaire: sommesTotales.sommeChiffreAffaire,
          
          // Données spécifiques de l'opérateur
          volumeTrafic: operateurData.donnees.volumeTrafic,
          nombreAbonne: operateurData.donnees.nombreAbonne,
          chiffreAffaire: operateurData.donnees.chiffreAffaire,
          
          // IHH calculés (identiques pour tous les opérateurs d'une même année)
          ihhTrafic: ihhGlobal.ihhTrafic,
          ihhAbonne: ihhGlobal.ihhAbonne,
          ihhChiffreAffaire: ihhGlobal.ihhChiffreAffaire,
          
          // Indicateurs de concentration
          isConcentreTrafic: concentrationGlobale.isConcentreTrafic,
          isConcentreAbonne: concentrationGlobale.isConcentreAbonne,
          isConcentreChiffreAffaire: concentrationGlobale.isConcentreChiffreAffaire,
          
          updatedAt: new Date()
        },
        create: {
          operateurId: operateurData.operateurId,
          annee: annee,
          
          // Parts de marché
          partMarcheTrafic: operateurData.partsMarche.partMarcheTrafic,
          partMarcheChiffreAffaire: operateurData.partsMarche.partMarcheChiffreAffaire,
          partMarcheAbonnes: operateurData.partsMarche.partMarcheAbonnes,
          
          // Sommes totales
          sommeTrafic: sommesTotales.sommeTrafic,
          sommeAbonnement: sommesTotales.sommeAbonnement,
          sommeChiffreAffaire: sommesTotales.sommeChiffreAffaire,
          
          // Données spécifiques de l'opérateur
          volumeTrafic: operateurData.donnees.volumeTrafic,
          nombreAbonne: operateurData.donnees.nombreAbonne,
          chiffreAffaire: operateurData.donnees.chiffreAffaire,
          
          // IHH calculés (identiques pour tous les opérateurs d'une même année)
          ihhTrafic: ihhGlobal.ihhTrafic,
          ihhAbonne: ihhGlobal.ihhAbonne,
          ihhChiffreAffaire: ihhGlobal.ihhChiffreAffaire,
          
          // Indicateurs de concentration
          isConcentreTrafic: concentrationGlobale.isConcentreTrafic,
          isConcentreAbonne: concentrationGlobale.isConcentreAbonne,
          isConcentreChiffreAffaire: concentrationGlobale.isConcentreChiffreAffaire
        }
      });
    }

    // 7. Calculer les statistiques
    const statistiques = {
      nombreOperateurs: operateurs.length,
      operateursConcentresTrafic: operateursData.filter(op => op.partsMarche.partMarcheTrafic > 0).length,
      operateursConcentresAbonnes: operateursData.filter(op => op.partsMarche.partMarcheAbonnes > 0).length,
      operateursConcentresChiffreAffaire: operateursData.filter(op => op.partsMarche.partMarcheChiffreAffaire > 0).length,
      interpretationIHH: {
        trafic: this.getMarketInterpretation(ihhGlobal.ihhTrafic),
        abonnes: this.getMarketInterpretation(ihhGlobal.ihhAbonne),
        chiffreAffaire: this.getMarketInterpretation(ihhGlobal.ihhChiffreAffaire)
      }
    };

    return {
      annee,
      sommesTotales,
      ihhGlobal,
      concentrationGlobale,
      operateurs: operateursData,
      statistiques
    };
  }

  /**
   * Interpréter l'IHH selon les seuils standards
   */
  private getMarketInterpretation(ihh: number): string {
    if (ihh <= 1500) {
      return 'Marché peu concentré';
    } else if (ihh <= 2500) {
      return 'Marché modérément concentré';
    } else {
      return 'Marché hautement concentré';
    }
  }

  /**
   * Calculer les parts de marché et IHH pour tous les opérateurs de toutes les années
   */
  async calculerPartsMarCheToutesAnnees(): Promise<any> {
    // 1. Récupérer toutes les années disponibles
    const anneesDistincts = await this.prisma.$queryRaw<Array<{ annee: number }>>`
      SELECT DISTINCT annee FROM (
        SELECT DISTINCT annee FROM trafics
        UNION
        SELECT DISTINCT annee FROM abonnements  
        UNION
        SELECT DISTINCT annee FROM chiffres_affaire
      ) AS annees_combined
      ORDER BY annee ASC
    `;

    const annees = anneesDistincts.map(row => row.annee);

    if (annees.length === 0) {
      return {
        nombreAnneesTraitees: 0,
        anneesTraitees: [],
        resultatsParAnnee: {},
        message: 'Aucune donnée trouvée pour calculer les parts de marché'
      };
    }

    // 2. Calculer pour chaque année
    const resultatsParAnnee: any = {};
    const ihhParAnnee: any = { trafic: [], abonnes: [], chiffreAffaire: [] };

    for (const annee of annees) {
      const resultatAnnee = await this.calculerPartsMarCheTousOperateurs(annee);
      resultatsParAnnee[annee.toString()] = resultatAnnee;
      
      // Stocker les IHH pour le calcul des moyennes
      ihhParAnnee.trafic.push(resultatAnnee.ihhGlobal.ihhTrafic);
      ihhParAnnee.abonnes.push(resultatAnnee.ihhGlobal.ihhAbonne);
      ihhParAnnee.chiffreAffaire.push(resultatAnnee.ihhGlobal.ihhChiffreAffaire);
    }

    // 3. Calculer les moyennes IHH
    const moyenneIHH = {
      trafic: parseFloat((ihhParAnnee.trafic.reduce((sum: number, val: number) => sum + val, 0) / ihhParAnnee.trafic.length).toFixed(2)),
      abonnes: parseFloat((ihhParAnnee.abonnes.reduce((sum: number, val: number) => sum + val, 0) / ihhParAnnee.abonnes.length).toFixed(2)),
      chiffreAffaire: parseFloat((ihhParAnnee.chiffreAffaire.reduce((sum: number, val: number) => sum + val, 0) / ihhParAnnee.chiffreAffaire.length).toFixed(2))
    };

    // 4. Analyser l'évolution de la concentration
    const evolutionConcentration = {
      trafic: this.analyseEvolutionConcentration(ihhParAnnee.trafic, 'trafic'),
      abonnes: this.analyseEvolutionConcentration(ihhParAnnee.abonnes, 'abonnés'),
      chiffreAffaire: this.analyseEvolutionConcentration(ihhParAnnee.chiffreAffaire, 'chiffre d\'affaires')
    };

    return {
      nombreAnneesTraitees: annees.length,
      anneesTraitees: annees.sort((a, b) => a - b),
      resultatsParAnnee,
      resumeGlobal: {
        evolutionConcentration,
        moyenneIHH
      }
    };
  }

  /**
   * Analyser l'évolution de la concentration sur plusieurs années
   */
  private analyseEvolutionConcentration(ihhValues: number[], metric: string): string {
    if (ihhValues.length < 2) {
      const niveau = this.getMarketInterpretation(ihhValues[0]);
      return `${niveau} - Une seule année de données`;
    }

    const premier = ihhValues[0];
    const dernier = ihhValues[ihhValues.length - 1];
    const difference = dernier - premier;
    
    const niveauActuel = this.getMarketInterpretation(dernier);
    
    if (Math.abs(difference) < 50) {
      return `Stable - ${niveauActuel} sur toutes les années`;
    } else if (difference > 50) {
      return `En hausse - Concentration du marché ${metric} en augmentation (${niveauActuel})`;
    } else {
      return `En baisse - Concentration du marché ${metric} en diminution (${niveauActuel})`;
    }
  }
}
