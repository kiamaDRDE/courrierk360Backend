import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SyncDestinatairesDto {
  @ApiPropertyOptional({
    description: 'URL externe à utiliser (optionnel)',
    example:
      'http://api-kiama360-test.kiama.cm/courrier/destinataires?page=1&limit=0',
  })
  @IsOptional()
  @IsString({ message: 'url doit être une chaîne de caractères' })
  url?: string;
}

