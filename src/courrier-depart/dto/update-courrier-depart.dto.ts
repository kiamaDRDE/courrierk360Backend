// src/courrier-depart/dto/update-courrier-depart.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateCourrierDepartDto } from './create-courrier-depart.dto';

export class UpdateCourrierDepartDto extends PartialType(CreateCourrierDepartDto) {}
