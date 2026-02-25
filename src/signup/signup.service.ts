// src/signup/signup.service.ts

import * as bcrypt from 'bcryptjs';
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import axios from 'axios';
import { randomBytes } from 'crypto';
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

  /**
   * Synchronise les utilisateurs depuis une API externe et insère/met à jour
   * dans la table `user`.
   * Mapping des champs externes -> table locale:
   *  - id -> id
   *  - username -> username
   *  - email -> email
   *  - civilite -> civilite
   *  - fullName -> firstName & lastName
   *  - service -> idService
   *  - role -> idRole
   *  - isActive -> isActive
   *  - isSignataire -> isSignataire
   */
  async syncUsersFromExternal(externalUrl?: string) {
    const url = externalUrl || process.env.EXTERNAL_SERVICES_USERS_URL || 'http://api-kiama360-test.kiama.cm/courrier/users?page=1&limit=0';
    this.logger.log(`Sync users from external URL: ${url}`);

    const externalToken = process.env.EXTERNAL_SERVICES_TOKEN;
    const headers: any = {};
    if (externalToken) {
      headers.Authorization = `Bearer ${externalToken}`;
      this.logger.log('Using EXTERNAL_SERVICES_TOKEN for Authorization header (users)');
    }

    const resp = await axios.get(url, { timeout: 20000, headers });
    const items = Array.isArray(resp.data?.data?.data) ? resp.data.data.data : resp.data?.data || [];

    let processed = 0;
    for (const item of items) {
      try {
        const extId = Number(item.id);
        if (!Number.isInteger(extId)) continue;

        const username = item.username || null;
        const email = item.email || null;
        const civilite = item.civilite || null;
        const fullName = (item.fullName || '').trim();
        const firstName = fullName || null;
        const lastName = fullName || null;
        const idService = item.service || null;
        const idRole = item.role || null;
        const isActive = item.isActive === undefined ? true : Boolean(item.isActive);
        const isSignataire = item.isSignataire === undefined ? false : Boolean(item.isSignataire);

        const existing = await this.prismaService.user.findUnique({ where: { id: extId } });

        if (existing) {
          const updateData: any = {
            username,
            email,
            civilite,
            firstName,
            lastName,
            idService,
            idRole,
            isActive,
            isSignataire,
          };

          // If external password is provided, store it as-is
          if (item.password) {
            updateData.password = item.password;
          }

          await this.prismaService.user.update({ where: { id: extId }, data: updateData });
        } else {
          // Use external password if present (store as-is), otherwise generate a random hashed password
          let pwdToStore: string;
          if (item.password) {
            pwdToStore = item.password;
          } else {
            const randomPwd = randomBytes(8).toString('hex');
            pwdToStore = await bcrypt.hash(randomPwd, 10);
          }

          await this.prismaService.user.create({
            data: {
              id: extId,
              username,
              email,
              password: pwdToStore,
              civilite,
              firstName,
              lastName,
              idService,
              idRole,
              isActive,
              isSignataire,
              numero: '',
            },
          });
        }

        processed++;
      } catch (err) {
        this.logger.error(`Error processing external user item: ${err?.message || err}`);
      }
    }

    return { processed };
  }

  // 👤 Création d'un utilisateur
  async signup(signupDto: SignupDto) {
    const {
      username,
      email,
      password,
      civilite,
      firstName,
      lastName,
      phone,
      numero,
      fonction,
      idService,
      idRole,
      idCorrespondant,
      servicesAdditionel,
      isActive,
      isSignataire,
    } = signupDto;

    // 1️⃣ Vérifier si l'email existe déjà
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé.');
    }

    // 2️⃣ Vérifier si le username existe déjà
    const existingUsername = await this.prismaService.user.findFirst({
      where: { username },
    });

    if (existingUsername) {
      throw new BadRequestException("Ce nom d'utilisateur est déjà utilisé.");
    }

    // 3️⃣ Vérifier que le rôle existe s'il est fourni
    if (idRole) {
      const role = await this.prismaService.role.findFirst({
        where: { id: idRole, isDelete: false },
      });

      if (!role) {
        throw new BadRequestException(`Le rôle avec l'ID ${idRole} n'existe pas.`);
      }
    }

    // 4️⃣ Vérifier que le service existe s'il est fourni
    if (idService) {
      const service = await this.prismaService.service.findFirst({
        where: { id: idService, isDelete: false },
      });

      if (!service) {
        throw new BadRequestException(`Le service avec l'ID ${idService} n'existe pas.`);
      }

      // Vérifier qu'aucun autre utilisateur actif n'a déjà ce service principal
      const userWithService = await this.prismaService.user.findFirst({
        where: {
          idService: idService,
          isDelete: false,
          isActive: true,
        },
      });

      if (userWithService) {
        throw new BadRequestException(`Le service "${service.nom}" est déjà attribué à un autre utilisateur actif.`);
      }
    }

    // 5️⃣ Vérifier que le correspondant existe s'il est fourni
    if (idCorrespondant) {
      const correspondant = await this.prismaService.correspondant.findFirst({
        where: { id: idCorrespondant, isDelete: false },
      });

      if (!correspondant) {
        throw new BadRequestException(`Le correspondant avec l'ID ${idCorrespondant} n'existe pas.`);
      }
    }

    // 6️⃣ Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7️⃣ Créer l'utilisateur
    const user = await this.prismaService.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        civilite,
        firstName,
        lastName,
        phone,
        numero: numero || '',
        idService,
        idRole,
        idCorrespondant,
        isActive: isActive !== undefined ? isActive : true,
        isSignataire: isSignataire !== undefined ? isSignataire : false,
      },
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
          },
        },
        correspondant: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
          },
        },
      },
    });

    // 8️⃣ Gérer les services additionnels si fournis
    if (servicesAdditionel && servicesAdditionel.length > 0) {
      // Vérifier que tous les services existent
      const serviceIds = servicesAdditionel.map((s) => s.serviceId);
      const services = await this.prismaService.service.findMany({
        where: {
          id: { in: serviceIds },
          isDelete: false,
        },
      });

      if (services.length !== serviceIds.length) {
        throw new BadRequestException("Un ou plusieurs services additionnels n'existent pas.");
      }

      // Créer les relations UserServiceAdditionnel
      await this.prismaService.userServiceAdditionnel.createMany({
        data: servicesAdditionel.map((s) => ({
          userId: user.id,
          serviceId: s.serviceId,
        })),
      });
    }

    // 9️⃣ Récupérer l'utilisateur complet avec les services additionnels
    const userWithServices = await this.prismaService.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        numero: true,
        civilite: true,
        avatar: true,
        password: true,
        isSignataire: true,
        isActive: true,
        isDelete: true,
        langue: true,
        idCorrespondant: true,
        idService: true,
        idRole: true,
        createdAt: true,
        updatedAt: true,
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
          },
        },
        correspondant: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
          },
        },
        servicesAdditionnels: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
                sigle: true,
              },
            },
          },
        },
      },
    });

    // 🔟 Envoyer l'email de bienvenue de manière asynchrone
    setTimeout(() => this.sendWelcomeEmailAsync(user.email, user.username), 0);

    // 1️⃣1️⃣ Vérifier que l'utilisateur a été créé
    if (!userWithServices) {
      throw new BadRequestException("Erreur lors de la création de l'utilisateur.");
    }

    // 1️⃣1️⃣ Retourner l'utilisateur créé (sans le mot de passe)
    const { password: _, servicesAdditionnels, ...userWithoutPassword } = userWithServices;

    return this.formatResponse(
      {
        ...userWithoutPassword,
        servicesAdditionel: servicesAdditionnels.map((sa) => ({
          serviceId: sa.service.id,
          serviceName: sa.service.nom,
          userId: userWithServices.id,
          userName: userWithServices.username,
        })),
      },
      'Création utilisateur',
      'Utilisateur créé avec succès. Un email de bienvenue a été envoyé.',
    );
  }

  // Méthode privée pour envoyer l'email de bienvenue de manière asynchrone
  private async sendWelcomeEmailAsync(email: string, userName: string): Promise<void> {
    try {
      await this.mailerService.sendWelcomeEmail(email, userName);
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

    // 3️⃣ Si le username est modifié, vérifier qu'il n'est pas déjà utilisé
    if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
      const usernameExists = await this.prismaService.user.findFirst({
        where: { username: updateUserDto.username },
      });

      if (usernameExists) {
        throw new BadRequestException("Ce nom d'utilisateur est déjà utilisé par un autre utilisateur.");
      }
    }

    // 4️⃣ Vérifier que le rôle existe s'il est fourni
    if (updateUserDto.idRole) {
      const role = await this.prismaService.role.findFirst({
        where: { id: updateUserDto.idRole, isDelete: false },
      });

      if (!role) {
        throw new BadRequestException(`Le rôle avec l'ID ${updateUserDto.idRole} n'existe pas.`);
      }
    }

    // 5️⃣ Vérifier que le service existe s'il est fourni
    if (updateUserDto.idService) {
      const service = await this.prismaService.service.findFirst({
        where: { id: updateUserDto.idService, isDelete: false },
      });

      if (!service) {
        throw new BadRequestException(`Le service avec l'ID ${updateUserDto.idService} n'existe pas.`);
      }

      // Vérifier qu'aucun autre utilisateur actif n'a déjà ce service principal (sauf l'utilisateur actuel)
      if (updateUserDto.idService !== existingUser.idService) {
        const userWithService = await this.prismaService.user.findFirst({
          where: {
            idService: updateUserDto.idService,
            isDelete: false,
            isActive: true,
            id: { not: id }, // Exclure l'utilisateur actuel
          },
        });

        if (userWithService) {
          throw new BadRequestException(`Le service "${service.nom}" est déjà attribué à un autre utilisateur actif.`);
        }
      }
    }

    // 6️⃣ Vérifier que le correspondant existe s'il est fourni
    if (updateUserDto.idCorrespondant) {
      const correspondant = await this.prismaService.correspondant.findFirst({
        where: { id: updateUserDto.idCorrespondant, isDelete: false },
      });

      if (!correspondant) {
        throw new BadRequestException(`Le correspondant avec l'ID ${updateUserDto.idCorrespondant} n'existe pas.`);
      }
    }

    // 7️⃣ Préparer les données à mettre à jour
    const dataToUpdate: any = {};

    if (updateUserDto.username) dataToUpdate.username = updateUserDto.username;
    if (updateUserDto.email) dataToUpdate.email = updateUserDto.email;
    if (updateUserDto.civilite !== undefined) dataToUpdate.civilite = updateUserDto.civilite;
    if (updateUserDto.firstName !== undefined) dataToUpdate.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) dataToUpdate.lastName = updateUserDto.lastName;
    if (updateUserDto.phone !== undefined) dataToUpdate.phone = updateUserDto.phone;
    if (updateUserDto.numero) dataToUpdate.numero = updateUserDto.numero;
    if (updateUserDto.fonction !== undefined) dataToUpdate.fonction = updateUserDto.fonction;
    if (updateUserDto.idService !== undefined) dataToUpdate.idService = updateUserDto.idService;
    if (updateUserDto.idRole !== undefined) dataToUpdate.idRole = updateUserDto.idRole;
    if (updateUserDto.idCorrespondant !== undefined) dataToUpdate.idCorrespondant = updateUserDto.idCorrespondant;
    if (updateUserDto.isActive !== undefined) dataToUpdate.isActive = updateUserDto.isActive;
    if (updateUserDto.isSignataire !== undefined) dataToUpdate.isSignataire = updateUserDto.isSignataire;

    // 8️⃣ Si le mot de passe est fourni, le hacher
    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 9️⃣ Mettre à jour l'utilisateur
    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: dataToUpdate,
    });

    // 🔟 Gérer les services additionnels si fournis (uniquement si présent dans le DTO)
    if (updateUserDto.servicesAdditionel !== undefined) {
      // Supprimer les anciennes relations
      await this.prismaService.userServiceAdditionnel.deleteMany({
        where: { userId: id },
      });

      // Créer les nouvelles relations si le tableau n'est pas vide
      if (updateUserDto.servicesAdditionel.length > 0) {
        // Vérifier que tous les services existent
        const serviceIds = updateUserDto.servicesAdditionel.map((s) => s.serviceId);
        const services = await this.prismaService.service.findMany({
          where: {
            id: { in: serviceIds },
            isDelete: false,
          },
        });

        if (services.length !== serviceIds.length) {
          throw new BadRequestException("Un ou plusieurs services additionnels n'existent pas.");
        }

        await this.prismaService.userServiceAdditionnel.createMany({
          data: updateUserDto.servicesAdditionel.map((s) => ({
            userId: id,
            serviceId: s.serviceId,
          })),
        });
      }
    }

    // 1️⃣1️⃣ Récupérer l'utilisateur complet avec toutes les relations
    const userWithRelations = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        numero: true,
        civilite: true,
        avatar: true,
        password: true,
        isSignataire: true,
        isActive: true,
        isDelete: true,
        langue: true,
        idCorrespondant: true,
        idService: true,
        idRole: true,
        createdAt: true,
        updatedAt: true,
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
          },
        },
        correspondant: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
          },
        },
        servicesAdditionnels: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
                sigle: true,
              },
            },
          },
        },
      },
    });
    // 1️⃣1️⃣ Vérifier que l'utilisateur existe
    if (!userWithRelations) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }
    // 1️⃣2️⃣ Retourner l'utilisateur mis à jour (sans le mot de passe)
    const { password: _, servicesAdditionnels, ...userWithoutPassword } = userWithRelations;

    return this.formatResponse(
      {
        ...userWithoutPassword,
        servicesAdditionel: servicesAdditionnels.map((sa) => ({
          serviceId: sa.service.id,
          serviceName: sa.service.nom,
          userId: userWithRelations.id,
          userName: userWithRelations.username,
        })),
      },
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
      idRole,
      idService,
      isSignataire,
      isActive,
    } = query;

    // 🔍 DEBUG: Log des paramètres reçus
    console.log('📥 Paramètres reçus dans getAllUsers:', {
      query: query,
      isActive: isActive,
      isActiveType: typeof isActive,
      isSignataire: isSignataire,
      isSignataireType: typeof isSignataire,
    });

    // Construction des filtres
    const where: any = {};

    if (nom) {
      where.OR = [
        { username: { contains: nom } },
        { firstName: { contains: nom } },
        { lastName: { contains: nom } },
      ];
    }

    if (email) {
      where.email = { contains: email };
    }

    if (numero) {
      where.numero = { contains: numero };
    }

    if (idRole !== undefined) {
      where.idRole = idRole;
    }

    if (idService !== undefined) {
      where.idService = idService;
    }

    if (isSignataire !== undefined) {
      console.log('✅ Filtre isSignataire appliqué:', isSignataire);
      where.isSignataire = isSignataire;
    }

    if (isActive !== undefined) {
      console.log('✅ Filtre isActive appliqué:', isActive);
      where.isActive = isActive;
    }

    // 🔍 DEBUG: Log du filtre WHERE final
    console.log('📋 Filtre WHERE envoyé à Prisma:', JSON.stringify(where, null, 2));

    // Compter le total
    const total = await this.prismaService.user.count({ where });

    // Si limit est 0, retourner tous les résultats
    if (limit === 0) {
      const users = await this.prismaService.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
            },
          },
          correspondant: {
            select: {
              id: true,
              nom: true,
              email: true,
              telephone: true,
            },
          },
          servicesAdditionnels: {
            include: {
              service: {
                select: {
                  id: true,
                  nom: true,
                  sigle: true,
                },
              },
            },
          },
        },
      });

      const usersWithoutPassword = users.map((user) => {
        const { password: _, servicesAdditionnels, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          servicesAdditionel: servicesAdditionnels.map((sa) => ({
            serviceId: sa.service.id,
            serviceName: sa.service.nom,
            userId: user.id,
            userName: user.username,
          })),
        };
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
          },
        },
        correspondant: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
          },
        },
        servicesAdditionnels: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
                sigle: true,
              },
            },
          },
        },
      },
    });

    const usersWithoutPassword = users.map((user) => {
      const { password: _, servicesAdditionnels, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        servicesAdditionel: servicesAdditionnels.map((sa) => ({
          serviceId: sa.service.id,
          serviceName: sa.service.nom,
          userId: user.id,
          userName: user.username,
        })),
      };
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
          },
        },
        correspondant: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
          },
        },
        servicesAdditionnels: {
          include: {
            service: {
              select: {
                id: true,
                nom: true,
                sigle: true,
              },
            },
          },
        },
      },
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
