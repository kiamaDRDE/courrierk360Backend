// src/salle/dto/update-salle.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateSalleDto } from './create-salle.dto';

export class UpdateSalleDto extends PartialType(CreateSalleDto) {}
