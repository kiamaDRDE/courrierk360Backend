import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatistiqueService } from './statistique.service';
import { StatistiqueQueryDto } from './dto/statistique-query.dto';

@ApiTags('Statistique')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statistique')
export class StatistiqueController {
  constructor(private readonly statistiqueService: StatistiqueService) {}

  @Get()
  @ApiOperation({ summary: 'Statistiques globales' })
  @ApiQuery({ name: 'dateDebut', required: false, type: String })
  @ApiQuery({ name: 'dateFin', required: false, type: String })
  @ApiQuery({ name: 'priorite', required: false, type: String })
  @ApiQuery({ name: 'isConfidentiel', required: false, type: Boolean })
  @ApiQuery({ name: 'serviceId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Statistiques globales récupérées avec succès.' })
  getStats(@Query() query: StatistiqueQueryDto) {
    return this.statistiqueService.getGlobalStats(query);
  }
}
