import { PartialType } from '@nestjs/swagger';
import { CreateChiffreAffaireDto } from './create-chiffre-affaire.dto';

export class UpdateChiffreAffaireDto extends PartialType(CreateChiffreAffaireDto) {}
