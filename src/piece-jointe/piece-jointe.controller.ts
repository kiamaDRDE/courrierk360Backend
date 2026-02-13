import {
  Body,
  Controller,
  Delete,
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PieceJointeService } from './piece-jointe.service';
import { CreatePieceJointeDto } from './dto/create-piece-jointe.dto';
import { UpdatePieceJointeDto } from './dto/update-piece-jointe.dto';
import { UpdatePieceJointeIntituleDto } from './dto/update-piece-jointe-intitule.dto';
import { ListPieceJointeQueryDto } from './dto/list-piece-jointe-query.dto';
import { DeletePieceJointeDto } from './dto/delete-piece-jointe.dto';

@ApiTags('Pièces jointes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('piece-jointe')
export class PieceJointeController {
  constructor(private readonly pieceJointeService: PieceJointeService) {}

  // 📋 Lister les pièces jointes
  @Get()
  @ApiOperation({
    summary: 'Lister les pièces jointes',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'typeParent', required: false, type: String })
  @ApiQuery({ name: 'idParent', required: false, type: Number })
  @ApiQuery({ name: 'idTransmission', required: false, type: Number })
  @ApiQuery({ name: 'idCourrier', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste récupérée.' })
  list(@Query() query: ListPieceJointeQueryDto) {
    return this.pieceJointeService.list(query);
  }

  // 🔍 Récupérer une pièce jointe
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une pièce jointe' })
  @ApiResponse({ status: 200, description: 'Pièce jointe récupérée.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pieceJointeService.findOne(id);
  }

  // ⬆️ Uploader une pièce jointe
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Uploader une pièce jointe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        intitule: { type: 'string' },
        typeParent: { type: 'string' },
        idParent: { type: 'number' },
        idTransmission: { type: 'number' },
        idCourrier: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  upload(
    @Body() dto: CreatePieceJointeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.pieceJointeService.upload(dto, file as Express.Multer.File);
  }

  // ✏️ Mettre à jour toute la pièce jointe
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Mettre à jour une pièce jointe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        intitule: { type: 'string' },
        typeParent: { type: 'string' },
        idParent: { type: 'number' },
        idTransmission: { type: 'number' },
        idCourrier: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePieceJointeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.pieceJointeService.update(id, dto, file);
  }

  // ✏️ Mettre à jour uniquement l'intitulé
  @Patch(':id/intitule')
  @ApiOperation({ summary: "Mettre à jour l'intitulé" })
  updateIntitule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePieceJointeIntituleDto,
  ) {
    return this.pieceJointeService.updateIntitule(id, dto);
  }

  // ✏️ Mettre à jour intitulé + fichier
  @Patch(':id/intitule-file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Mettre à jour l'intitulé et le fichier" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        intitule: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  updateIntituleAndFile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePieceJointeIntituleDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.pieceJointeService.update(id, dto as any, file);
  }

  // 🗑️ Supprimer plusieurs pièces jointes
  @Delete()
  @ApiOperation({ summary: 'Supprimer plusieurs pièces jointes' })
  deleteMany(@Body() dto: DeletePieceJointeDto) {
    return this.pieceJointeService.deleteMany(dto);
  }
}
