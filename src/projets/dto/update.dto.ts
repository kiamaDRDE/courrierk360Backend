import { PartialType } from '@nestjs/swagger';
import { CreateProjetDto } from './create.dto';

export class UpdateProjetDto extends PartialType(CreateProjetDto) {}
