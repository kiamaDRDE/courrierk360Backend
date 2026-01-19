import { PartialType } from '@nestjs/swagger';
import { CreateStructureTarifaireDto } from './create-structure-tarifaire.dto';

export class UpdateStructureTarifaireDto extends PartialType(CreateStructureTarifaireDto) {}
