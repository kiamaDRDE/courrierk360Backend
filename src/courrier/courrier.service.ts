// src/courrier/courrier.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourrierDto } from './dto/create-courrier.dto';
import { UpdateCourrierDto } from './dto/update-courrier.dto';
import { ListCourrierQueryDto } from './dto/list-courrier-query.dto';
import { CloseCourrierDto } from './dto/close-courrier.dto';
import { PaginationService } from '../common/pagination.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { MailerService } from '../mailer/mailer.service';
import { SmsService } from '../sms/sms.service';
import { TraitementService } from '../traitement/traitement.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CourrierService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly mailerService: MailerService,
    private readonly smsService: SmsService,
    private readonly traitementService: TraitementService,
    private readonly paginationService: PaginationService,
  ) {}

  // 🔓 Parcours public d'un courrier par référence
  async getPublicParcours(reference: string) {
    const ref = String(reference || '').trim();
    if (!ref) {
      throw new BadRequestException('La référence du courrier est obligatoire.');
    }

    const courrier = await this.prismaService.courrier.findFirst({
      where: {
        isDelete: false,
        OR: [{ reference: ref }, { numero: ref }],
      },
      select: {
        id: true,
        reference: true,
        numero: true,
      },
    });

    if (!courrier) {
      throw new NotFoundException(`Aucun courrier trouvé pour la référence ${ref}.`);
    }

    const transmissions = await this.prismaService.transmission.findMany({
      where: {
        idCourrier: courrier.id,
        isDelete: false,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        dateInstruction: true,
        dateReception: true,
        instruction: true,
        typeTransfert: true,
        statut: true,
        traitePar: true,
        service: {
          select: { id: true, nom: true },
        },
        emetteur: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            service: { select: { id: true, nom: true } },
          },
        },
      },
    });

    const formatFullName = (user?: { firstName?: string | null; lastName?: string | null; username?: string | null } | null) => {
      if (!user) return null;
      const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return full || user.username || null;
    };

    const extractResponsableDestination = (traitePar: any): string | null => {
      if (!traitePar) return null;
      const list = Array.isArray(traitePar) ? traitePar : [traitePar];
      const last = list[list.length - 1];
      if (!last || typeof last !== 'object') return null;

      const firstName = (last.firstName ?? last.prenom ?? last.first_name ?? last.firstname) as string | undefined;
      const lastName = (last.lastName ?? last.nom ?? last.last_name ?? last.lastname) as string | undefined;
      const username = (last.username ?? last.user ?? last.name) as string | undefined;

      const full = `${firstName || ''} ${lastName || ''}`.trim();
      return full || username || null;
    };

    const parcours = transmissions.map((t) => ({
      type: 'transmission',
      service_source: t.emetteur?.service?.nom || null,
      responsable_source: formatFullName(t.emetteur) || null,
      service_destination: t.service?.nom || null,
      responsable_destination: extractResponsableDestination(t.traitePar),
      date_envoi: t.dateInstruction || null,
      date_reception: t.dateReception || null,
      commentaire: t.instruction || null,
      but: t.typeTransfert || null,
      statut: t.statut || null,
    }));

    return this.responseFormatter.success(
      {
        reference: courrier.reference || courrier.numero,
        numero: courrier.numero,
        parcours,
      },
      'Parcours courrier public',
      'Parcours public récupéré avec succès.',
    );
  }

  // 🔓 Recherche publique exacte (sans sécurité)
  async searchPublicExact(term: string) {
    const value = String(term || '').trim();
    if (!value) {
      throw new BadRequestException('Le terme de recherche est obligatoire.');
    }

    const courriers = await this.prismaService.courrier.findMany({
      where: {
        isDelete: false,
        OR: [
          { numero: value },
          { reference: value },
          { objet: value },
          { nom: value },
          { matricule: value },
          { email: value },
          { telephone: value },
          {
            provenance: {
              is: {
                OR: [
                  { nom: value },
                  { matricule: value },
                  { email: value },
                  { telephone: value },
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        numero: true,
        reference: true,
        objet: true,
        commentaire: true,
        commentairePublic: true,
        dateArrivee: true,
        nom: true,
        matricule: true,
        email: true,
        telephone: true,
        provenance: {
          select: { id: true, nom: true, matricule: true, email: true, telephone: true },
        },
        transmissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            typeTransfert: true,
            statut: true,
            dateInstruction: true,
            dateReception: true,
            instruction: true,
            traitePar: true,
            service: { select: { id: true, nom: true } },
            emetteur: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                service: { select: { id: true, nom: true } },
              },
            },
          },
        },
      },
    });

    const results = await Promise.all(
      courriers.map(async (courrier) => {
        const lastTransmission = courrier.transmissions?.[0] || null;

        const lastDepart = await this.prismaService.courrierDepart.findFirst({
          where: { idCourrier: courrier.id, isDelete: false },
          orderBy: { dateSignature: 'desc' },
          select: {
            numeroActe: true,
            dateSignature: true,
            signataire: {
              select: { id: true, firstName: true, lastName: true, service: { select: { nom: true } } },
            },
          },
        });

        const lastReponse = await this.prismaService.courrierReponse.findFirst({
          where: { courrierId: courrier.id },
          orderBy: { reponse: { dateReponse: 'desc' } },
          select: {
            reponse: { select: { commentairePublic: true, commentaireInterne: true } },
          },
        });

        const signataireNom = lastDepart?.signataire
          ? `${lastDepart.signataire.firstName || ''} ${lastDepart.signataire.lastName || ''}`.trim()
          : null;

        return {
          registre: courrier.reference || courrier.numero,
          datearrivee: courrier.dateArrivee || null,
          date_signature: lastDepart?.dateSignature || null,
          emetteur_nom_prenom: courrier.provenance?.nom || courrier.nom || null,
          objetcourrier: courrier.objet || null,
          dernier_service_emetteur_libelle: lastTransmission?.emetteur?.service?.nom || null,
          dernier_service_recu_libelle: lastTransmission?.service?.nom || null,
          type_diffusion_libelle: lastTransmission?.typeTransfert || null,
          commentaire: courrier.commentairePublic || courrier.commentaire || null,
          commentaire_reponse:
            lastReponse?.reponse?.commentairePublic || lastReponse?.reponse?.commentaireInterne || null,
          numeroActe: lastDepart?.numeroActe || null,
          dateSignature: lastDepart?.dateSignature || null,
          signataire: lastDepart?.signataire
            ? {
                id: lastDepart.signataire.id,
                nom: signataireNom || null,
                service: lastDepart.signataire.service?.nom || null,
              }
            : null,
        };
      }),
    );

    return this.responseFormatter.success(
      results,
      'Recherche publique courriers',
      'Résultats récupérés avec succès.',
    );
  }

  // 🔢 Générer automatiquement le numéro de référence au format AAAA-MM-XXX
  private async genererNumeroReference(baseDate?: Date): Promise<string> {
    const now = baseDate ?? new Date();
    const annee = now.getFullYear().toString();
    const mois = (now.getMonth() + 1).toString().padStart(2, '0');

    // Compter le nombre de courriers créés ce mois
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Boucle pour gérer les collisions de numéro (race condition)
    let numeroReference = '';
    let tentatives = 0;
    const maxTentatives = 10;

    while (tentatives < maxTentatives) {
      const count = await this.prismaService.courrier.count({
        where: {
          createdAt: {
            gte: debutMois,
            lte: finMois,
          },
        },
      });

      const sequence = count + 1 + tentatives;
      const numeroFormate = sequence.toString().padStart(3, '0');
      numeroReference = `${annee}-${mois}-${numeroFormate}`;

      // Vérifier si le numéro existe déjà
      const existe = await this.prismaService.courrier.findUnique({
        where: { numero: numeroReference },
        select: { id: true },
      });

      if (!existe) {
        // Numéro disponible
        return numeroReference;
      }

      // Numéro existe déjà, réessayer avec le suivant
      tentatives++;
    }

    // Si on arrive ici, ajouter un timestamp pour garantir l'unicité
    return `${annee}-${mois}-${Date.now().toString().slice(-6)}`;
  }

  // 📝 Créer un courrier
  async create(
    userId: number,
    createCourrierDto: CreateCourrierDto,
    document?: Express.Multer.File,
    piecesJointes?: Express.Multer.File[],
  ) {
    const {
      reference,
      objet,
      priorite,
      dateArrivee,
      categorie,
      civilite,
      telephone,
      email,
      adresse,
      idProvenance,
      classeCourrier,
      idTypeCourrier,
      commentaire,
      idService,
      typeTransfert,
      isConfidentiel = false,
      nombrePieceJointe = 1,
      piecesJointesData,
      sendNotification = false,
    } = createCourrierDto;

    // Les conversions boolean sont déjà gérées par les @Transform dans le DTO
    // Pas besoin de les reconvertir ici
    
    console.log('📧 Paramètres reçus après transformation DTO:', {
      sendNotification: {
        value: sendNotification,
        type: typeof sendNotification,
      },
      isConfidentiel: {
        value: isConfidentiel,
        type: typeof isConfidentiel,
      },
    });

    // Vérifier que le service existe si renseigné
    if (idService) {
      const service = await this.prismaService.service.findUnique({
        where: { id: idService },
      });

      if (!service) {
        throw new NotFoundException(`Le service avec l'ID ${idService} n'existe pas.`);
      }

      // Vérifier que l'utilisateur connecté ne crée pas un courrier pour son propre service
      const currentUser = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { idService: true },
      });

      if (currentUser && currentUser.idService === idService) {
        throw new BadRequestException('Vous ne pouvez pas créer un courrier destiné à votre propre service.');
      }
    }

    // Vérifier que la provenance existe si renseignée
    if (idProvenance) {
      const provenance = await this.prismaService.correspondant.findUnique({
        where: { id: idProvenance },
      });

      if (!provenance) {
        throw new NotFoundException(`La provenance avec l'ID ${idProvenance} n'existe pas.`);
      }
    }

    // Vérifier que le type de courrier existe si renseigné
    if (idTypeCourrier) {
      const typeCourrier = await this.prismaService.typeCourrier.findUnique({
        where: { id: idTypeCourrier },
      });

      if (!typeCourrier) {
        throw new NotFoundException(`Le type de courrier avec l'ID ${idTypeCourrier} n'existe pas.`);
      }
    }

    // Générer le numéro de référence si non renseigné
    const numeroReference = reference || await this.genererNumeroReference();

    // Créer le dossier de stockage s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'courrier');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sauvegarder le document principal si fourni
    let documentPath: string | null = null;
    if (document) {
      const timestamp = Date.now();
      const documentFileName = `${timestamp}-${document.originalname}`;
      const documentFullPath = path.join(uploadDir, documentFileName);
      fs.writeFileSync(documentFullPath, document.buffer);
      documentPath = `courrier/${documentFileName}`;
    }

    // Parser les données des pièces jointes
    let piecesJointesInfo: Array<{ intitule: string }> = [];
    if (piecesJointesData) {
      try {
        piecesJointesInfo = JSON.parse(piecesJointesData);
      } catch (error) {
        throw new BadRequestException('Le format des données des pièces jointes est invalide.');
      }
    }

    // Créer le courrier et les pièces jointes en transaction
    const result = await this.prismaService.$transaction(async (prisma) => {
      // Créer le courrier
      const courrier = await prisma.courrier.create({
        data: {
          numero: numeroReference,
          reference: numeroReference,
          objet: objet || null,
          priorite,
          dateArrivee: new Date(dateArrivee),
          categorie,
          civilite: civilite || null, // ✅ CORRECTION: normaliser en null si vide
          telephone: telephone || null, // ✅ CORRECTION: normaliser en null si vide
          email: email || null, // ✅ CORRECTION: normaliser en null si vide
          adresse: adresse || null,
          idProvenance: idProvenance || null,
          classeCourrier: classeCourrier || null,
          idTypeCourrier: idTypeCourrier || null,
          commentaire: commentaire || null,
          idService: idService || null,
          idUser: userId,
          typeTransfert: typeTransfert || null,
          isConfidentiel: isConfidentiel ?? false,
          document: documentPath,
          nombrePieceJointe,
          statut: 'Transmis',
        },
      });

      // Sauvegarder et créer les pièces jointes
      const piecesJointesCreees: any[] = [];
      if (piecesJointes && piecesJointes.length > 0) {
        for (let i = 0; i < piecesJointes.length; i++) {
          const file = piecesJointes[i];
          const intituleData = piecesJointesInfo[i];

          if (!intituleData || !intituleData.intitule) {
            continue; // Ignorer si pas d'intitulé
          }

          // Sauvegarder le fichier
          const timestamp = Date.now();
          const fileName = `${timestamp}-${i}-${file.originalname}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, file.buffer);

          // Créer l'enregistrement dans la table PieceJointe
          const pieceJointe = await prisma.pieceJointe.create({
            data: {
              nom: file.originalname,
              intitule: intituleData.intitule,
              chemin: `courrier/${fileName}`,
              type: file.mimetype,
              idCourrier: courrier.id,
              idParent: courrier.id,
              typeParent: 'courrier',
            },
          });

          piecesJointesCreees.push(pieceJointe);
        }
      }

      // 🆕 Créer automatiquement une transmission initiale si un service est spécifié
      let transmissionCreee: any = null;
      if (idService) {
        transmissionCreee = await prisma.transmission.create({
          data: {
            idCourrier: courrier.id,
            idService: idService,
            idEmetteur: userId,
            dateInstruction: new Date(dateArrivee), // Utiliser la date d'arrivée comme date d'instruction
            typeTransfert: typeTransfert || 'Pour traitement',
            instruction: commentaire || 'Transmission initiale du courrier',
            statut: 'Transmis',
          },
        });
      }

      return { courrier, piecesJointes: piecesJointesCreees, transmission: transmissionCreee };
    });

    // Envoyer l'email d'accusé de réception au correspondant si email fourni ET sendNotification = true
    // Envoi asynchrone (non-bloquant) pour ne pas ralentir la création du courrier
    if (sendNotification && email) {
      this.prismaService.service.findUnique({ 
        where: { id: idService }, 
        select: { nom: true } 
      })
      .then((serviceInfo) => {
        return this.mailerService.sendCourrierAccuseReception(
          email,
          civilite || '',
          result.courrier.nom || 'Monsieur/Madame',
          result.courrier.numero,
          result.courrier.reference || '',
          objet || 'N/A',
          new Date(result.courrier.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          serviceInfo?.nom || 'Service compétent',
        );
      })
      .then(() => {
        console.log(`✅ Email accusé de réception envoyé avec succès à ${email} pour le courrier ${result.courrier.numero}`);
      })
      .catch((error) => {
        console.error('\n❌ ============================================');
        console.error('❌ ERREUR ENVOI EMAIL ACCUSÉ DE RÉCEPTION');
        console.error('❌ ============================================');
        console.error(`📧 Destinataire : ${email}`);
        console.error(`📝 Courrier : ${result.courrier.numero}`);
        console.error(`⚠️  Type d'erreur : ${error.name || 'Erreur inconnue'}`);
        console.error(`💥 Message : ${error.message}`);
        
        // Détecter les erreurs spécifiques
        if (error.message?.includes('rate limit') || error.message?.includes('Too many')) {
          console.error('🚫 Cause probable : LIMITE D\'ENVOI ATTEINTE');
          console.error('💡 Solution : Attendez quelques minutes avant de réessayer');
        } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
          console.error('🚫 Cause probable : SERVEUR SMTP INACCESSIBLE');
          console.error('💡 Solution : Vérifiez la configuration SMTP dans .env');
        } else if (error.message?.includes('Invalid login') || error.message?.includes('authentication')) {
          console.error('🚫 Cause probable : AUTHENTIFICATION SMTP ÉCHOUÉE');
          console.error('💡 Solution : Vérifiez SMTP_USER et SMTP_PASS dans .env');
        } else if (error.message?.includes('Invalid recipients')) {
          console.error(`🚫 Cause probable : ADRESSE EMAIL INVALIDE (${email})`);
          console.error('💡 Solution : Vérifiez l\'adresse email du correspondant');
        }
        
        if (error.stack) {
          console.error(`🔍 Stack trace :\n${error.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        console.error('❌ ============================================\n');
      });
    }

    // Envoyer les notifications aux utilisateurs du service destinataire si sendNotification = true
    // Envoi asynchrone (non-bloquant) pour ne pas ralentir la création du courrier
    if (sendNotification && idService) {
      console.log(`🔔 Notification activée pour le service ID: ${idService}, sendNotification: ${sendNotification}`);
      
      Promise.all([
        this.prismaService.user.findMany({
          where: {
            idService: idService,
            isActive: true,
            isDelete: false,
          },
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        }),
        this.prismaService.service.findUnique({
          where: { id: idService },
          select: { nom: true },
        }),
      ])
      .then(([serviceUsers, serviceInfo]) => {
        console.log(`🔍 Debug notification service:`);
        console.log(`   - Service ID: ${idService}`);
        console.log(`   - Service nom: ${serviceInfo?.nom}`);
        console.log(`   - Utilisateurs trouvés: ${serviceUsers.length}`);
        console.log(`   - Utilisateurs avec email:`, serviceUsers.map(u => ({ email: u.email, nom: `${u.firstName} ${u.lastName}` })));
        
        if (serviceUsers.length === 0) {
          console.warn(`⚠️  Aucun utilisateur actif trouvé pour le service ID ${idService}`);
          return { emailResults: [], totalCount: 0 };
        }
        
        // Envoyer les emails avec délai pour éviter le rate limiting
        console.log(`📧 Préparation envoi notifications à ${serviceUsers.length} utilisateur(s) du service "${serviceInfo?.nom}"`);
        
        const emailPromises = serviceUsers
          .filter(user => user.email)
          .map((user, index) => 
            new Promise(resolve => setTimeout(() => {
              console.log(`📧 Envoi ${index + 1}/${serviceUsers.length} : ${user.email}`);
              
              // Construire les données du courrier pour la notification
              const courrierData = {
                numero: result.courrier.numero,
                reference: result.courrier.reference || result.courrier.numero,
                objet: createCourrierDto.objet || 'N/A',
                civilite: createCourrierDto.civilite || '',
                nom: result.courrier.nom || 'Expéditeur inconnu',
                priorite: createCourrierDto.priorite,
                categorie: createCourrierDto.categorie || 'Non classé',
                dateArrivee: new Intl.DateTimeFormat('fr-FR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(createCourrierDto.dateArrivee)),
                commentaire: createCourrierDto.commentaire || '',
              };
              
              console.log(`📋 Données courrier pour notification:`, JSON.stringify(courrierData, null, 2));
              
              resolve(
                this.mailerService.sendCourrierNotificationService(
                  user.email,
                  user.firstName || '',
                  user.lastName || '',
                  serviceInfo?.nom || 'Service non identifié',
                  courrierData,
                ).catch(error => {
                  console.error('\n❌ ============================================');
                  console.error('❌ ERREUR ENVOI EMAIL NOTIFICATION SERVICE');
                  console.error('❌ ============================================');
                  console.error(`📧 Destinataire : ${user.email}`);
                  console.error(`👤 Utilisateur : ${user.firstName} ${user.lastName}`);
                  console.error(`📝 Courrier : ${result.courrier.numero}`);
                  console.error(`🏢 Service : ${serviceInfo?.nom || 'N/A'}`);
                  console.error(`⚠️  Type d'erreur : ${error.name || 'Erreur inconnue'}`);
                  console.error(`💥 Message : ${error.message}`);
                  
                  // Détecter les erreurs spécifiques
                  if (error.message?.includes('rate limit') || error.message?.includes('Too many')) {
                    console.error('🚫 Cause probable : LIMITE D\'ENVOI ATTEINTE');
                    console.error('💡 Solution : Le service SMTP limite le nombre d\'emails/heure');
                  } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
                    console.error('🚫 Cause probable : SERVEUR SMTP INACCESSIBLE');
                  } else if (error.message?.includes('Invalid recipients')) {
                    console.error(`🚫 Cause probable : EMAIL INVALIDE (${user.email})`);
                  }
                  
                  console.error('❌ ============================================\n');
                  return null; // Continuer avec les autres emails
                })
              );
            }, index * 10000)) // Délai de 10 secondes entre chaque email
          );
        return Promise.all(emailPromises).then(emailResults => ({ 
          emailResults, 
          totalCount: serviceUsers.length 
        }));
      })
      .then(({ emailResults, totalCount }) => {
        const successCount = emailResults?.filter(r => r !== null).length || 0;
        if (successCount > 0) {
          console.log(`✅ Emails envoyés avec succès : ${successCount}/${totalCount} utilisateurs du service`);
        }
        if (successCount < totalCount) {
          console.warn(`⚠️  ${totalCount - successCount} email(s) n'ont pas pu être envoyé(s)`);
        }
      })
      .catch((error) => {
        console.error('\n❌ ============================================');
        console.error('❌ ERREUR GLOBALE ENVOI EMAILS SERVICE');
        console.error('❌ ============================================');
        console.error(`📝 Courrier : ${result.courrier.numero}`);
        console.error(`🏢 Service ID : ${idService}`);
        console.error(`⚠️  Type d'erreur : ${error.name || 'Erreur inconnue'}`);
        console.error(`💥 Message : ${error.message}`);
        console.error('❌ ============================================\n');
      });
    }

    // 📱 SMS: Ne pas envoyer de SMS lors de la création d'un courrier d'arrivée.
    // Quand `sendNotification=true` ici (création courrier arrivé), on envoie uniquement l'email.
    if (sendNotification) {
      console.log(`📵 SMS volontairement ignorés pour courrier d'arrivée (sendNotification: ${sendNotification}) - seuls les emails sont envoyés.`);
    } else {
      console.log(`📵 SMS désactivés ou aucun téléphone - sendNotification: ${sendNotification}, telephone: ${telephone || 'N/A'}, idService: ${idService || 'N/A'}`);
    }

    // ✅ La transmission initiale est déjà créée dans la transaction ci-dessus (ligne 494-502)
    // Pas besoin de la créer une deuxième fois !

    return this.responseFormatter.success(
      {
        ...result.courrier,
        piecesJointes: result.piecesJointes,
      },
      'Création courrier',
      `Courrier créé avec succès. Référence: ${numeroReference}. ${result.piecesJointes.length} pièce(s) jointe(s) ajoutée(s).`,
    );
  }

  // 📁 Classer un courrier
  async classerCourrier(id: number, classerCourrierDto?: any) {
    // Vérifier que le courrier existe
    const courrier = await this.prismaService.courrier.findUnique({
      where: { id },
    });

    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    // Vérifier que le courrier n'est pas déjà classé
    if (courrier.isGeled) {
      throw new BadRequestException('Ce courrier est déjà classé (gelé).');
    }

    // Effectuer les mises à jour en transaction
    const result = await this.prismaService.$transaction(async (prisma) => {
      // Préparer les données de mise à jour
      const updateData: any = {
        statut: 'Classé',
        isGeled: true,
      };

      // Ajouter les commentaires s'ils sont fournis
      if (classerCourrierDto?.commentairePublic !== undefined) {
        updateData.commentairePublic = classerCourrierDto.commentairePublic;
      }
      if (classerCourrierDto?.commentaireInterne !== undefined) {
        updateData.commentaireInterne = classerCourrierDto.commentaireInterne;
      }

      // Mettre à jour le courrier
      const courrierClasse = await prisma.courrier.update({
        where: { id },
        data: updateData,
      });

      // Classer toutes les transmissions liées
      await prisma.transmission.updateMany({
        where: { 
          idCourrier: id,
          isGeled: false // Seulement les transmissions non déjà gelées
        },
        data: {
          statut: 'Classé',
          isGeled: true,
        },
      });

      return courrierClasse;
    });

    return this.responseFormatter.success(
      result,
      'Classement courrier',
      `Courrier ${result.numero} et toutes ses transmissions classés avec succès.`,
    );
  }

  // 📂 Déclasser un courrier
  async declasserCourrier(id: number, declasserCourrierDto?: any) {
    // Vérifier que le courrier existe
    const courrier = await this.prismaService.courrier.findUnique({
      where: { id },
    });

    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    // Vérifier que le courrier est bien classé (gelé)
    if (!courrier.isGeled) {
      throw new BadRequestException('Ce courrier n\'est pas classé (gelé). Impossible de le déclasser.');
    }

    // Effectuer les mises à jour en transaction
    const result = await this.prismaService.$transaction(async (prisma) => {
      // Récupérer toutes les transmissions du courrier pour appliquer les règles de statut
      const transmissions = await prisma.transmission.findMany({
        where: { idCourrier: id },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`📋 Déclassement courrier ${id} - ${transmissions.length} transmission(s) trouvée(s)`);

      // Déclasser toutes les transmissions et appliquer les règles de statut
      for (const transmission of transmissions) {
        // **Règles de détermination du statut** selon la priorité :
        let nouveauStatutTransmission = 'Transmis'; // Par défaut
        
        if (transmission.isArchive) {
          nouveauStatutTransmission = 'Archivé';
        } else if (transmission.isinstance) {
          nouveauStatutTransmission = 'Instancié';
        } else if (transmission.accuseReception) {
          nouveauStatutTransmission = 'Reçu';
        }

        await prisma.transmission.update({
          where: { id: transmission.id },
          data: {
            statut: nouveauStatutTransmission,
            isGeled: false, // Déclasser = dégeléer
          },
        });

        console.log(`📤 Transmission ${transmission.id} déclassée: ${transmission.statut} → ${nouveauStatutTransmission}`);
      }

      // Déterminer le statut du courrier basé sur la dernière transmission
      let nouveauStatutCourrier = 'Transmis'; // Statut par défaut
      
      if (transmissions.length > 0) {
        const derniereTransmission = transmissions[0]; // Déjà triée par createdAt desc
        
        // Appliquer les mêmes règles que pour les transmissions
        if (derniereTransmission.isArchive) {
          nouveauStatutCourrier = 'Archivé';
        } else if (derniereTransmission.isinstance) {
          nouveauStatutCourrier = 'Instancié';
        } else if (derniereTransmission.accuseReception) {
          nouveauStatutCourrier = 'Reçu';
        }
      }

      // Préparer les données de mise à jour du courrier
      const updateData: any = {
        statut: nouveauStatutCourrier,
        isGeled: false,
      };

      // Ajouter les commentaires s'ils sont fournis
      if (declasserCourrierDto?.commentairePublic !== undefined) {
        updateData.commentairePublic = declasserCourrierDto.commentairePublic;
      }
      if (declasserCourrierDto?.commentaireInterne !== undefined) {
        updateData.commentaireInterne = declasserCourrierDto.commentaireInterne;
      }

      // Mettre à jour le courrier
      const courrierDeclasse = await prisma.courrier.update({
        where: { id },
        data: updateData,
      });

      console.log(`📄 Courrier ${id} déclassé: statut → ${nouveauStatutCourrier}`);
      
      return courrierDeclasse;
    });

    return this.responseFormatter.success(
      result,
      'Déclassement courrier',
      `Courrier ${result.numero} et toutes ses transmissions déclassés avec succès. Nouveau statut : ${result.statut}.`,
    );
  }

  // � Liste des courriers
  async list(query?: ListCourrierQueryDto) {
    const filters = query || {};
    const { page, limit } = this.paginationService.validatePaginationParams(
      filters.page,
      filters.limit,
    );
    const skip = this.paginationService.getSkip(page, limit);

    const where: any = { isDelete: false };

    const dateArriveeRange = this.parseDateRange(
      filters.dateArriveeDebut,
      filters.dateArriveeFin,
      'dateArrivee',
    );
    if (dateArriveeRange) {
      where.dateArrivee = dateArriveeRange;
    }

    if (filters.dateEnregistrement) {
      const dateRange = this.parseSingleDate(filters.dateEnregistrement, 'dateEnregistrement');
      where.dateEnregistrement = dateRange;
    }

    if (filters.priorite) {
      where.priorite = filters.priorite;
    }

    if (filters.categorie) {
      where.categorie = filters.categorie;
    } else if (filters.categorieId) {
      const categorie = await this.prismaService.categories.findUnique({
        where: { id: filters.categorieId },
        select: { nom: true },
      });

      if (!categorie) {
        throw new NotFoundException(`La catégorie avec l'ID ${filters.categorieId} n'existe pas.`);
      }

      where.categorie = categorie.nom;
    }

    if (filters.typeCourrierId) {
      where.idTypeCourrier = filters.typeCourrierId;
    }

    if (filters.statut) {
      where.statut = filters.statut;
    }

    if (filters.serviceId) {
      where.idService = filters.serviceId;
    }

    const search = filters.search?.trim();
    if (search) {
      const normalizedSearch = search.replace(/\s+/g, ' ').trim();
      const numericSearch = Number(normalizedSearch);
      const tokenTerms = normalizedSearch.split(' ').filter(Boolean);
      const phraseTerms = Array.from(
        new Set([
          normalizedSearch,
          normalizedSearch.replace(/\s+/g, '_'),
          normalizedSearch.replace(/\s+/g, '-'),
        ]),
      );

      const buildTermFilters = (term: string): any[] => [
        { numero: { contains: term } },
        { reference: { contains: term } },
        { objet: { contains: term } },
        { nom: { contains: term } },
        { email: { contains: term } },
        { telephone: { contains: term } },
        { adresse: { contains: term } },
        { commentaire: { contains: term } },
        { commentairePublic: { contains: term } },
        { commentaireInterne: { contains: term } },
        { priorite: { contains: term } },
        { statut: { contains: term } },
        { categorie: { contains: term } },
        { typeTransfert: { contains: term } },
        { classeCourrier: { contains: term } },
        { matricule: { contains: term } },
        { service: { is: { nom: { contains: term } } } },
        { service: { is: { sigle: { contains: term } } } },
        { provenance: { is: { nom: { contains: term } } } },
        { provenance: { is: { type: { contains: term } } } },
        { typeCourrier: { is: { nom: { contains: term } } } },
        { typeCourrier: { is: { type: { contains: term } } } },
        { typeCourrier: { is: { classeCourrier: { contains: term } } } },
        { user: { is: { username: { contains: term } } } },
        { user: { is: { firstName: { contains: term } } } },
        { user: { is: { lastName: { contains: term } } } },
      ];

      const orFilters: any[] = phraseTerms.flatMap((term) => buildTermFilters(term));

      const searchDateRange = this.parseSearchDate(normalizedSearch);
      if (searchDateRange) {
        orFilters.push(
          { dateArrivee: searchDateRange },
          { dateEnregistrement: searchDateRange },
        );
      }

      if (!Number.isNaN(numericSearch)) {
        orFilters.push(
          { id: numericSearch },
          { idService: numericSearch },
          { idProvenance: numericSearch },
          { idTypeCourrier: numericSearch },
          { idUser: numericSearch },
        );
      }

      if (tokenTerms.length > 1) {
        const tokenAndFilters = tokenTerms.map((term) => ({
          OR: buildTermFilters(term),
        }));

        where.AND = [
          { OR: orFilters },
          ...tokenAndFilters,
        ];
      } else {
        where.OR = orFilters;
      }
    }

    const includePayload = {
      // 📋 RELATIONS COMPLÈTES AJOUTÉES
      service: { 
        select: { 
          id: true, 
          nom: true, 
          sigle: true, 
          type: true, 
          isActive: true,
          parent: { select: { id: true, nom: true, sigle: true } }
        } 
      },
      user: { 
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          username: true, 
          email: true,
          phone: true,
          numero: true,
          civilite: true,
          service: { select: { id: true, nom: true, sigle: true } }
        } 
      },
      provenance: {
        select: {
          id: true,
          nom: true,
          adresse: true,
          telephone: true,
          email: true,
          type: true,
          civilite: true,
          matricule: true,
          categories: {
            select: {
              categorie: { select: { id: true, nom: true } }
            }
          }
        }
      },
      typeCourrier: {
        select: {
          id: true,
          nom: true,
          type: true,
          classeCourrier: true
        }
      },
      transmissions: {
        select: {
          id: true,
          dateInstruction: true,
          dateReception: true,
          instruction: true,
          delaiTraitement: true,
          typeTransfert: true,
          accuseReception: true,
          statut: true,
          traitePar: true,
          isGeled: true,
          isArchive: true,
          isDelete: true,
          service: { select: { id: true, nom: true, sigle: true } },
          emetteur: { select: { id: true, firstName: true, lastName: true, username: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      courrierDeparts: {
        select: {
          id: true,
          dateSignature: true,
          typeCourrier: true,
          numeroReference: true,
          classeCourrier: true,
          categorie: true,
          email: true,
          numeroTelephone: true,
          numeroActe: true,
          destinataire: { select: { id: true, nom: true, email: true, telephone: true } },
          signataire: { select: { id: true, firstName: true, lastName: true, username: true } }
        }
      },
      piecesJointes: {
        select: {
          id: true,
          nom: true,
          intitule: true,
          chemin: true,
          type: true,
          createdAt: true
        },
        where: { isDelete: false }
      },
      reponses: {
        select: {
          id: true,
          reponse: {
            select: {
              id: true,
              objet: true,
              dateReponse: true,
              classeCourrier: true,
              typeTransmission: true,
              service: { select: { id: true, nom: true } },
              serviceDestinataire: { select: { id: true, nom: true } },
              redacteur: { select: { id: true, firstName: true, lastName: true, username: true } }
            }
          }
        }
      },
      _count: { 
        select: { 
          courrierDeparts: true,
          transmissions: true,
          piecesJointes: { where: { isDelete: false } },
          reponses: true
        } 
      }
    } as const;

    const requiresLastFilters = Boolean(filters.dernierStatut || filters.dernierServiceId);

    // Charger toutes les catégories pour le mapping
    const categories = await this.prismaService.categories.findMany({
      where: { isDelete: false },
      select: { id: true, nom: true }
    });
    const categoriesMap = new Map(categories.map(cat => [cat.nom.toLowerCase().trim(), cat]));

    const [courriers, totalBeforeLastFilters] = await Promise.all([
      this.prismaService.courrier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: includePayload,
        ...(requiresLastFilters ? {} : { skip, take: limit }),
      }),
      requiresLastFilters
        ? Promise.resolve(0)
        : this.prismaService.courrier.count({ where }),
    ]);

    const courrierIds = courriers.map((c) => c.id);

    const latestByCourrier = new Map<number, { statut: string | null; service: { id: number; nom: string; sigle: string | null } | null }>();
    if (courrierIds.length > 0) {
      const latestAll = await this.prismaService.transmission.findMany({
        where: { idCourrier: { in: courrierIds } },
        orderBy: { createdAt: 'desc' },
        select: {
          idCourrier: true,
          idService: true,
          statut: true,
          service: { select: { nom: true, sigle: true } },
        },
      });

      for (const t of latestAll) {
        if (typeof t.idCourrier === 'number' && !latestByCourrier.has(t.idCourrier)) {
          latestByCourrier.set(t.idCourrier, {
            statut: t.statut || null,
            service: t.service && t.idService
              ? { id: t.idService, nom: t.service.nom, sigle: t.service.sigle }
              : null,
          });
        }
      }
    }

    let data = courriers.map((courrier) => {
      const formatDateOnly = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null);
      const createurFullName = courrier.user
        ? `${courrier.user.firstName || ''} ${courrier.user.lastName || ''}`.trim() || courrier.user.username
        : null;

      const lastStatus = latestByCourrier.get(courrier.id);

      // Mapper la catégorie texte vers un objet {id, nom}
      const categorieObj = courrier.categorie 
        ? categoriesMap.get(courrier.categorie.toLowerCase().trim()) || { id: null, nom: courrier.categorie }
        : null;

      return {
        // ===== CHAMPS DE BASE COMPLETS =====
        id: courrier.id,
        numero: courrier.numero,
        reference: courrier.reference,
        objet: courrier.objet,
        priorite: courrier.priorite,
        statut: courrier.statut,
        
        // 🆕 CHAMPS SPÉCIFIQUEMENT DEMANDÉS - MISE EN ÉVIDENCE
        categorie: categorieObj,
        classeCourrier: courrier.classeCourrier,
        dateArrivee: formatDateOnly(courrier.dateArrivee),
        dateEnregistrement: formatDateOnly(courrier.dateEnregistrement),
        
        // 🆕 AUTRES CHAMPS DATES SUPPLÉMENTAIRES
        dateRemiseEffective: courrier.dateRemiseEffective,
        dateCloture: courrier.dateCloture,
        typeTransfert: courrier.typeTransfert,
        document: courrier.document,
        bordereauRemise: courrier.bordereauRemise,
        statutArchive: courrier.statutArchive,
        viderPar: courrier.viderPar,
        
        // ===== INFORMATIONS CONTACT =====
        nom: courrier.nom,
        civilite: courrier.civilite,
        matricule: courrier.matricule,
        telephone: courrier.telephone,
        email: courrier.email,
        adresse: courrier.adresse,
        
        // ===== COMMENTAIRES =====
        commentaire: courrier.commentaire,
        commentairePublic: courrier.commentairePublic,
        commentaireInterne: courrier.commentaireInterne,
        
        // ===== STATUTS ET FLAGS =====
        isConfidentiel: courrier.isConfidentiel,
        isGeled: courrier.isGeled,
        isArchive: courrier.isArchive,
        isDelete: courrier.isDelete,
        nombrePieceJointe: courrier.nombrePieceJointe,
        
        // ===== IDs DE RÉFÉRENCE =====
        idProvenance: courrier.idProvenance,
        idTypeCourrier: courrier.idTypeCourrier,
        idService: courrier.idService,
        idUser: courrier.idUser,
        
        // ===== DATES DE CRÉATION/MAJ =====
        createdAt: courrier.createdAt,
        updatedAt: courrier.updatedAt,

        // ===== RELATIONS COMPLÈTES =====
        dernierStatutService: lastStatus
          ? {
              statut: lastStatus.statut,
              service: lastStatus.service,
            }
          : null,
          
        service_traitement: courrier.service
          ? { 
              id: courrier.service.id, 
              nom: courrier.service.nom,
              sigle: courrier.service.sigle,
              type: courrier.service.type,
              isActive: courrier.service.isActive,
              parent: courrier.service.parent
            }
          : null,
          
        provenance: courrier.provenance ? {
          id: courrier.provenance.id,
          nom: courrier.provenance.nom,
          adresse: courrier.provenance.adresse,
          telephone: courrier.provenance.telephone,
          email: courrier.provenance.email,
          type: courrier.provenance.type,
          civilite: courrier.provenance.civilite,
          matricule: courrier.provenance.matricule,
          categories: courrier.provenance.categories.map(cat => cat.categorie)
        } : null,
        
        // 🆕 TYPE COURRIER - RELATION COMPLÈTE MISE EN ÉVIDENCE  
        typeCourrier: courrier.typeCourrier ? {
          id: courrier.typeCourrier.id,
          nom: courrier.typeCourrier.nom,
          type: courrier.typeCourrier.type,
          classeCourrier: courrier.typeCourrier.classeCourrier
        } : null,
        
        createur: courrier.user
          ? { 
              id: courrier.user.id, 
              nom: createurFullName,
              username: courrier.user.username,
              email: courrier.user.email,
              phone: courrier.user.phone,
              numero: courrier.user.numero,
              civilite: courrier.user.civilite,
              service: courrier.user.service
            }
          : null,
          
        // ===== TRANSMISSIONS =====
        transmissions: courrier.transmissions.map(t => ({
          id: t.id,
          dateInstruction: t.dateInstruction,
          dateReception: t.dateReception,
          instruction: t.instruction,
          delaiTraitement: t.delaiTraitement,
          typeTransfert: t.typeTransfert,
          accuseReception: t.accuseReception,
          statut: t.statut,
          traitePar: t.traitePar,
          isGeled: t.isGeled,
          isArchive: t.isArchive,
          isDelete: t.isDelete,
          service: t.service,
          emetteur: t.emetteur ? {
            id: t.emetteur.id,
            nom: `${t.emetteur.firstName || ''} ${t.emetteur.lastName || ''}`.trim() || t.emetteur.username
          } : null
        })),
        
        // ===== COURRIERS DE DÉPART =====
        courrierDeparts: courrier.courrierDeparts.map(cd => ({
          id: cd.id,
          dateSignature: cd.dateSignature,
          typeCourrier: cd.typeCourrier,
          numeroReference: cd.numeroReference,
          classeCourrier: cd.classeCourrier,
          categorie: cd.categorie,
          email: cd.email,
          numeroTelephone: cd.numeroTelephone,
          numeroActe: cd.numeroActe,
          destinataire: cd.destinataire,
          signataire: cd.signataire ? {
            id: cd.signataire.id,
            nom: `${cd.signataire.firstName || ''} ${cd.signataire.lastName || ''}`.trim() || cd.signataire.username
          } : null
        })),
        
        // ===== PIÈCES JOINTES =====
        piecesJointes: courrier.piecesJointes.map(pj => ({
          id: pj.id,
          nom: pj.nom,
          intitule: pj.intitule,
          chemin: pj.chemin,
          type: pj.type,
          createdAt: pj.createdAt
        })),
        
        // ===== RÉPONSES =====
        reponses: courrier.reponses.map(repJoin => {
          const rep = repJoin.reponse;
          const redacteurNom = rep.redacteur 
            ? `${rep.redacteur.firstName || ''} ${rep.redacteur.lastName || ''}`.trim() || rep.redacteur.username
            : null;
          
          return {
            id: rep.id,
            objet: rep.objet,
            dateReponse: rep.dateReponse,
            classeCourrier: rep.classeCourrier,
            typeTransmission: rep.typeTransmission,
            service: rep.service,
            serviceDestinataire: rep.serviceDestinataire,
            redacteur: rep.redacteur ? {
              id: rep.redacteur.id,
              nom: redacteurNom
            } : null
          };
        }),
        
        // ===== COMPTEURS =====
        compteurs: {
          transmissions: (courrier as any)._count?.transmissions || 0,
          courrierDeparts: (courrier as any)._count?.courrierDeparts || 0,
          piecesJointes: (courrier as any)._count?.piecesJointes || 0,
          reponses: (courrier as any)._count?.reponses || 0
        },
        
        // 🆕 CHAMPS DE COMPATIBILITÉ (anciens noms)
        hasCourrierDepart: (courrier as any)._count?.courrierDeparts > 0,
      };
    });

    if (filters.dernierStatut || filters.dernierServiceId) {
      console.log('🔍 Filtrage par dernierStatut/dernierServiceId:', {
        dernierStatut: filters.dernierStatut,
        dernierServiceId: filters.dernierServiceId,
        nombreCourriersAvantFiltre: data.length
      });

      data = data.filter((item) => {
        const last = item.dernierStatutService;
        if (!last) {
          console.log('⚠️ Courrier sans dernierStatutService:', { id: item.id });
          return false;
        }

        if (filters.dernierStatut) {
          console.log('🔄 Vérification dernierStatut:', {
            courrierId: item.id,
            statutReçu: filters.dernierStatut,
            statutTrouvé: last.statut,
            match: last.statut === filters.dernierStatut
          });
          
          if (last.statut !== filters.dernierStatut) {
            return false;
          }
        }

        if (filters.dernierServiceId) {
          console.log('🔄 Vérification dernierServiceId:', {
            courrierId: item.id,
            serviceIdReçu: filters.dernierServiceId,
            serviceIdTrouvé: last.service?.id,
            match: last.service?.id === filters.dernierServiceId
          });
          
          if (last.service?.id !== filters.dernierServiceId) {
            return false;
          }
        }

        return true;
      });

      console.log('✅ Résultat filtrage:', {
        nombreCourriersAprèsFiltre: data.length
      });
    }

    const totalItems = requiresLastFilters ? data.length : totalBeforeLastFilters;
    const paginatedItems = requiresLastFilters
      ? data.slice(skip, skip + limit)
      : data;

    const paginatedResult = this.paginationService.createPaginatedResult(
      paginatedItems,
      page,
      limit,
      totalItems,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des courriers',
      `${totalItems} courrier(s) récupéré(s) avec succès.`,
    );
  }

  private parseDateRange(start?: string, end?: string, label?: string) {
    if (!start && !end) {
      return undefined;
    }

    // Si les deux dates sont fournies et identiques, traiter comme une date unique
    if (start && end && start === end) {
      const date = new Date(start);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`La date pour ${label || 'le filtre'} est invalide.`);
      }
      
      // Créer un range pour toute la journée
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      
      return { gte: startOfDay, lte: endOfDay };
    }

    const range: { gte?: Date; lte?: Date } = {};

    if (start) {
      const startDate = new Date(start);
      if (Number.isNaN(startDate.getTime())) {
        throw new BadRequestException(`La date de début pour ${label || 'le filtre'} est invalide.`);
      }
      range.gte = startDate;
    }

    if (end) {
      const endDate = new Date(end);
      if (Number.isNaN(endDate.getTime())) {
        throw new BadRequestException(`La date de fin pour ${label || 'le filtre'} est invalide.`);
      }
      range.lte = endDate;
    }

    return range;
  }

  private parseSingleDate(dateValue: string, label?: string) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`La date pour ${label || 'le filtre'} est invalide.`);
    }

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    return { gte: start, lte: end };
  }

  private parseSearchDate(searchValue: string): { gte: Date; lte: Date } | undefined {
    const value = searchValue.trim();
    let year: number;
    let month: number;
    let day: number;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      year = Number(isoMatch[1]);
      month = Number(isoMatch[2]);
      day = Number(isoMatch[3]);
    } else {
      const frMatch = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
      if (!frMatch) {
        return undefined;
      }
      day = Number(frMatch[1]);
      month = Number(frMatch[2]);
      year = Number(frMatch[3]);
    }

    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (
      Number.isNaN(start.getTime()) ||
      start.getFullYear() !== year ||
      start.getMonth() !== month - 1 ||
      start.getDate() !== day
    ) {
      return undefined;
    }

    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { gte: start, lte: end };
  }

  // 🔍 Récupérer les informations détaillées d'un courrier
  async findOne(id: number) {
    const courrier = await this.prismaService.courrier.findUnique({
      where: { id },
      include: {
        provenance: { select: { id: true, nom: true } },
        service: { select: { id: true, nom: true, sigle: true } },
        user: { select: { id: true, firstName: true, lastName: true, username: true } },
        piecesJointes: { select: { id: true, nom: true, intitule: true, chemin: true, type: true } },
      },
    });

    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    const lastTransmission = await this.prismaService.transmission.findFirst({
      where: { idCourrier: id },
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, nom: true, sigle: true } },
        emetteur: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
    });

    const createurFullName = courrier.user
      ? `${courrier.user.firstName || ''} ${courrier.user.lastName || ''}`.trim() || courrier.user.username
      : null;

    const emetteurFullName = lastTransmission?.emetteur
      ? `${lastTransmission.emetteur.firstName || ''} ${lastTransmission.emetteur.lastName || ''}`.trim() || lastTransmission.emetteur.username
      : null;

    const response = {
      id: courrier.id,
      numero: courrier.numero,
      reference: courrier.reference,
      objet: courrier.objet,
      commentaire: courrier.commentaire,
      commentairePublic: courrier.commentairePublic,
      commentaireInterne: courrier.commentaireInterne,
      priorite: courrier.priorite,
      statut: courrier.statut,
      nom: courrier.nom,
      civilite: courrier.civilite,
      matricule: courrier.matricule,
      telephone: courrier.telephone,
      email: courrier.email,
      adresse: courrier.adresse,
      typeTransfert: courrier.typeTransfert,
      classeCourrier: courrier.classeCourrier,
      categorie: courrier.categorie,
      nombrePieceJointe: courrier.nombrePieceJointe,
      dateArrivee: courrier.dateArrivee,
      dateEnregistrement: courrier.dateEnregistrement,
      idTypeCourrier: courrier.idTypeCourrier,
      isArchive: courrier.isArchive,
      statutArchive: courrier.statutArchive,
      isGeled: courrier.isGeled,
      isDelete: courrier.isDelete,
      isConfidentiel: courrier.isConfidentiel,
      createdAt: courrier.createdAt,
      updatedAt: courrier.updatedAt,
      idProvenance: courrier.provenance ? { id: courrier.provenance.id, nom: courrier.provenance.nom } : null,
      idServiceTraitant: courrier.service ? { id: courrier.service.id, nom: courrier.service.nom, sigle: courrier.service.sigle } : null,
      idCreateur: courrier.user ? { id: courrier.user.id, nomComplet: createurFullName } : null,
      document: courrier.document,
      piecesJointes: courrier.piecesJointes || [],
      dernierStatutService: lastTransmission && lastTransmission.service ? {
        statut: lastTransmission.statut,
        service: {
          id: lastTransmission.service.id,
          nom: lastTransmission.service.nom,
          sigle: lastTransmission.service.sigle
        }
      } : null,
      dernieretransmissions: lastTransmission
        ? [
            {
              id: lastTransmission.id,
              dateInstruction: lastTransmission.dateInstruction,
              instruction: lastTransmission.instruction,
              typeTransfert: lastTransmission.typeTransfert,
              statut: lastTransmission.statut,
              accuseReception: lastTransmission.accuseReception,
              idServiceDestinataire: lastTransmission.service
                ? { id: lastTransmission.service.id, nom: lastTransmission.service.nom, sigle: lastTransmission.service.sigle }
                : null,
              idEmetteur: lastTransmission.emetteur
                ? { id: lastTransmission.emetteur.id, nomComplet: emetteurFullName }
                : null,
            },
          ]
        : [],
    };

    return this.responseFormatter.success(
      response,
      'Détails courrier',
      'Courrier récupéré avec succès.',
    );
  }

  // 🧭 Traçabilité complète d'un courrier (timeline)
  async getTimeline(id: number) {
    const courrier = await this.prismaService.courrier.findUnique({
      where: { id },
      include: {
        service: { include: { parent: true } },
        user: { include: { service: { include: { parent: true } } } },
        provenance: { select: { nom: true, type: true } },
        piecesJointes: true,
      },
    });

    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    const transmissions = await this.prismaService.transmission.findMany({
      where: { idCourrier: id },
      orderBy: { createdAt: 'asc' },
      include: {
        service: { include: { parent: true } },
        emetteur: { include: { service: { include: { parent: true } } } },
        piecesJointes: true,
      },
    });

    const courrierReponsesCount = await this.prismaService.courrierReponse.count({
      where: { courrierId: id },
    });

    const serviceIds = new Set<number>();
    if (courrier.service?.id) {
      serviceIds.add(courrier.service.id);
    }
    for (const transmission of transmissions) {
      if (transmission.service?.id) {
        serviceIds.add(transmission.service.id);
      }
    }

    const servicesUsers = serviceIds.size > 0
      ? await this.prismaService.user.findMany({
          where: { idService: { in: Array.from(serviceIds) }, isActive: true, isDelete: false },
          select: { id: true, firstName: true, lastName: true, email: true, idService: true },
        })
      : [];

    const usersByService = new Map<number, { id: number; nom_complet: string; email: string | null }[]>();
    for (const user of servicesUsers) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const list = usersByService.get(user.idService as number) || [];
      list.push({ id: user.id, nom_complet: fullName || user.email || '', email: user.email || null });
      usersByService.set(user.idService as number, list);
    }

    const formatServiceName = (service: any) => {
      if (!service) return null;
      const parentSigle = service.parent?.sigle;
      return parentSigle ? `${service.nom} - ${parentSigle}` : service.nom;
    };

    const createurFullName = courrier.user
      ? `${courrier.user.firstName || ''} ${courrier.user.lastName || ''}`.trim() || courrier.user.username
      : null;

    const serviceUtilisateur = courrier.user?.service
      ? formatServiceName(courrier.user.service)
      : null;

    const serviceTraitant = courrier.service ? formatServiceName(courrier.service) : null;

    const timeline: Array<any> = [];

    timeline.push({
      date: courrier.createdAt,
      type: 'creation',
      details: {
        dateArrivee: courrier.dateArrivee,
        dateEnregistrement: courrier.dateEnregistrement,
        createur: {
          nom_createur: createurFullName,
          service_utilisateur: serviceUtilisateur,
        },
        service_traitant: serviceTraitant,
        utilisateurs_service_traitant: courrier.service?.id
          ? usersByService.get(courrier.service.id) || []
          : [],
        provenance: {
          nom: courrier.provenance?.nom || null,
          type: courrier.provenance?.type || null,
        },
        categorie: courrier.categorie,
        priorite: courrier.priorite,
        reference: courrier.reference,
        isConfidentiel: courrier.isConfidentiel,
        document: courrier.document || null,
        piecesJointes: courrier.piecesJointes || [],
      },
    });

    for (const transmission of transmissions) {
      const emetteurFullName = transmission.emetteur
        ? `${transmission.emetteur.firstName || ''} ${transmission.emetteur.lastName || ''}`.trim() || transmission.emetteur.username
        : null;
      const serviceEmetteur = transmission.emetteur?.service
        ? formatServiceName(transmission.emetteur.service)
        : null;
      const serviceDestinataire = transmission.service ? formatServiceName(transmission.service) : null;

      timeline.push({
        date: transmission.createdAt,
        type: 'transmission',
        details: {
          id: transmission.id,
          emetteur: {
            nom_emetteur: emetteurFullName,
            service_emetteur: serviceEmetteur,
          },
          destinataire: {
            nom_destinataire_chef: null,
            service_destinataire: serviceDestinataire,
          },
          utilisateurs_service_destinataire: transmission.service?.id
            ? usersByService.get(transmission.service.id) || []
            : [],
          instruction: transmission.instruction,
          typeTransfert: transmission.typeTransfert,
          delaiTraitement: transmission.delaiTraitement,
          statut: transmission.statut,
          accuseReception: transmission.accuseReception,
          structuresCopie: transmission.structuresCopie || null,
          document: transmission.document || null,
          piecesJointes: transmission.piecesJointes || [],
        },
      });
    }

    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const response = {
      courrier: {
        id: courrier.id,
        numero: courrier.numero,
        objet: courrier.objet,
        reference: courrier.reference,
        statut: courrier.statut,
        priorite: courrier.priorite,
        isConfidentiel: courrier.isConfidentiel,
        isGeled: courrier.isGeled,
      },
      timeline,
      statistiques: {
        nombreEvenements: timeline.length,
        nombreTransmissions: transmissions.length,
        nombreReponses: courrierReponsesCount,
        estCloture: courrier.isArchive === true,
        estClasse: courrier.isGeled === true,
      },
    };

    return this.responseFormatter.success(
      response,
      'Traçabilité courrier',
      'Traçabilité récupérée avec succès.',
    );
  }

  // ✅ Clôturer un courrier
  async closeCourrier(id: number, dto: CloseCourrierDto, files: Express.Multer.File[]) {
    const courrier = await this.prismaService.courrier.findUnique({ where: { id } });
    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    const dateRemise = new Date(dto.dateRemiseEffective);
    if (Number.isNaN(dateRemise.getTime())) {
      throw new BadRequestException('La date de remise effective est invalide.');
    }

    const uploadDir = path.join(process.cwd(), 'public', 'courrier', 'bordereau-remise');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const bordereauFiles: Array<{ nom: string; chemin: string; type: string }> = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        bordereauFiles.push({
          nom: file.originalname,
          chemin: `courrier/bordereau-remise/${fileName}`,
          type: file.mimetype,
        });
      }
    }

    const updated = await this.prismaService.courrier.update({
      where: { id },
      data: {
        dateCloture: new Date(),
        dateRemiseEffective: dateRemise,
        statut: 'Clôturé',
        ...(bordereauFiles.length > 0 ? { bordereauRemise: bordereauFiles } : {}),
      },
    });

    return this.responseFormatter.success(
      updated,
      'Clôture courrier',
      'Courrier clôturé avec succès.',
    );
  }

  // ↩️ Déclôturer un courrier
  async decloturerCourrier(id: number) {
    const courrier = await this.prismaService.courrier.findUnique({ where: { id } });
    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    const lastTransmission = await this.prismaService.transmission.findFirst({
      where: { idCourrier: id },
      orderBy: { createdAt: 'desc' },
    });

    let statut = 'Transmis';

    if (lastTransmission?.isArchive) {
      statut = 'Archivé';
    } else if (lastTransmission?.isinstance) {
      statut = 'Instancié';
    } else if (lastTransmission?.accuseReception) {
      statut = 'Reçu';
    }

    const updated = await this.prismaService.courrier.update({
      where: { id },
      data: {
        dateCloture: new Date(0),
        dateRemiseEffective: new Date(0),
        bordereauRemise: [],
        statut,
      },
    });

    return this.responseFormatter.success(
      updated,
      'Déclôture courrier',
      'Courrier déclôturé avec succès.',
    );
  }

  // ✏️ Mettre à jour un courrier et créer une transmission
  async updateWithTransmission(
    userId: number,
    id: number,
    updateCourrierDto: UpdateCourrierDto,
    document?: Express.Multer.File,
    piecesJointes?: Express.Multer.File[],
  ) {
    const courrier = await this.prismaService.courrier.findUnique({
      where: { id },
    });

    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    if (updateCourrierDto.idService) {
      const service = await this.prismaService.service.findUnique({
        where: { id: updateCourrierDto.idService },
      });

      if (!service) {
        throw new NotFoundException(`Le service avec l'ID ${updateCourrierDto.idService} n'existe pas.`);
      }

      const currentUser = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { idService: true },
      });

      if (currentUser && currentUser.idService === updateCourrierDto.idService) {
        throw new BadRequestException('Vous ne pouvez pas assigner un courrier à votre propre service.');
      }
    }

    if (updateCourrierDto.idProvenance) {
      const provenance = await this.prismaService.correspondant.findUnique({
        where: { id: updateCourrierDto.idProvenance },
      });

      if (!provenance) {
        throw new NotFoundException(`La provenance avec l'ID ${updateCourrierDto.idProvenance} n'existe pas.`);
      }
    }

    if (updateCourrierDto.idTypeCourrier) {
      const typeCourrier = await this.prismaService.typeCourrier.findUnique({
        where: { id: updateCourrierDto.idTypeCourrier },
      });

      if (!typeCourrier) {
        throw new NotFoundException(`Le type de courrier avec l'ID ${updateCourrierDto.idTypeCourrier} n'existe pas.`);
      }
    }

    const shouldSendNotification = updateCourrierDto.sendNotification === true;

    let dateArriveeParsed: Date | undefined = undefined;
    if (updateCourrierDto.dateArrivee) {
      const parsed = new Date(updateCourrierDto.dateArrivee);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('La date d\'arrivée est invalide.');
      }
      dateArriveeParsed = parsed;
    }

    const isMonthChanged = dateArriveeParsed
      ? (courrier.dateArrivee
          ? (courrier.dateArrivee.getFullYear() !== dateArriveeParsed.getFullYear() ||
             courrier.dateArrivee.getMonth() !== dateArriveeParsed.getMonth())
          : true)
      : false;

    let newReference: string | undefined = undefined;
    if (isMonthChanged) {
      newReference = await this.genererNumeroReference(dateArriveeParsed || undefined);
    }

    const uploadDir = path.join(process.cwd(), 'public', 'courrier');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let documentPath: string | undefined = undefined;
    if (document) {
      const timestamp = Date.now();
      const documentFileName = `${timestamp}-${document.originalname}`;
      const documentFullPath = path.join(uploadDir, documentFileName);
      fs.writeFileSync(documentFullPath, document.buffer);
      documentPath = `courrier/${documentFileName}`;
    }

    let piecesJointesInfo: Array<{ intitule?: string }> = [];
    if (updateCourrierDto.piecesJointesData) {
      try {
        piecesJointesInfo = JSON.parse(updateCourrierDto.piecesJointesData);
      } catch (error) {
        throw new BadRequestException('Le format des données des pièces jointes est invalide.');
      }
    }

    const dataToUpdate: any = {};
    if (updateCourrierDto.objet !== undefined) dataToUpdate.objet = updateCourrierDto.objet;
    if (updateCourrierDto.priorite !== undefined) dataToUpdate.priorite = updateCourrierDto.priorite;
    if (dateArriveeParsed) dataToUpdate.dateArrivee = dateArriveeParsed;
    if (updateCourrierDto.categorie !== undefined) dataToUpdate.categorie = updateCourrierDto.categorie;
    if (updateCourrierDto.civilite !== undefined) dataToUpdate.civilite = updateCourrierDto.civilite;
    if (updateCourrierDto.telephone !== undefined) dataToUpdate.telephone = updateCourrierDto.telephone;
    if (updateCourrierDto.email !== undefined) dataToUpdate.email = updateCourrierDto.email;
    if (updateCourrierDto.adresse !== undefined) dataToUpdate.adresse = updateCourrierDto.adresse;
    if (updateCourrierDto.idProvenance !== undefined) dataToUpdate.idProvenance = updateCourrierDto.idProvenance;
    if (updateCourrierDto.classeCourrier !== undefined) dataToUpdate.classeCourrier = updateCourrierDto.classeCourrier;
    if (updateCourrierDto.idTypeCourrier !== undefined) dataToUpdate.idTypeCourrier = updateCourrierDto.idTypeCourrier;
    if (updateCourrierDto.commentaire !== undefined) dataToUpdate.commentaire = updateCourrierDto.commentaire;
    if (updateCourrierDto.idService !== undefined) dataToUpdate.idService = updateCourrierDto.idService;
    if (updateCourrierDto.typeTransfert !== undefined) dataToUpdate.typeTransfert = updateCourrierDto.typeTransfert;
    if (updateCourrierDto.isConfidentiel !== undefined) dataToUpdate.isConfidentiel = updateCourrierDto.isConfidentiel;
    if (updateCourrierDto.nombrePieceJointe !== undefined) dataToUpdate.nombrePieceJointe = updateCourrierDto.nombrePieceJointe;
    if (documentPath) dataToUpdate.document = documentPath;
    if (newReference) {
      dataToUpdate.reference = newReference;
      dataToUpdate.numero = newReference;
    }

    const result = await this.prismaService.$transaction(async (prisma) => {
      const updatedCourrier = await prisma.courrier.update({
        where: { id },
        data: dataToUpdate,
      });

      const piecesJointesCreees: any[] = [];
      if (piecesJointes && piecesJointes.length > 0) {
        for (let i = 0; i < piecesJointes.length; i++) {
          const file = piecesJointes[i];
          const intituleData = piecesJointesInfo[i];

          // ✅ CORRECTION: Appliquer la même validation qu'à la création
          if (!intituleData || !intituleData.intitule) {
            continue; // Ignorer si pas d'intitulé
          }

          const timestamp = Date.now();
          const fileName = `${timestamp}-${i}-${file.originalname}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, file.buffer);

          const pieceJointe = await prisma.pieceJointe.create({
            data: {
              nom: file.originalname,
              intitule: intituleData.intitule, // ✅ Utiliser directement l'intitulé (validé)
              chemin: `courrier/${fileName}`,
              type: file.mimetype,
              idCourrier: updatedCourrier.id,
              idParent: updatedCourrier.id,
              typeParent: 'courrier',
            },
          });

          piecesJointesCreees.push(pieceJointe);
        }
      }

      // 🆕 Créer une nouvelle transmission si l'idService a changé
      let transmissionCreee: any = null;
      const serviceHasChanged = updateCourrierDto.idService !== undefined && updateCourrierDto.idService !== courrier.idService;
      if (serviceHasChanged && updateCourrierDto.idService) {
        transmissionCreee = await prisma.transmission.create({
          data: {
            idCourrier: updatedCourrier.id,
            idService: updateCourrierDto.idService,
            idEmetteur: userId,
            dateInstruction: dateArriveeParsed || new Date(),
            typeTransfert: updateCourrierDto.typeTransfert || courrier.typeTransfert || 'Pour traitement',
            instruction: updateCourrierDto.commentaire || courrier.commentaire || 'Transmission suite à modification du service destinataire',
            statut: 'Transmis',
          },
        });
      }

      return { courrier: updatedCourrier, piecesJointes: piecesJointesCreees, transmission: transmissionCreee };
    });

    const idServiceFinal = updateCourrierDto.idService ?? courrier.idService ?? null;
    const dateArriveeFinal = dateArriveeParsed || courrier.dateArrivee || new Date();
    const commentaireFinal = updateCourrierDto.commentaire ?? courrier.commentaire ?? '';
    const typeTransfertFinal = updateCourrierDto.typeTransfert ?? courrier.typeTransfert ?? 'Pour traitement';

    if (shouldSendNotification && updateCourrierDto.email) {
      this.prismaService.service.findUnique({
        where: { id: idServiceFinal ?? undefined },
        select: { nom: true },
      })
      .then((serviceInfo) => {
        return this.mailerService.sendCourrierAccuseReception(
          updateCourrierDto.email || '',
          updateCourrierDto.civilite || '',
          result.courrier.nom || 'Monsieur/Madame',
          result.courrier.numero,
          result.courrier.reference || '',
          updateCourrierDto.objet || 'N/A',
          new Date(result.courrier.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          serviceInfo?.nom || 'Service compétent',
        );
      })
      .catch((error) => {
        console.error(`Erreur envoi email accusé réception à ${updateCourrierDto.email}:`, error);
      });
    }

    if (shouldSendNotification && idServiceFinal) {
      Promise.all([
        this.prismaService.user.findMany({
          where: {
            idService: idServiceFinal,
            isActive: true,
            isDelete: false,
          },
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        }),
        this.prismaService.service.findUnique({
          where: { id: idServiceFinal },
          select: { nom: true },
        }),
      ])
      .then(([serviceUsers, serviceInfo]) => {
        const emailPromises = serviceUsers
          .filter(user => user.email)
          .map(user =>
            this.mailerService.sendCourrierNotificationService(
              user.email,
              user.firstName || '',
              user.lastName || '',
              serviceInfo?.nom || 'Service',
              {
                numero: result.courrier.numero,
                reference: result.courrier.reference || '',
                objet: updateCourrierDto.objet || result.courrier.objet || 'N/A',
                civilite: updateCourrierDto.civilite || result.courrier.civilite || '',
                nom: result.courrier.nom || 'Inconnu',
                priorite: updateCourrierDto.priorite || result.courrier.priorite || 'Normal',
                categorie: updateCourrierDto.categorie || result.courrier.categorie || '',
                dateArrivee: dateArriveeFinal.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }),
                commentaire: commentaireFinal,
              },
            ).catch(error => {
              console.error(`Erreur envoi email à ${user.email}:`, error);
            })
          );
        return Promise.all(emailPromises);
      })
      .catch((error) => {
        console.error(`Erreur lors de l'envoi des emails au service:`, error);
      });
    }

    // 📱 SMS volontairement ignorés pour la mise à jour d'un courrier d'arrivée.
    // Lorsque `shouldSendNotification` est vrai pour une mise à jour, on n'envoie que les emails.
    if (shouldSendNotification) {
      console.log(`📵 SMS volontairement ignorés pour mise à jour du courrier (shouldSendNotification: ${shouldSendNotification}) - seuls les emails sont envoyés.`);
    } else {
      console.log(`📵 SMS désactivés ou aucun téléphone - shouldSendNotification: ${shouldSendNotification}, telephone: ${updateCourrierDto.telephone || 'N/A'}, idServiceFinal: ${idServiceFinal || 'N/A'}`);
    }

    if (idServiceFinal) {
      const transmissionDto = {
        idCourrier: result.courrier.id,
        idService: idServiceFinal,
        dateInstruction: dateArriveeFinal,
        typeTransfert: typeTransfertFinal,
        instruction: commentaireFinal || 'Mise à jour du courrier',
        idEmetteur: userId,
        nombrePieceJointe: 0,
        sendNotification: shouldSendNotification,
      };

      this.traitementService.create(
        userId,
        transmissionDto as any,
        undefined,
        undefined,
      )
      .then(() => {
        console.log(`✅ Transmission créée après mise à jour du courrier ${result.courrier.numero}`);
      })
      .catch((error) => {
        console.error(`❌ Erreur création transmission après mise à jour:`, error);
      });
    }

    return this.responseFormatter.success(
      {
        ...result.courrier,
        piecesJointesAjoutees: result.piecesJointes,
      },
      'Mise à jour courrier',
      `Courrier mis à jour avec succès. ${result.piecesJointes.length} pièce(s) jointe(s) ajoutée(s).`,
    );
  }

  // ❌ Suppression définitive d'un courrier (avec transmissions liées)
  async deletePermanent(id: number) {
    const courrier = await this.prismaService.courrier.findUnique({
      where: { id },
    });

    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    const transmissions = await this.prismaService.transmission.findMany({
      where: { idCourrier: id },
      select: { id: true },
    });

    for (const transmission of transmissions) {
      await this.traitementService.deletePermanent(transmission.id);
    }

    await this.prismaService.courrier.delete({
      where: { id },
    });

    return this.responseFormatter.success(
      { id, transmissionsSupprimees: transmissions.length },
      'Suppression définitive courrier',
      'Courrier supprimé définitivement avec succès.',
    );
  }

  // 🗑️ Suppression logique d'un courrier (avec transmissions liées)
  async delete(id: number) {
    const courrier = await this.prismaService.courrier.findUnique({
      where: { id },
    });

    if (!courrier) {
      throw new NotFoundException(`Le courrier avec l'ID ${id} n'existe pas.`);
    }

    const transmissions = await this.prismaService.transmission.findMany({
      where: { idCourrier: id },
      select: { id: true },
    });

    for (const transmission of transmissions) {
      await this.traitementService.delete(transmission.id);
    }

    const courrierSupprime = await this.prismaService.courrier.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.success(
      { ...courrierSupprime, transmissionsSupprimees: transmissions.length },
      'Suppression logique courrier',
      'Courrier supprimé logiquement avec succès.',
    );
  }
}
