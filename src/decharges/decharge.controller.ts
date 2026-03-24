import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DechargeService } from './decharge.service';
import { CreateDechargeDto } from './dto/create.dto';
import { ListDechargeQueryDto } from './dto/list.dto';
import { UpdateDechargeDto } from './dto/update.dto';

@ApiTags('Décharges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('decharges')
export class DechargeController {
  constructor(private readonly dechargeService: DechargeService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une décharge' })
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['dateSignature', 'signataire', 'idCourrierDepart'],
      properties: {
        dateSignature: { type: 'string', example: '2026-03-24T10:00:00.000Z' },
        signataire: { type: 'string', example: 'A-Z ENERGY SARL' },
        observation: { type: 'string', nullable: true, example: 'RAS' },
        idCourrierDepart: { type: 'number', example: 123 },
        document: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Décharge créée avec succès.' })
  create(
    @Body() dto: CreateDechargeDto,
    @UploadedFile() document?: Express.Multer.File,
  ) {
    return this.dechargeService.create(dto, document);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une décharge' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la décharge' })
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dateSignature: { type: 'string', example: '2026-03-24T10:00:00.000Z' },
        signataire: { type: 'string', example: 'A-Z ENERGY SARL' },
        observation: { type: 'string', nullable: true, example: 'RAS' },
        idCourrierDepart: { type: 'number', example: 123 },
        document: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Décharge mise à jour avec succès.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDechargeDto,
    @UploadedFile() document?: Express.Multer.File,
  ) {
    return this.dechargeService.update(id, dto, document);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les décharges',
    description:
      'Liste paginée avec recherche (décharge + courrier départ + destinataire + projet).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Recherche sur signataire/observation/document + champs du courrier départ + nom destinataire + projet',
  })
  @ApiResponse({ status: 200, description: 'Liste paginée des décharges.' })
  list(@Query() query: ListDechargeQueryDto) {
    return this.dechargeService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une décharge" })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la décharge' })
  @ApiResponse({ status: 200, description: 'Décharge récupérée avec succès.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dechargeService.findOne(id);
  }
}
