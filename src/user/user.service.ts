// src/user/user.service.ts

import * as bcrypt from 'bcryptjs';
import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivityLogQueryDto } from './dto/activity-log-query.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  // Fonction pour logger une action
  async logActivity(
    userId: number,
    action: string,
    description: string,
    ipAddress?: string,
  ) {
    await this.prismaService.activityLog.create({
      data: {
        userId,
        action,
        module: 'USER',
        level: 'INFO',
        description,
        ipAddress,
      },
    });
  }

  // 🔐 API 1: Afficher les informations de l'utilisateur connecté
  async getProfile(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            id: true,
            nom: true,
            description: true,
          },
        },
        service: {
          select: {
            id: true,
            nom: true,
            sigle: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // Retirer le mot de passe et les données sensibles
    const { password: _, resetOtp: __, resetExpires: ___, verifyOtp: ____, verifyExpires: _____, ...userWithoutSensitiveData } = user;

    return this.formatResponse(
      userWithoutSensitiveData,
      'Profil utilisateur',
      'Informations de l\'utilisateur récupérées avec succès.',
    );
  }

  // 🔐 API 2: Changer le mot de passe de l'utilisateur connecté
  async changeMyPassword(userId: number, changePasswordDto: ChangePasswordDto, ipAddress?: string) {
    const { password, confirmPassword } = changePasswordDto;

    // 1️⃣ Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas.');
    }

    // 2️⃣ Vérifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // 3️⃣ Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Mettre à jour le mot de passe
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // 5️⃣ Logger l'action
    await this.logActivity(
      userId,
      'CHANGE_PASSWORD',
      'L\'utilisateur a changé son mot de passe',
      ipAddress,
    );

    return this.formatResponse(
      {},
      'Mot de passe modifié',
      'Votre mot de passe a été modifié avec succès.',
    );
  }

  // 🔐 API 3: Changer le mot de passe d'un utilisateur par son ID
  async changeUserPassword(userId: number, targetUserId: number, changePasswordDto: ChangePasswordDto, ipAddress?: string) {
    const { password, confirmPassword } = changePasswordDto;

    // 1️⃣ Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas.');
    }

    // 2️⃣ Vérifier si l'utilisateur cible existe
    const targetUser = await this.prismaService.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // 3️⃣ Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Mettre à jour le mot de passe
    await this.prismaService.user.update({
      where: { id: targetUserId },
      data: {
        password: hashedPassword,
      },
    });

    // 5️⃣ Logger l'action
    await this.logActivity(
      userId,
      'ADMIN_CHANGE_PASSWORD',
      `Modification du mot de passe de l'utilisateur ID: ${targetUserId} (${targetUser.email})`,
      ipAddress,
    );

    return this.formatResponse(
      { userId: targetUserId, email: targetUser.email },
      'Mot de passe modifié',
      `Le mot de passe de l'utilisateur ${targetUser.email} a été modifié avec succès.`,
    );
  }

  // 🔐 API 4: Récupérer les logs d'actions (paginé avec filtres)
  async getActivityLogs(userId: number, query: ActivityLogQueryDto) {
    const { page = 1, limit = 10, action, search } = query;
    const skip = (page - 1) * limit;

    // Construction de la requête avec filtres
    const where: any = { userId };

    if (action) {
      where.action = action;
    }

    if (search) {
      where.description = {
        contains: search,
      };
    }

    // Récupérer les logs avec pagination
    const [logs, total] = await Promise.all([
      this.prismaService.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prismaService.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return this.formatResponse(
      {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Logs d\'activité',
      `${logs.length} log(s) d'activité récupéré(s).`,
    );
  }
}
