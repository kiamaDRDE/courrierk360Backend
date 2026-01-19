import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiProperty({
    description: 'Nom du service',
    example: 'Mobile',
    required: false,
  })
  nom?: string;

  @ApiProperty({
    description: 'Description du service',
    example: 'Service de télécommunication mobile',
    required: false,
  })
  description?: string;
}
