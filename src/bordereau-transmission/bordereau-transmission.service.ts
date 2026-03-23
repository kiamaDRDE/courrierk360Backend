// src/bordereau-transmission/bordereau-transmission.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBordereauDto } from './dto/create-bordereau.dto';
import { UpdateBordereauDto } from './dto/update-bordereau.dto';
import { BordereauQueryDto } from './dto/bordereau-query.dto';
import { ResponseFormatterService } from '../common/response-formatter.service';

@Injectable()
export class BordereauTransmissionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
  ) {}

  // 📝 Créer plusieurs bordereaux de transmission
  async create(createBordereauDto: CreateBordereauDto) {
    const { bordereauData, numeroReference, nombrePieceJointe } = createBordereauDto;

    // Vérifier que tous les correspondants existent
    const correspondantIds = bordereauData.map(b => b.correspondantId);
    const correspondants = await this.prismaService.correspondant.findMany({
      where: { id: { in: correspondantIds } },
    });

    if (correspondants.length !== correspondantIds.length) {
      throw new NotFoundException('Un ou plusieurs correspondants sont introuvables.');
    }

    // Récupérer tous les IDs de courriers
    const allCourrierIds = bordereauData.flatMap(b => b.courrierIds);
    
    // Vérifier que tous les courriers existent
    const courriers = await this.prismaService.courrierDepart.findMany({
      where: { id: { in: allCourrierIds } },
    });

    if (courriers.length !== allCourrierIds.length) {
      throw new NotFoundException('Un ou plusieurs courriers sont introuvables.');
    }

    // Créer les bordereaux
    const createdBordereaux = await this.prismaService.$transaction(
      bordereauData.map((bordereau) =>
        this.prismaService.bordereauTransmission.create({
          data: {
            correspondantId: bordereau.correspondantId,
            courrierIds: bordereau.courrierIds,
            numeroReference: numeroReference || null,
            nombrePieceJointe: nombrePieceJointe || null,
          },
        }),
      ),
    );

    return this.responseFormatter.success(
      createdBordereaux,
      'Création de bordereaux',
      `${createdBordereaux.length} bordereau(x) de transmission créé(s) avec succès.`,
    );
  }

  // ✏️ Mettre à jour plusieurs bordereaux de transmission
  async update(updateBordereauDto: UpdateBordereauDto) {
    const { bordereauData } = updateBordereauDto;

    // Vérifier que tous les bordereaux existent
    const bordereauIds = bordereauData.map(b => b.id);
    const existingBordereaux = await this.prismaService.bordereauTransmission.findMany({
      where: { id: { in: bordereauIds } },
    });

    if (existingBordereaux.length !== bordereauIds.length) {
      throw new NotFoundException('Un ou plusieurs bordereaux sont introuvables.');
    }

    // Vérifier que tous les correspondants existent
    const correspondantIds = bordereauData.map(b => b.correspondantId);
    const correspondants = await this.prismaService.correspondant.findMany({
      where: { id: { in: correspondantIds } },
    });

    if (correspondants.length !== correspondantIds.length) {
      throw new NotFoundException('Un ou plusieurs correspondants sont introuvables.');
    }

    // Récupérer tous les IDs de courriers
    const allCourrierIds = bordereauData.flatMap(b => b.courrierIds);
    
    // Vérifier que tous les courriers existent
    const courriers = await this.prismaService.courrierDepart.findMany({
      where: { id: { in: allCourrierIds } },
    });

    if (courriers.length !== allCourrierIds.length) {
      throw new NotFoundException('Un ou plusieurs courriers sont introuvables.');
    }

    // Mettre à jour les bordereaux
    const updatedBordereaux = await this.prismaService.$transaction(
      bordereauData.map((bordereau) =>
        this.prismaService.bordereauTransmission.update({
          where: { id: bordereau.id },
          data: {
            correspondantId: bordereau.correspondantId,
            courrierIds: bordereau.courrierIds,
          },
        }),
      ),
    );

    return this.responseFormatter.success(
      updatedBordereaux,
      'Mise à jour de bordereaux',
      `${updatedBordereaux.length} bordereau(x) de transmission mis à jour avec succès.`,
    );
  }

  // 🔍 Récupérer un bordereau par ID
  async findOne(id: number) {
    const bordereau = await this.prismaService.bordereauTransmission.findUnique({
      where: { id },
    });

    if (!bordereau) {
      throw new NotFoundException('Bordereau de transmission non trouvé.');
    }

    const courrierIds = bordereau.courrierIds as any as number[] || [];

    // Récupérer les informations des courriers
    const courriers = courrierIds.length > 0
      ? await this.prismaService.courrierDepart.findMany({
          where: { id: { in: courrierIds } },
           select: {
             id: true,
             numeroReference: true,
             typeCourrier: true,
             numeroActe: true,
             objet: true,
             document: true,
             commentaire: true,
             idDestinataire: true,
             idCourrier: true,
             idProjet: true,
           },
         })
      : [];

    // Enrichir les courriers avec leurs relations
    const courriersEnrichis = await Promise.all(
      courriers.map(async (courrier) => {
        // Récupérer le destinataire
        const destinataire = courrier.idDestinataire
          ? await this.prismaService.correspondant.findUnique({
              where: { id: courrier.idDestinataire },
              select: { id: true, nom: true },
            })
          : null;

        // Récupérer le signataire
        const projet = courrier.idProjet
          ? await this.prismaService.projet.findUnique({
              where: { id: courrier.idProjet },
              select: { id: true, name: true },
            })
          : null;

        // Récupérer le courrier lié
        const courrierLie = courrier.idCourrier
          ? await this.prismaService.courrier.findUnique({
              where: { id: courrier.idCourrier },
              select: { id: true, objet: true },
            })
          : null;

        return {
          id: courrier.id,
          numeroReference: courrier.numeroReference,
          typeCourrier: courrier.typeCourrier,
          numeroActe: courrier.numeroActe,
          objet: courrier.objet,
          document: courrier.document,
          commentaire: courrier.commentaire,
          destinataire,
          projet,
          courrier: courrierLie,
        };
      }),
    );

    const response = {
      id: bordereau.id,
      correspondantId: bordereau.correspondantId,
      courrierIds,
      courriers: courriersEnrichis,
      numeroReference: bordereau.numeroReference,
      nombrePieceJointe: bordereau.nombrePieceJointe,
      createdAt: bordereau.createdAt,
      updatedAt: bordereau.updatedAt,
    };

    return this.responseFormatter.success(
      response,
      'Détails du bordereau',
      'Bordereau de transmission récupéré avec succès.',
    );
  }

  // 📋 Liste de tous les bordereaux avec filtres et pagination
  async findAll(query: BordereauQueryDto) {
    const { page = 1, limit = 10, numeroReference } = query;

    // Construction des filtres
    const where: any = {};
    if (numeroReference) {
      where.numeroReference = {
        contains: numeroReference,
      };
    }

    // Compter le nombre total de bordereaux
    const total = await this.prismaService.bordereauTransmission.count({ where });

    // Récupérer les bordereaux avec pagination
    const bordereaux = await this.prismaService.bordereauTransmission.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Enrichir chaque bordereau avec les informations des courriers
    const bordereauxEnrichis = await Promise.all(
      bordereaux.map(async (bordereau) => {
        const courrierIds = bordereau.courrierIds as any as number[] || [];

        // Récupérer les informations des courriers
        const courriers = courrierIds.length > 0
          ? await this.prismaService.courrierDepart.findMany({
              where: { id: { in: courrierIds } },
               select: {
                 id: true,
                 numeroReference: true,
                 typeCourrier: true,
                 numeroActe: true,
                 objet: true,
                 document: true,
                 commentaire: true,
                 idDestinataire: true,
                 idProjet: true,
               },
             })
          : [];

        // Enrichir les courriers avec leurs relations
        const courriersEnrichis = await Promise.all(
          courriers.map(async (courrier) => {
            // Récupérer le destinataire
            const destinataire = courrier.idDestinataire
              ? await this.prismaService.correspondant.findUnique({
                  where: { id: courrier.idDestinataire },
                  select: { id: true, nom: true },
                })
              : null;

            // Récupérer le signataire
            const projet = courrier.idProjet
              ? await this.prismaService.projet.findUnique({
                  where: { id: courrier.idProjet },
                  select: { id: true, name: true },
                })
              : null;

            return {
              id: courrier.id,
              numeroReference: courrier.numeroReference,
              typeCourrier: courrier.typeCourrier,
              numeroActe: courrier.numeroActe,
              objet: courrier.objet,
              document: courrier.document,
              commentaire: courrier.commentaire,
              destinataire,
              projet,
            };
          }),
        );

        return {
          id: bordereau.id,
          correspondantId: bordereau.correspondantId,
          courrierIds,
          courriers: courriersEnrichis,
          numeroReference: bordereau.numeroReference,
          nombrePieceJointe: bordereau.nombrePieceJointe,
          createdAt: bordereau.createdAt,
          updatedAt: bordereau.updatedAt,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return this.responseFormatter.success(
      {
        total,
        page,
        limit,
        totalPages,
        data: bordereauxEnrichis,
      },
      'Liste des bordereaux',
      `${total} bordereau(x) de transmission trouvé(s).`,
    );
  }

  // 🗑️ Supprimer un bordereau de transmission
  async remove(id: number) {
    const bordereau = await this.prismaService.bordereauTransmission.findUnique({
      where: { id },
    });

    if (!bordereau) {
      throw new NotFoundException('Bordereau de transmission non trouvé.');
    }

    await this.prismaService.bordereauTransmission.delete({
      where: { id },
    });

    return this.responseFormatter.success(
      { id },
      'Suppression bordereau',
      'Bordereau de transmission supprimé avec succès.',
    );
  }
}
