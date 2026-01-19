import { PartialType } from '@nestjs/swagger';
import { CreateTraficDto } from './create-trafic.dto';

export class UpdateTraficDto extends PartialType(CreateTraficDto) {}
