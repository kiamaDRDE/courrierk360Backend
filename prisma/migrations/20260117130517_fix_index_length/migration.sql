-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(255) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `fonction` VARCHAR(255) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('UTILISATEUR', 'SUPER_ADMIN') NOT NULL DEFAULT 'SUPER_ADMIN',
    `reset_otp` VARCHAR(255) NULL,
    `reset_expires` DATETIME(3) NULL,
    `token` VARCHAR(500) NULL,
    `expires_token` DATETIME(3) NULL,
    `refresh_token` VARCHAR(500) NULL,
    `refresh_expires` DATETIME(3) NULL,
    `verify_otp` VARCHAR(255) NULL,
    `verify_expires` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_id_idx`(`id`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_numero_idx`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(255) NOT NULL,
    `module` VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    `level` VARCHAR(50) NOT NULL DEFAULT 'INFO',
    `description` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_user_id_idx`(`user_id`),
    INDEX `activity_logs_created_at_idx`(`created_at`),
    INDEX `activity_logs_action_idx`(`action`),
    INDEX `activity_logs_module_idx`(`module`),
    INDEX `activity_logs_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operateurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(100) NOT NULL,
    `statut` VARCHAR(50) NOT NULL,
    `annee_creation` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `operateurs_nom_key`(`nom`),
    INDEX `operateurs_id_idx`(`id`),
    INDEX `operateurs_nom_idx`(`nom`),
    INDEX `operateurs_code_idx`(`code`),
    INDEX `operateurs_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `services_nom_key`(`nom`),
    INDEX `services_id_idx`(`id`),
    INDEX `services_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operateur_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operateur_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operateur_services_operateur_id_idx`(`operateur_id`),
    INDEX `operateur_services_service_id_idx`(`service_id`),
    UNIQUE INDEX `operateur_services_operateur_id_service_id_key`(`operateur_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `type_appels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `libelle` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `categorie` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `type_appels_libelle_key`(`libelle`),
    INDEX `type_appels_id_idx`(`id`),
    INDEX `type_appels_libelle_idx`(`libelle`),
    INDEX `type_appels_categorie_idx`(`categorie`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offres` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operateur_id` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `date_debut_validite` DATETIME(3) NOT NULL,
    `date_fin_validite` DATETIME(3) NOT NULL,
    `type_offre` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(255) NOT NULL,
    `statut` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `tp` DECIMAL(10, 2) NULL DEFAULT 0,
    `tnc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ep` DECIMAL(10, 2) NULL DEFAULT 0,
    `tp_onnet` DECIMAL(10, 2) NULL DEFAULT 0,
    `tf_onnet` DECIMAL(10, 2) NULL DEFAULT 0,
    `tnc_onnet` DECIMAL(10, 2) NULL DEFAULT 0,
    `ep_onnet` DECIMAL(10, 2) NULL DEFAULT 0,
    `tp_offnet` DECIMAL(10, 2) NULL DEFAULT 0,
    `tf_offnet` DECIMAL(10, 2) NULL DEFAULT 0,
    `tnc_offnet` DECIMAL(10, 2) NULL DEFAULT 0,
    `ep_offnet` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_base_operateur_offnet_hc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_base_operateur_offnet_hp` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_base_operateur_onnet_hc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_base_operateur_onnet_hp` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_inter_operateur_offnet_hc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_inter_operateur_offnet_hp` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_inter_operateur_onnet_hc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_inter_operateur_onnet_hp` DECIMAL(10, 2) NULL DEFAULT 0,
    `somme_base_autres_operateurs_offnet_hc` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_base_autres_operateurs_offnet_hp` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_base_autres_operateurs_onnet_hc` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_base_autres_operateurs_onnet_hp` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_inter_autres_operateurs_offnet_hc` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_inter_autres_operateurs_offnet_hp` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_inter_autres_operateurs_onnet_hc` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_inter_autres_operateurs_onnet_hp` DECIMAL(15, 2) NULL DEFAULT 0,
    `nombre_autres_operateurs` INTEGER NULL,
    `ta_moyen_base_offnet_hc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_moyen_base_offnet_hp` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_moyen_base_onnet_hc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_moyen_base_onnet_hp` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_moyen_inter_offnet_hc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_moyen_inter_offnet_hp` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_moyen_inter_onnet_hc` DECIMAL(10, 2) NULL DEFAULT 0,
    `ta_moyen_inter_onnet_hp` DECIMAL(10, 2) NULL DEFAULT 0,
    `prix_on_net` DECIMAL(10, 2) NULL,
    `prix_off_net` DECIMAL(10, 2) NULL,
    `revenu_moyen_on_net` DECIMAL(10, 2) NULL DEFAULT 0,
    `revenu_moyen_off_net` DECIMAL(10, 2) NULL DEFAULT 0,
    `somme_frais_souscription` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_trafic_gratuit` DECIMAL(15, 2) NULL DEFAULT 0,
    `somme_trafic_option` DECIMAL(15, 2) NULL DEFAULT 0,
    `effet_club` DECIMAL(10, 2) NULL,
    `effet_club_base_offnet_hc` DECIMAL(10, 2) NULL,
    `effet_club_base_offnet_hp` DECIMAL(10, 2) NULL,
    `effet_club_base_onnet_hc` DECIMAL(10, 2) NULL,
    `effet_club_base_onnet_hp` DECIMAL(10, 2) NULL,
    `effet_club_inter_offnet_hc` DECIMAL(10, 2) NULL,
    `effet_club_inter_offnet_hp` DECIMAL(10, 2) NULL,
    `effet_club_inter_onnet_hc` DECIMAL(10, 2) NULL,
    `effet_club_inter_onnet_hp` DECIMAL(10, 2) NULL,
    `effet_club_revenu_base_offnet_hc` DECIMAL(10, 2) NULL,
    `effet_club_revenu_base_offnet_hp` DECIMAL(10, 2) NULL,
    `effet_club_revenu_base_onnet_hc` DECIMAL(10, 2) NULL,
    `effet_club_revenu_base_onnet_hp` DECIMAL(10, 2) NULL,
    `effet_club_revenu_inter_offnet_hc` DECIMAL(10, 2) NULL,
    `effet_club_revenu_inter_offnet_hp` DECIMAL(10, 2) NULL,
    `effet_club_revenu_inter_onnet_hc` DECIMAL(10, 2) NULL,
    `effet_club_revenu_inter_onnet_hp` DECIMAL(10, 2) NULL,
    `effet_club_revenus` DECIMAL(10, 2) NULL,
    `resultat_base_offnet_hc` VARCHAR(100) NULL,
    `resultat_base_offnet_hp` VARCHAR(100) NULL,
    `resultat_base_onnet_hc` VARCHAR(100) NULL,
    `resultat_base_onnet_hp` VARCHAR(100) NULL,
    `resultat_inter_offnet_hc` VARCHAR(100) NULL,
    `resultat_inter_offnet_hp` VARCHAR(100) NULL,
    `resultat_inter_onnet_hc` VARCHAR(100) NULL,
    `resultat_inter_onnet_hp` VARCHAR(100) NULL,
    `resultat_revenu_base_offnet_hc` VARCHAR(100) NULL,
    `resultat_revenu_base_offnet_hp` VARCHAR(100) NULL,
    `resultat_revenu_base_onnet_hc` VARCHAR(100) NULL,
    `resultat_revenu_base_onnet_hp` VARCHAR(100) NULL,
    `resultat_revenu_inter_offnet_hc` VARCHAR(100) NULL,
    `resultat_revenu_inter_offnet_hp` VARCHAR(100) NULL,
    `resultat_revenu_inter_onnet_hc` VARCHAR(100) NULL,
    `resultat_revenu_inter_onnet_hp` VARCHAR(100) NULL,
    `resultat_revenus` VARCHAR(100) NULL,
    `is_effet_club_base_offnet_hc` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_base_offnet_hp` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_base_onnet_hc` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_base_onnet_hp` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_inter_offnet_hc` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_inter_offnet_hp` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_inter_onnet_hc` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_inter_onnet_hp` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenu_base_offnet_hc` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenu_base_offnet_hp` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenu_base_onnet_hc` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenu_base_onnet_hp` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenu_inter_offnet_hc` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenu_inter_offnet_hp` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenu_inter_onnet_hc` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenu_inter_onnet_hp` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club` BOOLEAN NOT NULL DEFAULT false,
    `is_effet_club_revenus` BOOLEAN NOT NULL DEFAULT false,
    `resultat` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `offres_id_idx`(`id`),
    INDEX `offres_operateur_id_idx`(`operateur_id`),
    INDEX `offres_nom_idx`(`nom`),
    INDEX `offres_type_offre_idx`(`type_offre`),
    INDEX `offres_statut_idx`(`statut`),
    INDEX `offres_date_debut_validite_idx`(`date_debut_validite`),
    INDEX `offres_date_fin_validite_idx`(`date_fin_validite`),
    UNIQUE INDEX `offres_operateur_id_nom_key`(`operateur_id`, `nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarifs_interconnexion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operateur_id` INTEGER NOT NULL,
    `annee` INTEGER NOT NULL,
    `tarif_off_net_heure_creuse` DECIMAL(10, 2) NOT NULL,
    `tarif_off_net_heure_pleine` DECIMAL(10, 2) NOT NULL,
    `tarif_on_net_heure_creuse` DECIMAL(10, 2) NOT NULL,
    `tarif_on_net_heure_pleine` DECIMAL(10, 2) NOT NULL,
    `type_tarif` VARCHAR(100) NOT NULL DEFAULT 'Standard',
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tarifs_interconnexion_id_idx`(`id`),
    INDEX `tarifs_interconnexion_operateur_id_idx`(`operateur_id`),
    INDEX `tarifs_interconnexion_annee_idx`(`annee`),
    INDEX `tarifs_interconnexion_type_tarif_idx`(`type_tarif`),
    UNIQUE INDEX `tarifs_interconnexion_operateur_id_annee_type_tarif_key`(`operateur_id`, `annee`, `type_tarif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarif_interconnexion_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tarif_interconnexion_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tarif_interconnexion_services_tarif_interconnexion_id_idx`(`tarif_interconnexion_id`),
    INDEX `tarif_interconnexion_services_service_id_idx`(`service_id`),
    UNIQUE INDEX `tarif_interconnexion_services_tarif_interconnexion_id_servic_key`(`tarif_interconnexion_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `structures_tarifaires` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(255) NOT NULL,
    `valeur` DECIMAL(10, 2) NOT NULL,
    `est_obligatoire` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `structures_tarifaires_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avantages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(255) NOT NULL,
    `valeur` DECIMAL(10, 2) NOT NULL,
    `is_gratuit` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `avantages_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offre_avantages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offre_id` INTEGER NOT NULL,
    `avantage_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `offre_avantages_offre_id_idx`(`offre_id`),
    INDEX `offre_avantages_avantage_id_idx`(`avantage_id`),
    UNIQUE INDEX `offre_avantages_offre_id_avantage_id_key`(`offre_id`, `avantage_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offre_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offre_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `offre_services_offre_id_idx`(`offre_id`),
    INDEX `offre_services_service_id_idx`(`service_id`),
    UNIQUE INDEX `offre_services_offre_id_service_id_key`(`offre_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `types_operateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `types_operateur_nom_key`(`nom`),
    INDEX `types_operateur_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trafics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operateur_id` INTEGER NOT NULL,
    `annee` INTEGER NOT NULL,
    `type_trafic` VARCHAR(100) NOT NULL,
    `volume` DECIMAL(18, 4) NOT NULL,
    `autre_operateur` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trafics_id_idx`(`id`),
    INDEX `trafics_operateur_id_idx`(`operateur_id`),
    INDEX `trafics_annee_idx`(`annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trafic_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trafic_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trafic_services_trafic_id_idx`(`trafic_id`),
    INDEX `trafic_services_service_id_idx`(`service_id`),
    UNIQUE INDEX `trafic_services_trafic_id_service_id_key`(`trafic_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trafic_autres_operateurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trafic_id` INTEGER NOT NULL,
    `autre_operateur_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trafic_autres_operateurs_trafic_id_idx`(`trafic_id`),
    INDEX `trafic_autres_operateurs_autre_operateur_id_idx`(`autre_operateur_id`),
    UNIQUE INDEX `trafic_autres_operateurs_trafic_id_autre_operateur_id_key`(`trafic_id`, `autre_operateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `abonnements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operateur_id` INTEGER NOT NULL,
    `annee` INTEGER NOT NULL,
    `type_abonnement` VARCHAR(100) NOT NULL,
    `nombre_abonnes` INTEGER NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `abonnements_id_idx`(`id`),
    INDEX `abonnements_operateur_id_idx`(`operateur_id`),
    INDEX `abonnements_annee_idx`(`annee`),
    INDEX `abonnements_type_abonnement_idx`(`type_abonnement`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `abonnement_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `abonnement_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `abonnement_services_abonnement_id_idx`(`abonnement_id`),
    INDEX `abonnement_services_service_id_idx`(`service_id`),
    UNIQUE INDEX `abonnement_services_abonnement_id_service_id_key`(`abonnement_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chiffres_affaire` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operateur_id` INTEGER NOT NULL,
    `annee` INTEGER NOT NULL,
    `chiffre_affaire` DECIMAL(18, 2) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chiffres_affaire_id_idx`(`id`),
    INDEX `chiffres_affaire_operateur_id_idx`(`operateur_id`),
    INDEX `chiffres_affaire_annee_idx`(`annee`),
    UNIQUE INDEX `chiffres_affaire_operateur_id_annee_key`(`operateur_id`, `annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chiffre_affaire_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chiffre_affaire_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `montant` DECIMAL(18, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chiffre_affaire_services_chiffre_affaire_id_idx`(`chiffre_affaire_id`),
    INDEX `chiffre_affaire_services_service_id_idx`(`service_id`),
    UNIQUE INDEX `chiffre_affaire_services_chiffre_affaire_id_service_id_key`(`chiffre_affaire_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parts_marche` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operateur_id` INTEGER NOT NULL,
    `annee` INTEGER NOT NULL,
    `part_marche_trafic` DECIMAL(5, 2) NULL,
    `part_marche_chiffre_affaire` DECIMAL(5, 2) NULL,
    `part_marche_abonnes` DECIMAL(5, 2) NULL,
    `somme_trafic` DECIMAL(15, 2) NULL,
    `somme_abonnement` DECIMAL(15, 2) NULL,
    `somme_chiffre_affaire` DECIMAL(18, 2) NULL,
    `volume_trafic` DECIMAL(15, 2) NULL,
    `nombre_abonne` INTEGER NULL,
    `chiffre_affaire` DECIMAL(18, 2) NULL,
    `ihh_trafic` DECIMAL(10, 4) NULL,
    `ihh_abonne` DECIMAL(10, 4) NULL,
    `ihh_chiffre_affaire` DECIMAL(10, 4) NULL,
    `is_concentre_trafic` BOOLEAN NOT NULL DEFAULT false,
    `is_concentre_abonne` BOOLEAN NOT NULL DEFAULT false,
    `is_concentre_chiffre_affaire` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `parts_marche_operateur_id_idx`(`operateur_id`),
    INDEX `parts_marche_annee_idx`(`annee`),
    UNIQUE INDEX `parts_marche_operateur_id_annee_key`(`operateur_id`, `annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caracteristiques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offre_id` INTEGER NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `on_net` DECIMAL(10, 2) NOT NULL,
    `off_net` DECIMAL(10, 2) NOT NULL,
    `international` DECIMAL(10, 2) NOT NULL,
    `roaming` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `caracteristiques_offre_id_idx`(`offre_id`),
    INDEX `caracteristiques_type_idx`(`type`),
    UNIQUE INDEX `caracteristiques_offre_id_type_key`(`offre_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parametres` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(100) NOT NULL,
    `redevance_fst` DECIMAL(10, 2) NULL,
    `redevance_regulation` DECIMAL(10, 2) NULL,
    `droit_entree` DECIMAL(10, 2) NULL,
    `couts_commerciaux` DECIMAL(10, 2) NULL,
    `tva` DECIMAL(5, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `parametres_type_idx`(`type`),
    UNIQUE INDEX `parametres_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consommations_moyennes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(255) NOT NULL,
    `valeur` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `consommations_moyennes_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offre_consommations_moyennes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offre_id` INTEGER NOT NULL,
    `consommation_moyenne_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `offre_consommations_moyennes_offre_id_idx`(`offre_id`),
    INDEX `offre_consommations_moyennes_consommation_moyenne_id_idx`(`consommation_moyenne_id`),
    UNIQUE INDEX `offre_consommations_moyennes_offre_id_consommation_moyenne_i_key`(`offre_id`, `consommation_moyenne_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offre_id` INTEGER NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `tva` DECIMAL(5, 2) NOT NULL,
    `nombre_souscriptions` INTEGER NOT NULL,
    `frais_souscription` DECIMAL(10, 2) NOT NULL,
    `tarif_minute_on_net` DECIMAL(10, 2) NOT NULL,
    `tarif_minute_off_net` DECIMAL(10, 2) NOT NULL,
    `annee` INTEGER NOT NULL,
    `trafic` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `options_id_idx`(`id`),
    INDEX `options_offre_id_idx`(`offre_id`),
    INDEX `options_nom_idx`(`nom`),
    INDEX `options_annee_idx`(`annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option_structures_tarifaires` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `option_id` INTEGER NOT NULL,
    `structure_tarifaire_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `option_structures_tarifaires_option_id_idx`(`option_id`),
    INDEX `option_structures_tarifaires_structure_tarifaire_id_idx`(`structure_tarifaire_id`),
    UNIQUE INDEX `option_structures_tarifaires_option_id_structure_tarifaire_i_key`(`option_id`, `structure_tarifaire_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option_avantages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `option_id` INTEGER NOT NULL,
    `avantage_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `option_avantages_option_id_idx`(`option_id`),
    INDEX `option_avantages_avantage_id_idx`(`avantage_id`),
    UNIQUE INDEX `option_avantages_option_id_avantage_id_key`(`option_id`, `avantage_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option_consommations_moyennes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `option_id` INTEGER NOT NULL,
    `consommation_moyenne_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `option_consommations_moyennes_option_id_idx`(`option_id`),
    INDEX `option_consommations_moyennes_consommation_moyenne_id_idx`(`consommation_moyenne_id`),
    UNIQUE INDEX `option_consommations_moyennes_option_id_consommation_moyenne_key`(`option_id`, `consommation_moyenne_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ciseaux_tarifaires` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `annee` INTEGER NOT NULL,
    `cout_reseau` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `cout_commerciaux` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `cout_interconnexion` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `taxe` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `cout` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ciseaux_tarifaires_annee_key`(`annee`),
    INDEX `ciseaux_tarifaires_id_idx`(`id`),
    INDEX `ciseaux_tarifaires_annee_idx`(`annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operateur_services` ADD CONSTRAINT `operateur_services_operateur_id_fkey` FOREIGN KEY (`operateur_id`) REFERENCES `operateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operateur_services` ADD CONSTRAINT `operateur_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offres` ADD CONSTRAINT `offres_operateur_id_fkey` FOREIGN KEY (`operateur_id`) REFERENCES `operateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarifs_interconnexion` ADD CONSTRAINT `tarifs_interconnexion_operateur_id_fkey` FOREIGN KEY (`operateur_id`) REFERENCES `operateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarif_interconnexion_services` ADD CONSTRAINT `tarif_interconnexion_services_tarif_interconnexion_id_fkey` FOREIGN KEY (`tarif_interconnexion_id`) REFERENCES `tarifs_interconnexion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarif_interconnexion_services` ADD CONSTRAINT `tarif_interconnexion_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offre_avantages` ADD CONSTRAINT `offre_avantages_offre_id_fkey` FOREIGN KEY (`offre_id`) REFERENCES `offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offre_avantages` ADD CONSTRAINT `offre_avantages_avantage_id_fkey` FOREIGN KEY (`avantage_id`) REFERENCES `avantages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offre_services` ADD CONSTRAINT `offre_services_offre_id_fkey` FOREIGN KEY (`offre_id`) REFERENCES `offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offre_services` ADD CONSTRAINT `offre_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trafics` ADD CONSTRAINT `trafics_operateur_id_fkey` FOREIGN KEY (`operateur_id`) REFERENCES `operateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trafic_services` ADD CONSTRAINT `trafic_services_trafic_id_fkey` FOREIGN KEY (`trafic_id`) REFERENCES `trafics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trafic_services` ADD CONSTRAINT `trafic_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trafic_autres_operateurs` ADD CONSTRAINT `trafic_autres_operateurs_trafic_id_fkey` FOREIGN KEY (`trafic_id`) REFERENCES `trafics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trafic_autres_operateurs` ADD CONSTRAINT `trafic_autres_operateurs_autre_operateur_id_fkey` FOREIGN KEY (`autre_operateur_id`) REFERENCES `operateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `abonnements` ADD CONSTRAINT `abonnements_operateur_id_fkey` FOREIGN KEY (`operateur_id`) REFERENCES `operateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `abonnement_services` ADD CONSTRAINT `abonnement_services_abonnement_id_fkey` FOREIGN KEY (`abonnement_id`) REFERENCES `abonnements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `abonnement_services` ADD CONSTRAINT `abonnement_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chiffres_affaire` ADD CONSTRAINT `chiffres_affaire_operateur_id_fkey` FOREIGN KEY (`operateur_id`) REFERENCES `operateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chiffre_affaire_services` ADD CONSTRAINT `chiffre_affaire_services_chiffre_affaire_id_fkey` FOREIGN KEY (`chiffre_affaire_id`) REFERENCES `chiffres_affaire`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chiffre_affaire_services` ADD CONSTRAINT `chiffre_affaire_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parts_marche` ADD CONSTRAINT `parts_marche_operateur_id_fkey` FOREIGN KEY (`operateur_id`) REFERENCES `operateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caracteristiques` ADD CONSTRAINT `caracteristiques_offre_id_fkey` FOREIGN KEY (`offre_id`) REFERENCES `offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offre_consommations_moyennes` ADD CONSTRAINT `offre_consommations_moyennes_offre_id_fkey` FOREIGN KEY (`offre_id`) REFERENCES `offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offre_consommations_moyennes` ADD CONSTRAINT `offre_consommations_moyennes_consommation_moyenne_id_fkey` FOREIGN KEY (`consommation_moyenne_id`) REFERENCES `consommations_moyennes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `options` ADD CONSTRAINT `options_offre_id_fkey` FOREIGN KEY (`offre_id`) REFERENCES `offres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option_structures_tarifaires` ADD CONSTRAINT `option_structures_tarifaires_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option_structures_tarifaires` ADD CONSTRAINT `option_structures_tarifaires_structure_tarifaire_id_fkey` FOREIGN KEY (`structure_tarifaire_id`) REFERENCES `structures_tarifaires`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option_avantages` ADD CONSTRAINT `option_avantages_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option_avantages` ADD CONSTRAINT `option_avantages_avantage_id_fkey` FOREIGN KEY (`avantage_id`) REFERENCES `avantages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option_consommations_moyennes` ADD CONSTRAINT `option_consommations_moyennes_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option_consommations_moyennes` ADD CONSTRAINT `option_consommations_moyennes_consommation_moyenne_id_fkey` FOREIGN KEY (`consommation_moyenne_id`) REFERENCES `consommations_moyennes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
