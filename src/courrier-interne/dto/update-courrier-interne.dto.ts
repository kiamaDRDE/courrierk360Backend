// src/courrier-interne/dto/update-courrier-interne.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateCourrierInterneDto } from './create-courrier-interne.dto';

export class UpdateCourrierInterneDto extends PartialType(CreateCourrierInterneDto) {}
