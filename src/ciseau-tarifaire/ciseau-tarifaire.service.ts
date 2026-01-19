import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { EffetClubQueryDto } from './dto/effet-club-query.dto';
import { OffreService } from '../offre/offre.service';

interface PaginatedEffetClubResponse {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CiseauTarifaireService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OffreService))
    private readonly offreService: OffreService
  ) {}

  /**
   * Calculer et créer/mettre à jour automatiquement le ciseau tarifaire pour un opérateur et une année
   */
  async calculateCiseauTarifaire(operateurId: number, annee: number) {
    // Récupérer les tarifs de l'opérateur pour cette année (Base et Interconnexion)
    const tarifs = await this.prisma.tarifInterconnexion.findMany({
      where: {
        operateurId,
        annee
      }
    });

    if (tarifs.length === 0) {
      throw new NotFoundException(`Aucun tarif trouvé pour l'opérateur ${operateurId} pour l'année ${annee}`);
    }

    const tarifBase = tarifs.find(t => t.typeTarif === 'Base');
    const tarifInterconnexion = tarifs.find(t => t.typeTarif === 'Interconnexion');

    if (!tarifBase) {
      throw new BadRequestException(`Tarif de type "Base" manquant pour l'opérateur ${operateurId} pour l'année ${annee}`);
    }

    if (!tarifInterconnexion) {
      throw new BadRequestException(`Tarif de type "Interconnexion" manquant pour l'opérateur ${operateurId} pour l'année ${annee}`);
    }

    // Calculer les différences
    const differenceOffnetHC = new Decimal(tarifBase.tarifOffNetHeureCreuse).minus(new Decimal(tarifInterconnexion.tarifOffNetHeureCreuse));
    const differenceOffnetHP = new Decimal(tarifBase.tarifOffNetHeurePleine).minus(new Decimal(tarifInterconnexion.tarifOffNetHeurePleine));
    const differenceOnnetHC = new Decimal(tarifBase.tarifOnNetHeureCreuse).minus(new Decimal(tarifInterconnexion.tarifOnNetHeureCreuse));
    const differenceOnnetHP = new Decimal(tarifBase.tarifOnNetHeurePleine).minus(new Decimal(tarifInterconnexion.tarifOnNetHeurePleine));

    // Récupérer le coût depuis la table Parametre pour cette année
    const parametre = await this.prisma.parametre.findUnique({
      where: { annee }
    });

    if (!parametre) {
      throw new NotFoundException(`Paramètre non trouvé pour l'année ${annee}`);
    }

    const cout = parametre.cout;

    // Déterminer si c'est un ciseau tarifaire pour chaque différence OffNet
    // Si differenceOffnetHC > cout, alors isCiseauOffHC = false, sinon true
    const isCiseauOffHC = !differenceOffnetHC.greaterThan(cout);
    
    // Si differenceOffnetHP > cout, alors isCiseauOffHP = false, sinon true
    const isCiseauOffHP = !differenceOffnetHP.greaterThan(cout);

    // Vérifier si un ciseau tarifaire existe déjà pour cette année
    const existingCiseau = await this.prisma.ciseauTarifaire.findUnique({
      where: { annee }
    });

    if (existingCiseau) {
      // Mettre à jour
      const updated = await this.prisma.ciseauTarifaire.update({
        where: { annee },
        data: {
          cout,
          differenceOffnetHC,
          differenceOffnetHP,
          differenceOnnetHC,
          differenceOnnetHP,
          isCiseauOffHC,
          isCiseauOffHP
        }
      });
      return this.mapToResponseDto(updated);
    } else {
      // Créer
      const created = await this.prisma.ciseauTarifaire.create({
        data: {
          annee,
          cout,
          differenceOffnetHC,
          differenceOffnetHP,
          differenceOnnetHC,
          differenceOnnetHP,
          isCiseauOffHC,
          isCiseauOffHP
        }
      });
      return this.mapToResponseDto(created);
    }
  }

  /**
   * Calculer le ciseau tarifaire selon le tarif facial (prix de l'offre)
   * tariffacialOffnet = prixOffNet calculé à partir des options de l'offre
   * DiffTariffacialOffnetHC = tariffacialOffnet - Tarif Interconnexion OffNet HC
   * DiffTariffacialOffnetHP = tariffacialOffnet - Tarif Interconnexion OffNet HP
   */
  async calculateCiseauTarifaireAvecTarifFacial(offreId: number) {
    // Récupérer l'offre avec son opérateur (sans prixOffNet car on le calcule)
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      select: {
        id: true,
        nom: true,
        operateurId: true,
        dateDebutValidite: true,
        ciseauTarifaireId: true,
        operateur: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${offreId} non trouvée`);
    }

    // Calculer le tarif facial OffNet en utilisant la fonction calculerPrixReseaux
    const prixReseaux = await this.offreService['calculerPrixReseaux'](offreId);

    if (!prixReseaux.prixOffNet) {
      throw new BadRequestException(`Impossible de calculer le prix OffNet pour l'offre ${offreId}. Vérifiez que l'offre a des options avec des tarifs OffNet.`);
    }

    // Le tarif facial OffNet est le prix calculé à partir des options
    const tariffacialOffnet = new Decimal(prixReseaux.prixOffNet);

    // Extraire l'année depuis la date de validité de l'offre
    const annee = offre.dateDebutValidite.getFullYear();

    // Récupérer le tarif d'interconnexion de l'opérateur pour cette année
    const tarifInterconnexion = await this.prisma.tarifInterconnexion.findFirst({
      where: {
        operateurId: offre.operateurId,
        annee,
        typeTarif: 'Interconnexion'
      }
    });

    if (!tarifInterconnexion) {
      throw new NotFoundException(
        `Tarif d'interconnexion non trouvé pour l'opérateur ${offre.operateur.nom} pour l'année ${annee}`
      );
    }

    // Calculer les différences avec le tarif facial
    const DiffTariffacialOffnetHC = tariffacialOffnet.minus(new Decimal(tarifInterconnexion.tarifOffNetHeureCreuse));
    const DiffTariffacialOffnetHP = tariffacialOffnet.minus(new Decimal(tarifInterconnexion.tarifOffNetHeurePleine));

    // Récupérer le coût depuis la table Parametre pour cette année
    const parametre = await this.prisma.parametre.findUnique({
      where: { annee }
    });

    if (!parametre) {
      throw new NotFoundException(`Paramètre non trouvé pour l'année ${annee}`);
    }

    const cout = parametre.cout;

    // Déterminer si c'est un ciseau tarifaire pour chaque différence
    // Si DiffTariffacialOffnetHC > cout, alors isCiseauOffTarifHC = false, sinon true
    const isCiseauOffTarifHC = !DiffTariffacialOffnetHC.greaterThan(cout);
    
    // Si DiffTariffacialOffnetHP > cout, alors isCiseauOffTarifHP = false, sinon true
    const isCiseauOffTarifHP = !DiffTariffacialOffnetHP.greaterThan(cout);

    // Vérifier si un ciseau tarifaire existe déjà pour cette année
    const existingCiseau = await this.prisma.ciseauTarifaire.findUnique({
      where: { annee }
    });

    let ciseauTarifaire;
    if (existingCiseau) {
      // Mettre à jour avec les valeurs du tarif facial
      ciseauTarifaire = await this.prisma.ciseauTarifaire.update({
        where: { annee },
        data: {
          cout,
          tariffacialOffnet,
          DiffTariffacialOffnetHC,
          DiffTariffacialOffnetHP,
          isCiseauOffTarifHC,
          isCiseauOffTarifHP
        }
      });
    } else {
      // Créer un nouveau ciseau tarifaire avec les valeurs du tarif facial
      ciseauTarifaire = await this.prisma.ciseauTarifaire.create({
        data: {
          annee,
          cout,
          tariffacialOffnet,
          DiffTariffacialOffnetHC,
          DiffTariffacialOffnetHP,
          isCiseauOffTarifHC,
          isCiseauOffTarifHP
        }
      });
    }

    // Lier le ciseau tarifaire à l'offre si ce n'est pas déjà fait
    if (offre.ciseauTarifaireId !== ciseauTarifaire.id) {
      await this.prisma.offre.update({
        where: { id: offreId },
        data: {
          ciseauTarifaireId: ciseauTarifaire.id
        }
      });
    }

    return {
      offre: {
        id: offre.id,
        nom: offre.nom,
        operateur: {
          id: offre.operateur.id,
          nom: offre.operateur.nom
        }
      },
      calculTarifFacial: {
        nombreOptions: prixReseaux.nombreOptions,
        prixOffNetCalcule: tariffacialOffnet.toString()
      },
      ciseauTarifaire: this.mapToResponseDtoTarifFacial(ciseauTarifaire),
      resultats: {
        isCiseauOffTarifHC: ciseauTarifaire.isCiseauOffTarifHC,
        isCiseauOffTarifHP: ciseauTarifaire.isCiseauOffTarifHP,
        messageOffTarifHC: ciseauTarifaire.isCiseauOffTarifHC 
          ? 'Ciseau tarifaire détecté pour OffNet HC (tarif facial)' 
          : 'Pas de ciseau tarifaire pour OffNet HC (tarif facial)',
        messageOffTarifHP: ciseauTarifaire.isCiseauOffTarifHP 
          ? 'Ciseau tarifaire détecté pour OffNet HP (tarif facial)' 
          : 'Pas de ciseau tarifaire pour OffNet HP (tarif facial)'
      }
    };
  }

  /**
   * Calculer le ciseau tarifaire pour une offre spécifique
   * Récupère l'opérateur de l'offre et calcule le ciseau tarifaire
   */
  async calculateCiseauTarifaireForOffre(offreId: number) {
    // Récupérer l'offre avec son opérateur
    const offre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      include: {
        operateur: true
      }
    });

    if (!offre) {
      throw new NotFoundException(`Offre avec l'ID ${offreId} non trouvée`);
    }

    // Extraire l'année depuis les dates de validité de l'offre
    const annee = offre.dateDebutValidite.getFullYear();

    // Calculer le ciseau tarifaire pour cet opérateur et cette année
    const ciseauTarifaire = await this.calculateCiseauTarifaire(offre.operateurId, annee);

    // Lier le ciseau tarifaire à l'offre si ce n'est pas déjà fait
    if (offre.ciseauTarifaireId !== ciseauTarifaire.id) {
      await this.prisma.offre.update({
        where: { id: offreId },
        data: {
          ciseauTarifaireId: ciseauTarifaire.id
        }
      });
    }

    return {
      offre: {
        id: offre.id,
        nom: offre.nom,
        operateur: {
          id: offre.operateur.id,
          nom: offre.operateur.nom
        }
      },
      ciseauTarifaire,
      resultats: {
        isCiseauOffHC: ciseauTarifaire.isCiseauOffHC,
        isCiseauOffHP: ciseauTarifaire.isCiseauOffHP,
        messageOffHC: ciseauTarifaire.isCiseauOffHC 
          ? 'Ciseau tarifaire détecté pour OffNet HC' 
          : 'Pas de ciseau tarifaire pour OffNet HC',
        messageOffHP: ciseauTarifaire.isCiseauOffHP 
          ? 'Ciseau tarifaire détecté pour OffNet HP' 
          : 'Pas de ciseau tarifaire pour OffNet HP'
      }
    };
  }

  async findAll(query: EffetClubQueryDto): Promise<PaginatedEffetClubResponse> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Construction du tri
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    if (limit === 0) {
      // Retourner tous les résultats sans pagination
      const effetsClub = await this.prisma.ciseauTarifaire.findMany({
        orderBy,
        include: {
          offres: {
            select: {
              id: true,
              nom: true,
              operateurId: true
            }
          }
        }
      });

      return {
        data: effetsClub.map(item => this.mapToResponseDto(item)),
        meta: {
          total: effetsClub.length,
          page: 1,
          limit: 0,
          totalPages: 1
        }
      };
    }

    // Pagination normale
    const skip = (page - 1) * limit;
    const [effetsClub, total] = await Promise.all([
      this.prisma.ciseauTarifaire.findMany({
        skip,
        take: limit,
        orderBy,
        include: {
          offres: {
            select: {
              id: true,
              nom: true,
              operateurId: true
            }
          }
        }
      }),
      this.prisma.ciseauTarifaire.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: effetsClub.map(item => this.mapToResponseDto(item)),
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async findOne(id: number) {
    const ciseauTarifaire = await this.prisma.ciseauTarifaire.findUnique({
      where: { id },
      include: {
        offres: {
          select: {
            id: true,
            nom: true,
            operateurId: true
          }
        }
      }
    });

    if (!ciseauTarifaire) {
      throw new NotFoundException(`Ciseau tarifaire avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(ciseauTarifaire);
  }



  private mapToResponseDto(effetClub: any) {
    const cout = effetClub.cout?.toString() || '0';
    const differenceOffnetHC = effetClub.differenceOffnetHC?.toString() || '0';
    const differenceOffnetHP = effetClub.differenceOffnetHP?.toString() || '0';
    const differenceOnnetHC = effetClub.differenceOnnetHC?.toString() || '0';
    const differenceOnnetHP = effetClub.differenceOnnetHP?.toString() || '0';

    return {
      id: effetClub.id,
      annee: effetClub.annee,
      cout,
      differenceOffnetHC,
      differenceOffnetHP,
      differenceOnnetHC,
      differenceOnnetHP,
      isCiseauOffHC: effetClub.isCiseauOffHC,
      isCiseauOffHP: effetClub.isCiseauOffHP,
      resultats: {
        offnetHC: {
          difference: differenceOffnetHC,
          cout,
          isCiseau: effetClub.isCiseauOffHC,
          resultat: effetClub.isCiseauOffHC 
            ? `Ciseau tarifaire (${differenceOffnetHC} <= ${cout})` 
            : `Pas de ciseau tarifaire (${differenceOffnetHC} > ${cout})`
        },
        offnetHP: {
          difference: differenceOffnetHP,
          cout,
          isCiseau: effetClub.isCiseauOffHP,
          resultat: effetClub.isCiseauOffHP 
            ? `Ciseau tarifaire (${differenceOffnetHP} <= ${cout})` 
            : `Pas de ciseau tarifaire (${differenceOffnetHP} > ${cout})`
        }
      },
      formules: {
        differenceOffnetHC: `Tarif Base OffNet HC - Tarif Interconnexion OffNet HC = ${differenceOffnetHC}`,
        differenceOffnetHP: `Tarif Base OffNet HP - Tarif Interconnexion OffNet HP = ${differenceOffnetHP}`,
        differenceOnnetHC: `Tarif Base OnNet HC - Tarif Interconnexion OnNet HC = ${differenceOnnetHC}`,
        differenceOnnetHP: `Tarif Base OnNet HP - Tarif Interconnexion OnNet HP = ${differenceOnnetHP}`
      },
      offres: effetClub.offres || [],
      createdAt: effetClub.createdAt,
      updatedAt: effetClub.updatedAt
    };
  }

  /**
   * Mapper pour le ciseau tarifaire avec tarif facial
   */
  private mapToResponseDtoTarifFacial(effetClub: any) {
    const cout = effetClub.cout?.toString() || '0';
    const tariffacialOffnet = effetClub.tariffacialOffnet?.toString() || '0';
    const DiffTariffacialOffnetHC = effetClub.DiffTariffacialOffnetHC?.toString() || '0';
    const DiffTariffacialOffnetHP = effetClub.DiffTariffacialOffnetHP?.toString() || '0';

    return {
      id: effetClub.id,
      annee: effetClub.annee,
      cout,
      tariffacialOffnet,
      DiffTariffacialOffnetHC,
      DiffTariffacialOffnetHP,
      isCiseauOffTarifHC: effetClub.isCiseauOffTarifHC,
      isCiseauOffTarifHP: effetClub.isCiseauOffTarifHP,
      resultats: {
        offnetTarifHC: {
          tariffacial: tariffacialOffnet,
          difference: DiffTariffacialOffnetHC,
          cout,
          isCiseau: effetClub.isCiseauOffTarifHC,
          resultat: effetClub.isCiseauOffTarifHC 
            ? `Ciseau tarifaire (${DiffTariffacialOffnetHC} <= ${cout})` 
            : `Pas de ciseau tarifaire (${DiffTariffacialOffnetHC} > ${cout})`
        },
        offnetTarifHP: {
          tariffacial: tariffacialOffnet,
          difference: DiffTariffacialOffnetHP,
          cout,
          isCiseau: effetClub.isCiseauOffTarifHP,
          resultat: effetClub.isCiseauOffTarifHP 
            ? `Ciseau tarifaire (${DiffTariffacialOffnetHP} <= ${cout})` 
            : `Pas de ciseau tarifaire (${DiffTariffacialOffnetHP} > ${cout})`
        }
      },
      formules: {
        tariffacialOffnet: `Prix OffNet de l'offre = ${tariffacialOffnet}`,
        DiffTariffacialOffnetHC: `Tarif Facial OffNet - Tarif Interconnexion OffNet HC = ${DiffTariffacialOffnetHC}`,
        DiffTariffacialOffnetHP: `Tarif Facial OffNet - Tarif Interconnexion OffNet HP = ${DiffTariffacialOffnetHP}`
      },
      offres: effetClub.offres || [],
      createdAt: effetClub.createdAt,
      updatedAt: effetClub.updatedAt
    };
  }
}
