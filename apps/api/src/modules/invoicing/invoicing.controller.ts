import {
  Body, Controller, Get, Param, Post, Put, Query,
  Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream, existsSync } from 'fs';
import type { Response } from 'express';
import { InvoicingService } from './invoicing.service';
import { SaveTemplateDto } from './invoicing.dto';

const logoStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'logos'),
  filename: (_req, file, cb) => {
    cb(null, `logo-${Date.now()}${extname(file.originalname)}`);
  },
});

@Controller('invoices')
export class InvoicingController {
  constructor(private readonly invoicing: InvoicingService) {}

  /* GET /invoices?businessId= */
  @Get()
  list(@Query('businessId') businessId: string) {
    return this.invoicing.listByBusiness(businessId);
  }

  /* GET /invoices/template/:businessId */
  @Get('template/:businessId')
  getTemplate(@Param('businessId') businessId: string) {
    return this.invoicing.getTemplate(businessId);
  }

  /* PUT /invoices/template/:businessId */
  @Put('template/:businessId')
  saveTemplate(
    @Param('businessId') businessId: string,
    @Body() dto: SaveTemplateDto,
  ) {
    return this.invoicing.saveTemplate(businessId, dto);
  }

  /* POST /invoices/template/:businessId/logo */
  @Post('template/:businessId/logo')
  @UseInterceptors(FileInterceptor('logo', { storage: logoStorage }))
  async uploadLogo(
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/logos/${file.filename}`;
    await this.invoicing.saveLogoUrl(businessId, url);
    return { logoUrl: url };
  }

  /* POST /invoices/:bookingId/generate */
  @Post(':bookingId/generate')
  async generate(@Param('bookingId') bookingId: string) {
    const invoiceId = await this.invoicing.generatePdf(bookingId);
    return { invoiceId };
  }

  /* GET /invoices/:bookingId/pdf */
  @Get(':bookingId/pdf')
  streamPdf(@Param('bookingId') bookingId: string, @Res() res: Response) {
    const path = this.invoicing.getPdfPath(bookingId);
    if (!existsSync(path)) {
      res.status(404).json({ error: 'PDF not yet generated' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${bookingId}.pdf"`);
    createReadStream(path).pipe(res);
  }

  /* POST /invoices/:bookingId/send */
  @Post(':bookingId/send')
  async send(@Param('bookingId') bookingId: string) {
    await this.invoicing.sendViaWhatsApp(bookingId);
    return { sent: true };
  }
}
