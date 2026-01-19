import { PartialType } from '@nestjs/swagger';
import { CreatePartMarcheDto } from './create-part-marche.dto';

export class UpdatePartMarcheDto extends PartialType(CreatePartMarcheDto) {}
