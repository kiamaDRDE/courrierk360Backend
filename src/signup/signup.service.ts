// src/signup/signup.service.ts

import * as bcrypt from 'bcryptjs';
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from './../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailerService: MailerService,
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

  // 👤 Création d'un utilisateur
  async signup(signupDto: SignupDto) {
    const { nom, email, numero, fonction, password, role } = signupDto;

    // 1️⃣ Vérifier si l'email existe déjà
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé.');
    }

    // 2️⃣ Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Créer l'utilisateur
    const user = await this.prismaService.user.create({
      data: {
        nom,
        email,
        numero,
        fonction: fonction || null,
        password: hashedPassword,
        role: (role || 'SUPER_ADMIN') as any,
      },
    });

    // 4️⃣ Envoyer l'email de bienvenue de manière asynchrone (sans bloquer la réponse)
    setTimeout(() => this.sendWelcomeEmailAsync(user.email, user.nom), 0);

    // 5️⃣ Retourner l'utilisateur créé (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    return this.formatResponse(
      userWithoutPassword,
      'Création utilisateur',
      'Utilisateur créé avec succès. Un email de bienvenue a été envoyé.',
    );
  }

  // Méthode privée pour envoyer l'email de bienvenue de manière asynchrone
  private async sendWelcomeEmailAsync(email: string, nom: string): Promise<void> {
    try {
      await this.mailerService.sendWelcomeEmail(email, nom);
      this.logger.log(`Email de bienvenue envoyé avec succès à ${email}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de bienvenue à ${email}:`, error);
      // Ne pas faire échouer la création du compte si l'email échoue
    }
  }

  // 👤 Mise à jour d'un utilisateur
  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    // 1️⃣ Vérifier si l'utilisateur existe
    const existingUser = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // 2️⃣ Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prismaService.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new BadRequestException('Cet email est déjà utilisé par un autre utilisateur.');
      }
    }

    // 3️⃣ Préparer les données à mettre à jour
    const dataToUpdate: any = {};

    if (updateUserDto.nom) dataToUpdate.nom = updateUserDto.nom;
    if (updateUserDto.email) dataToUpdate.email = updateUserDto.email;
    if (updateUserDto.numero) dataToUpdate.numero = updateUserDto.numero;
    if (updateUserDto.fonction !== undefined) dataToUpdate.fonction = updateUserDto.fonction;
    if (updateUserDto.role) dataToUpdate.role = updateUserDto.role as any;

    // 4️⃣ Si le mot de passe est fourni, le hacher
    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 5️⃣ Mettre à jour l'utilisateur
    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: dataToUpdate,
    });

    // 6️⃣ Retourner l'utilisateur mis à jour (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = updatedUser;

    return this.formatResponse(
      userWithoutPassword,
      'Mise à jour utilisateur',
      'Utilisateur mis à jour avec succès.',
    );
  }

  // 🗑️ Suppression d'un utilisateur par ID
  async deleteUser(id: number) {
    // 1️⃣ Vérifier si l'utilisateur existe
    const existingUser = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // 2️⃣ Supprimer l'utilisateur
    await this.prismaService.user.delete({
      where: { id },
    });

    return this.formatResponse(
      { id },
      'Suppression utilisateur',
      'Utilisateur supprimé avec succès.',
    );
  }

  // 🗑️ Suppression de plusieurs utilisateurs par IDs
  async deleteMultipleUsers(ids: number[]) {
    // 1️⃣ Vérifier si des IDs ont été fournis
    if (!ids || ids.length === 0) {
      throw new BadRequestException('Aucun ID fourni.');
    }

    // 2️⃣ Supprimer les utilisateurs
    const result = await this.prismaService.user.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return this.formatResponse(
      { count: result.count, ids },
      'Suppression multiple',
      `${result.count} utilisateur(s) supprimé(s) avec succès.`,
    );
  }

  // 📋 Liste de tous les utilisateurs avec filtres et pagination
  async getAllUsers(query: UserQueryDto) {
    const {
      page = 1,
      limit = 10,
      nom,
      email,
      numero,
      fonction,
      role,
      statut,
    } = query;

    // Construction des filtres
    const where: any = {};

    if (nom) {
      where.nom = { contains: nom };
    }

    if (email) {
      where.email = { contains: email };
    }

    if (numero) {
      where.numero = { contains: numero };
    }

    if (fonction) {
      where.fonction = { contains: fonction };
    }

    if (role) {
      where.role = role;
    }

    if (statut) {
      where.statut = statut;
    }

    // Compter le total
    const total = await this.prismaService.user.count({ where });

    // Si limit est 0, retourner tous les résultats
    if (limit === 0) {
      const users = await this.prismaService.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      const usersWithoutPassword = users.map((user) => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return this.formatResponse(
        {
          users: usersWithoutPassword,
          pagination: {
            total,
            page: 1,
            limit: total,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        'Liste des utilisateurs',
        `${total} utilisateur(s) récupéré(s) avec succès.`,
      );
    }

    // Pagination normale
    const skip = (page - 1) * limit;
    const users = await this.prismaService.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const usersWithoutPassword = users.map((user) => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return this.formatResponse(
      {
        users: usersWithoutPassword,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
      'Liste des utilisateurs',
      `${usersWithoutPassword.length} utilisateur(s) sur ${total} récupéré(s) avec succès.`,
    );
  }

  // 👤 Récupérer un utilisateur par son ID
  async getUserById(id: number) {
    // 1️⃣ Vérifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // 2️⃣ Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    return this.formatResponse(
      userWithoutPassword,
      'Détails utilisateur',
      'Utilisateur récupéré avec succès.',
    );
  }
}
