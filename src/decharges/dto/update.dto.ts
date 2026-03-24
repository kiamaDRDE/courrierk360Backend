import { PartialType } from '@nestjs/swagger';
import { CreateDechargeDto } from './create.dto';

export class UpdateDechargeDto extends PartialType(CreateDechargeDto) {}
