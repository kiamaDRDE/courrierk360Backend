import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StatistiqueQueryDto } from './dto/statistique-query.dto';

@Injectable()
export class StatistiqueService {
  constructor(private readonly prismaService: PrismaService) {}

  private parseDateRange(start?: string, end?: string) {
    if (!start && !end) return undefined;
    const range: { gte?: Date; lte?: Date } = {};

    if (start) {
      const startDate = new Date(start);
      if (Number.isNaN(startDate.getTime())) {
        throw new BadRequestException('La date de dÃ©but est invalide.');
      }
      range.gte = startDate;
    }

    if (end) {
      const endDate = new Date(end);
      if (Number.isNaN(endDate.getTime())) {
        throw new BadRequestException('La date de fin est invalide.');
      }
      range.lte = endDate;
    }

    return range;
  }

  private countBy(items: any[], getKey: (item: any) => string | null | undefined) {
    return items.reduce((acc: Record<string, number>, item) => {
      const key = getKey(item) || 'Non dÃ©fini';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private countByMonth(items: Array<{ createdAt: Date }>) {
    return items.reduce((acc: Record<string, number>, item) => {
      const date = item.createdAt;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  async getGlobalStats(filters: StatistiqueQueryDto) {
    const createdAt = this.parseDateRange(filters.dateDebut, filters.dateFin);
    const filtersApplied: string[] = [];

    if (filters.dateDebut || filters.dateFin) filtersApplied.push('createdAt');
    if (filters.priorite) filtersApplied.push('priorite');
    if (filters.isConfidentiel !== undefined) filtersApplied.push('isConfidentiel');
    if (filters.serviceId) filtersApplied.push('serviceId');

    const hasCourrierFilters =
      Boolean(filters.priorite) || filters.isConfidentiel !== undefined || Boolean(filters.serviceId);

    const baseCourrierWhere: Prisma.CourrierWhereInput = {
      isDelete: false,
      ...(filters.priorite ? { priorite: filters.priorite } : {}),
      ...(filters.isConfidentiel !== undefined ? { isConfidentiel: filters.isConfidentiel } : {}),
      ...(filters.serviceId ? { idService: filters.serviceId } : {}),
    };

    const courrierWhere: Prisma.CourrierWhereInput = {
      ...baseCourrierWhere,
      ...(createdAt ? { createdAt } : {}),
    };

    // Filtres pour les entitÃ©s liÃ©es aux courriers
    const courrierDepartWhere: Prisma.CourrierDepartWhereInput = {
      isDelete: false,
      ...(hasCourrierFilters ? { courrier: baseCourrierWhere } : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const transmissionWhere: Prisma.TransmissionWhereInput = {
      isDelete: false,
      ...(hasCourrierFilters ? { courrier: baseCourrierWhere } : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const reponseWhere: Prisma.ReponseWhereInput = {
      isDelete: false,
      ...(hasCourrierFilters
        ? {
            courriers: {
              some: {
                courrier: baseCourrierWhere,
              },
            },
          }
        : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const [
      courriers,
      courriersDepart,
      transmissions,
      reponses,
      utilisateurs,
      roles,
      services,
      correspondants,
      categories,
      typesCourrier,
    ] = await Promise.all([
      this.prismaService.courrier.findMany({
        where: courrierWhere,
        include: {
          service: true,
          typeCourrier: true,
          provenance: true,
        },
      }),
      this.prismaService.courrierDepart.findMany({
        where: courrierDepartWhere,
        include: {
          courrier: { select: { id: true, numero: true, objet: true } },
          signataire: { select: { id: true, firstName: true, lastName: true, email: true } },
          destinataire: { select: { id: true, nom: true, email: true, telephone: true } },
        },
      }),
      this.prismaService.transmission.findMany({
        where: transmissionWhere,
        include: {
          courrier: { select: { id: true, numero: true, objet: true } },
          service: { select: { id: true, nom: true, sigle: true } },
          emetteur: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prismaService.reponse.findMany({
        where: reponseWhere,
        include: {
          redacteur: { select: { id: true, firstName: true, lastName: true, email: true } },
          serviceDestinataire: { select: { id: true, nom: true, sigle: true } },
        },
      }),
      this.prismaService.user.findMany({
        where: {
          isDelete: false,
          ...(createdAt ? { createdAt } : {}),
        },
        include: {
          service: { select: { id: true, nom: true, sigle: true } },
          role: { select: { id: true, nom: true } },
        },
      }),
      this.prismaService.role.findMany({
        where: {
          isDelete: false,
          ...(createdAt ? { createdAt } : {}),
        },
        include: { _count: { select: { users: true } } },
      }),
      this.prismaService.service.findMany({
        where: {
          isDelete: false,
          ...(createdAt ? { createdAt } : {}),
        },
        include: {
          parent: { select: { id: true, nom: true, sigle: true } },
          users: { select: { id: true } },
        },
      }),
      this.prismaService.correspondant.findMany({
        where: {
          isDelete: false,
          ...(createdAt ? { createdAt } : {}),
        },
        include: {
          categories: { include: { categorie: { select: { id: true, nom: true } } } },
        },
      }),
      this.prismaService.categories.findMany({
        where: {
          isDelete: false,
          ...(createdAt ? { createdAt } : {}),
        },
        include: { correspondants: true },
      }),
      this.prismaService.typeCourrier.findMany({
        where: {
          isDelete: false,
          ...(createdAt ? { createdAt } : {}),
        },
        include: { courriers: { select: { id: true } } },
      }),
    ]);

    const courrierArrive = {
      total: courriers.length,
      par_statut: this.countBy(courriers, (c) => c.statut),
      par_priorite: this.countBy(courriers, (c) => c.priorite),
      par_service: this.countBy(courriers, (c) => c.service?.nom || 'Non affectÃ©'),
      par_type_courrier: this.countBy(courriers, (c) => c.typeCourrier?.nom),
      par_provenance: this.countBy(courriers, (c) => c.provenance?.nom),
      confidentiels: courriers.filter((c) => c.isConfidentiel).length,
      geles: courriers.filter((c) => c.isGeled).length,
      details: courriers.map((c) => ({
        id: c.id,
        numero: c.numero,
        objet: c.objet,
        statut: c.statut,
        date_arrivee: c.dateArrivee,
        priorite: c.priorite,
        service: c.service?.nom || 'Non affectÃ©',
        is_geled: c.isGeled,
        is_confidentiel: c.isConfidentiel,
      })),
    };

    const courrierDepartStats = {
      total: courriersDepart.length,
      par_type_courrier: this.countBy(courriersDepart, (c) => c.typeCourrier),
      par_classe: this.countBy(courriersDepart, (c) => c.classeCourrier),
      par_categorie: this.countBy(courriersDepart, (c) => c.categorie),
      par_signataire: this.countBy(courriersDepart, (c) => {
        const fullName = `${c.signataire?.firstName || ''} ${c.signataire?.lastName || ''}`.trim();
        return fullName || 'Non dÃ©fini';
      }),
      par_destinataire: this.countBy(courriersDepart, (c) => c.destinataire?.nom),
      par_mois: this.countByMonth(courriersDepart as Array<{ createdAt: Date }>),
      details: courriersDepart.map((c) => ({
        id: c.id,
        courrier_id: c.courrier?.id || null,
        courrier_numero: c.courrier?.numero || null,
        courrier_objet: c.courrier?.objet || null,
        date_signature: c.dateSignature,
        type_courrier: c.typeCourrier,
        classe_courrier: c.classeCourrier,
        numero_reference: c.numeroReference,
        numero_acte: c.numeroActe,
        commentaire: c.commentaire,
        signataire: c.signataire
          ? { id: c.signataire.id, nom: c.signataire.lastName || null, prenom: c.signataire.firstName || null, email: c.signataire.email || null }
          : { id: null, nom: null, prenom: null, email: null },
        destinataire: c.destinataire
          ? { id: c.destinataire.id, nom: c.destinataire.nom, email: c.destinataire.email, telephone: c.destinataire.telephone }
          : { id: null, nom: null, email: null, telephone: null },
        email: c.email || '',
        numero_telephone: c.numeroTelephone || '',
        categorie: c.categorie,
        document: c.document || '',
        provenances_copie: c.provenancesCopie || null,
        is_archive: c.isArchive,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      })),
    };

    const transmissionStats = {
      total: transmissions.length,
      par_statut: this.countBy(transmissions, (t) => t.statut),
      par_type_transfert: this.countBy(transmissions, (t) => t.typeTransfert),
      par_service_destinataire: this.countBy(transmissions, (t) => t.service?.nom),
      par_emetteur: this.countBy(transmissions, (t) => {
        const fullName = `${t.emetteur?.firstName || ''} ${t.emetteur?.lastName || ''}`.trim();
        return fullName || 'Non dÃ©fini';
      }),
      avec_accuse_reception: transmissions.filter((t) => t.accuseReception).length,
      par_mois: this.countByMonth(transmissions as Array<{ createdAt: Date }>),
      delai_moyen_traitement: transmissions.filter((t) => t.delaiTraitement !== null).length > 0
        ? Number((
            transmissions
              .filter((t) => t.delaiTraitement !== null)
              .reduce((sum, t) => sum + Number(t.delaiTraitement || 0), 0) /
            transmissions.filter((t) => t.delaiTraitement !== null).length
          ).toFixed(2))
        : 0,
      details: transmissions.map((t) => ({
        id: t.id,
        courrier_id: t.courrier?.id || null,
        courrier_numero: t.courrier?.numero || null,
        courrier_objet: t.courrier?.objet || null,
        date_instruction: t.dateInstruction,
        date_reception: t.dateReception,
        instruction: t.instruction,
        delai_traitement: t.delaiTraitement,
        type_transfert: t.typeTransfert,
        statut: t.statut,
        accuse_reception: t.accuseReception,
        isinstance: t.isinstance,
        emetteur: t.emetteur
          ? { id: t.emetteur.id, nom: t.emetteur.lastName || null, prenom: t.emetteur.firstName || null, email: t.emetteur.email || null }
          : { id: null, nom: null, prenom: null, email: null },
        service_destinataire: t.service
          ? { id: t.service.id, nom: t.service.nom, sigle: t.service.sigle }
          : { id: null, nom: null, sigle: null },
        structures_copie: t.structuresCopie || [],
        piece_jointe: t.pieceJointe || null,
        nombre_piece_jointe: t.nombrePieceJointe || null,
        traite_par: t.traitePar || null,
        is_archive: t.isArchive,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
    };

    const typeCourrierIds = Array.from(
      new Set(
        reponses
          .flatMap((r) => (Array.isArray(r.typesCourrierIds) ? r.typesCourrierIds : []))
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id)),
      ),
    );

    const typeCourrierMap = new Map<number, { id: number; nom: string }>();
    if (typeCourrierIds.length > 0) {
      const types = await this.prismaService.typeCourrier.findMany({
        where: { id: { in: typeCourrierIds } },
        select: { id: true, nom: true },
      });
      for (const t of types) typeCourrierMap.set(t.id, { id: t.id, nom: t.nom });
    }

    const reponseDetails = reponses.map((r) => {
      const typeId = Array.isArray(r.typesCourrierIds) ? Number(r.typesCourrierIds[0]) : null;
      const typeReponse = typeId && typeCourrierMap.get(typeId) ? typeCourrierMap.get(typeId) : { id: null, nom: 'Non dÃ©fini' };
      return {
        id: r.id,
        objet: r.objet,
        commentaire_public: r.commentairePublic || '',
        commentaire_interne: r.commentaireInterne || null,
        date_reponse: r.dateReponse,
        classe_courrier: r.classeCourrier,
        type_transmission: r.typeTransmission || 'Non dÃ©fini',
        type_reponse: typeReponse,
        redacteur: r.redacteur
          ? { id: r.redacteur.id, nom: r.redacteur.lastName || null, prenom: r.redacteur.firstName || null, email: r.redacteur.email || null }
          : { id: null, nom: null, prenom: null, email: null },
        service_destinataire: r.serviceDestinataire
          ? { id: r.serviceDestinataire.id, nom: r.serviceDestinataire.nom, sigle: r.serviceDestinataire.sigle }
          : { id: null, nom: null, sigle: null },
        types_courrier_ids: r.typesCourrierIds || null,
        id_transmission: r.idTransmission || null,
        nombre_piece_jointe: r.nombrePieceJointe || 0,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      };
    });

    const reponseStats = {
      total: reponses.length,
      par_type_reponse: this.countBy(reponseDetails, (r) => r.type_reponse?.nom || 'Non dÃ©fini'),
      par_classe_courrier: this.countBy(reponseDetails, (r) => r.classe_courrier || 'Non dÃ©fini'),
      par_type_transmission: this.countBy(reponseDetails, (r) => r.type_transmission || 'Non dÃ©fini'),
      par_service_destinataire: this.countBy(reponseDetails, (r) => r.service_destinataire?.nom || 'Non dÃ©fini'),
      par_redacteur: this.countBy(reponseDetails, (r) => {
        const fullName = `${r.redacteur?.prenom || ''} ${r.redacteur?.nom || ''}`.trim();
        return fullName || 'Non dÃ©fini';
      }),
      par_mois: this.countByMonth(reponses as Array<{ createdAt: Date }>),
      details: reponseDetails,
    };

    const utilisateursStats = {
      total: utilisateurs.length,
      actifs: utilisateurs.filter((u) => u.isActive).length,
      inactifs: utilisateurs.filter((u) => !u.isActive).length,
      par_service: this.countBy(utilisateurs, (u) => u.service?.nom),
      par_role: this.countBy(utilisateurs, (u) => u.role?.nom),
      details: utilisateurs.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        first_name: u.firstName,
        last_name: u.lastName,
        civilite: u.civilite,
        phone: u.phone,
        is_active: u.isActive,
        is_verified: true,
        is_signataire: u.isSignataire,
        service: u.service ? { id: u.service.id, nom: u.service.nom, sigle: u.service.sigle } : { id: null, nom: null, sigle: null },
        role: u.role ? { id: u.role.id, nom: u.role.nom } : { id: null, nom: null },
        created_at: u.createdAt,
        updated_at: u.updatedAt,
      })),
    };

    const rolesStats = {
      total: roles.length,
      details: roles.map((r) => ({
        id: r.id,
        nom: r.nom,
        description: r.description,
        nombre_utilisateurs: r._count?.users || 0,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      })),
    };

    const servicesStats = {
      total: services.length,
      details: services.map((s) => ({
        id: s.id,
        nom: s.nom,
        sigle: s.sigle,
        email_service: null,
        telephone: null,
        numero_ordre: null,
        type_service: null,
        is_visible_in_transmission: s.isVisible,
        chef_service: { id: null, nom: null, prenom: null, email: null },
        service_parent: s.parent ? { id: s.parent.id, nom: s.parent.nom, sigle: s.parent.sigle } : { id: null, nom: null, sigle: null },
        nombre_utilisateurs: s.users?.length || 0,
        created_at: s.createdAt,
        updated_at: s.updatedAt,
      })),
    };

    const correspondantsStats = {
      total: correspondants.length,
      par_categorie: correspondants.reduce((acc: Record<string, number>, c) => {
        const categories = c.categories?.map((cat) => cat.categorie?.nom).filter(Boolean) as string[];
        if (!categories || categories.length === 0) {
          acc['Non dÃ©fini'] = (acc['Non dÃ©fini'] || 0) + 1;
        } else {
          for (const cat of categories) {
            acc[cat] = (acc[cat] || 0) + 1;
          }
        }
        return acc;
      }, {}),
      details: correspondants.map((c) => ({
        id: c.id,
        nom: c.nom,
        email: c.email,
        telephone: c.telephone,
        matricule: c.matricule,
        type: c.type,
        categories: (c.categories || []).map((cat) => ({
          id: cat.categorie?.id,
          nom: cat.categorie?.nom,
        })),
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      })),
    };

    const categoriesStats = {
      total: categories.length,
      details: categories.map((c) => ({
        id: c.id,
        nom: c.nom,
        nombre_correspondants: c.correspondants?.length || 0,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      })),
    };

    const typesCourrierStats = {
      total: typesCourrier.length,
      details: typesCourrier.map((t) => ({
        id: t.id,
        nom: t.nom,
        nombre_courriers: t.courriers?.length || 0,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
    };

    const relancesStats = {
      total_en_depassement: 0,
      delai_defaut_jours: 7,
      depassements: {
        '7_jours': { count: 0, description: 'Courriers en dÃ©passement de 7 jours', courriers: [] },
        '15_jours': { count: 0, description: 'Courriers en dÃ©passement de 15 jours', courriers: [] },
        '30_jours': { count: 0, description: 'Courriers en dÃ©passement de 30 jours', courriers: [] },
      },
    };

    return {
      success: true,
      filters_applied: filtersApplied,
      data: {
        courrier_arrive: courrierArrive,
        courrier_depart: courrierDepartStats,
        transmissions: transmissionStats,
        reponses: reponseStats,
        utilisateurs: utilisateursStats,
        roles: rolesStats,
        services: servicesStats,
        correspondants: correspondantsStats,
        categories: categoriesStats,
        types_courrier: typesCourrierStats,
        relances: relancesStats,
      },
      generated_at: new Date().toISOString(),
    };
  }
}

