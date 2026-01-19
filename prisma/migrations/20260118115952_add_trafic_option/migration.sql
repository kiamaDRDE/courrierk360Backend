-- DropIndex
DROP INDEX `activity_logs_action_idx` ON `activity_logs`;

-- DropIndex
DROP INDEX `avantages_nom_idx` ON `avantages`;

-- DropIndex
DROP INDEX `consommations_moyennes_nom_idx` ON `consommations_moyennes`;

-- DropIndex
DROP INDEX `options_nom_idx` ON `options`;

-- DropIndex
DROP INDEX `structures_tarifaires_nom_idx` ON `structures_tarifaires`;

-- AlterTable
ALTER TABLE `options` ADD COLUMN `trafic_option` DECIMAL(10, 2) NULL;

-- CreateIndex
CREATE INDEX `activity_logs_action_idx` ON `activity_logs`(`action`);

-- CreateIndex
CREATE INDEX `avantages_nom_idx` ON `avantages`(`nom`);

-- CreateIndex
CREATE INDEX `consommations_moyennes_nom_idx` ON `consommations_moyennes`(`nom`);

-- CreateIndex
CREATE INDEX `options_nom_idx` ON `options`(`nom`);

-- CreateIndex
CREATE INDEX `structures_tarifaires_nom_idx` ON `structures_tarifaires`(`nom`);

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
