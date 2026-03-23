import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncProjetDto } from './dto/sync.dto';
import { ProjetService } from './projet.service';

@ApiTags('Projets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projets')
export class ProjetSyncController {
  constructor(private readonly projetService: ProjetService) {}

  @Post('sync-external')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchroniser les projets depuis une API externe' })
  @ApiResponse({
    status: 200,
    description: 'Projets synchronisés avec succès.',
    schema: { example: { processed: 24 } },
  })
  async syncExternal(@Body() body: SyncProjetDto) {
    return this.projetService.syncFromExternal(body?.url);
  }
}

