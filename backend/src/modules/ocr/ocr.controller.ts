import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { OcrService } from './ocr.service';

@ApiTags('OCR')
@Controller('ocr')
@ApiBearerAuth('access-token')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('passport')
  @ApiOperation({ summary: 'Escanear pasaporte con OCR — extrae datos de la zona MRZ' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new BadRequestException('Solo se aceptan imágenes'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async scanPassport(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió imagen');
    }
    return this.ocrService.extractPassportData(file.buffer);
  }
}
