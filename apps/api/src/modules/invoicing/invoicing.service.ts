import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import type { IWhatsAppAdapter } from '@whatsup/whatsapp';
import { PrismaService } from '../../prisma/prisma.service';
import { WHATSAPP_ADAPTER } from '../whatsapp/whatsapp.tokens';
import { SaveTemplateDto } from './invoicing.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'logos');
const PDF_DIR    = join(process.cwd(), 'uploads', 'invoices');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

@Injectable()
export class InvoicingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WHATSAPP_ADAPTER) private readonly adapter: IWhatsAppAdapter,
  ) {}

  /* ── Template CRUD ─────────────────────────────────────────── */

  async getTemplate(businessId: string) {
    return this.prisma.invoiceTemplate.upsert({
      where:  { businessId },
      create: { businessId },
      update: {},
    });
  }

  async saveTemplate(businessId: string, dto: SaveTemplateDto) {
    return this.prisma.invoiceTemplate.upsert({
      where:  { businessId },
      create: { businessId, ...dto },
      update: dto,
    });
  }

  async saveLogoUrl(businessId: string, logoUrl: string) {
    return this.prisma.invoiceTemplate.upsert({
      where:  { businessId },
      create: { businessId, logoUrl },
      update: { logoUrl },
    });
  }

  /* ── Invoice list ──────────────────────────────────────────── */

  listByBusiness(businessId: string) {
    return this.prisma.invoice.findMany({
      where:   { booking: { businessId } },
      include: {
        booking: {
          include: { client: true, service: true, business: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(invoiceId: string) {
    return this.prisma.invoice.findUnique({
      where:   { id: invoiceId },
      include: {
        booking: {
          include: { client: true, service: true, business: true },
        },
      },
    });
  }

  /* ── PDF generation ────────────────────────────────────────── */

  async generatePdf(bookingId: string): Promise<string> {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { client: true, service: true, business: true },
    });
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);

    const template = await this.getTemplate(booking.businessId);

    ensureDir(PDF_DIR);
    const pdfPath = join(PDF_DIR, `invoice-${bookingId}.pdf`);
    await this.buildPDF(booking, template, pdfPath);

    const invoice = await this.prisma.invoice.upsert({
      where:  { bookingId },
      create: { bookingId, amount: booking.service.price, pdfUrl: pdfPath },
      update: { pdfUrl: pdfPath },
    });

    return invoice.id;
  }

  getPdfPath(bookingId: string): string {
    return join(PDF_DIR, `invoice-${bookingId}.pdf`);
  }

  /* ── WhatsApp send ─────────────────────────────────────────── */

  async sendViaWhatsApp(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { client: true, service: true, business: true },
    });
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);

    const amount = Number(booking.service.price).toLocaleString('en-KE');
    const date   = booking.scheduledAt.toLocaleDateString('en-KE', {
      weekday: 'short', month: 'short', day: 'numeric',
    });

    const message = [
      `🧾 *Invoice from ${booking.business.name}*`,
      ``,
      `Service: ${booking.service.name}`,
      `Date:    ${date}`,
      `Amount:  KES ${amount}`,
      ``,
      `Thank you for your visit! 🙏`,
    ].join('\n');

    await this.adapter.sendText(booking.client.phone, message);

    await this.prisma.invoice.upsert({
      where:  { bookingId },
      create: { bookingId, amount: booking.service.price, sentAt: new Date() },
      update: { sentAt: new Date() },
    });
  }

  /* ── Private PDF builder ───────────────────────────────────── */

  private buildPDF(booking: any, template: any, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = createWriteStream(outputPath);
      doc.pipe(stream);

      const accent = template.accentColor ?? '#FF9500';
      const bName  = template.businessName || booking.business.name;

      /* ── Header ── */
      doc.rect(0, 0, 595, 120).fill(accent);

      doc.fillColor('#FFFFFF')
         .fontSize(22).font('Helvetica-Bold')
         .text(bName, 50, 30, { lineBreak: false });

      if (template.tagline) {
        doc.fillColor('rgba(255,255,255,0.75)')
           .fontSize(11).font('Helvetica')
           .text(template.tagline, 50, 56);
      }

      /* Invoice label + number, right-aligned */
      doc.fillColor('rgba(255,255,255,0.6)')
         .fontSize(9).font('Helvetica')
         .text('INVOICE', 400, 30, { width: 145, align: 'right' });

      const invoiceNo = `INV-${booking.id.slice(-6).toUpperCase()}`;
      doc.fillColor('#FFFFFF')
         .fontSize(18).font('Helvetica-Bold')
         .text(invoiceNo, 400, 42, { width: 145, align: 'right' });

      doc.fillColor('rgba(255,255,255,0.6)')
         .fontSize(9).font('Helvetica')
         .text(new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }), 400, 64, { width: 145, align: 'right' });

      /* ── Bill To ── */
      doc.fillColor('#6E6E73')
         .fontSize(8).font('Helvetica-Bold')
         .text('BILL TO', 50, 145)
         .moveDown(0.3);

      const clientName = booking.client.name ?? booking.client.phone;
      doc.fillColor('#1C1C1E')
         .fontSize(13).font('Helvetica-Bold')
         .text(clientName, 50, 158);

      doc.fillColor('#6E6E73')
         .fontSize(10).font('Helvetica')
         .text(`+${booking.client.phone}`, 50, 175);

      /* ── Divider ── */
      doc.moveTo(50, 205).lineTo(545, 205).stroke('#F0EDE8');

      /* ── Table header ── */
      doc.fillColor('#AEAEB2')
         .fontSize(8).font('Helvetica-Bold')
         .text('DESCRIPTION', 50, 220)
         .text('DURATION', 280, 220)
         .text('DATE', 370, 220)
         .text('AMOUNT', 460, 220, { align: 'right', width: 85 });

      doc.moveTo(50, 232).lineTo(545, 232).stroke('#F0EDE8');

      /* ── Line item ── */
      const scheduledDate = booking.scheduledAt.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
      const scheduledTime = booking.scheduledAt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

      doc.fillColor('#1C1C1E')
         .fontSize(11).font('Helvetica-Bold')
         .text(booking.service.name, 50, 244);

      doc.fillColor('#6E6E73')
         .fontSize(10).font('Helvetica')
         .text(`${booking.service.durationMinutes} min`, 280, 244)
         .text(`${scheduledDate} ${scheduledTime}`, 370, 244)
         .fillColor('#1C1C1E').font('Helvetica-Bold')
         .text(`KES ${Number(booking.service.price).toLocaleString()}`, 460, 244, { align: 'right', width: 85 });

      doc.moveTo(50, 268).lineTo(545, 268).stroke('#F0EDE8');

      /* ── Total ── */
      doc.rect(370, 278, 175, 38).fill('#F9F8F5');
      doc.fillColor('#6E6E73')
         .fontSize(9).font('Helvetica')
         .text('TOTAL', 380, 285);
      doc.fillColor(accent)
         .fontSize(16).font('Helvetica-Bold')
         .text(`KES ${Number(booking.service.price).toLocaleString()}`, 380, 296, { width: 155, align: 'right' });

      /* ── Footer ── */
      const footerY = 720;
      doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#F0EDE8');

      const footerText = template.footerText ?? `Thank you for choosing ${bName}!`;
      doc.fillColor('#AEAEB2')
         .fontSize(9).font('Helvetica')
         .text(footerText, 50, footerY + 12, { align: 'center', width: 495 });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }
}
