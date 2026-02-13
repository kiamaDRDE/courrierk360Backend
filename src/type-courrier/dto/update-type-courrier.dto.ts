// src/type-courrier/dto/update-type-courrier.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateTypeCourrierDto } from './create-type-courrier.dto';

export class UpdateTypeCourrierDto extends PartialType(CreateTypeCourrierDto) {}
