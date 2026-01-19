import { PartialType } from '@nestjs/swagger';
import { CreateCaracteristiqueDto } from './create-caracteristique.dto';

export class UpdateCaracteristiqueDto extends PartialType(CreateCaracteristiqueDto) {}
