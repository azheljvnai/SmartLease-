import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { LeaseAgreementFormData, LeasePdfMetadata, LeasePaymentMethod, PropertyType, TenantUtility } from '../types';
import { formatCurrencyForPdf, formatDate } from '../lib/format';
import { loadPdfFonts, sanitizePdfText } from '../lib/pdf-fonts';
import {
  computeLeaseDuration,
  formatAgreementDate,
  formatGeneratedTimestamp,
  PAYMENT_METHOD_LABELS,
  PROPERTY_TYPE_LABELS,
  TENANT_UTILITY_LABELS,
} from '../lib/lease-pdf-helpers';

const MARGIN = 50;
const LINE_HEIGHT = 14;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type DrawContext = {
  pdfDoc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
};

export async function generateLeaseAgreementPdf(
  data: LeaseAgreementFormData,
  metadata: LeasePdfMetadata,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { font, bold, compact } = await loadPdfFonts(pdfDoc);
  const money = (amount: number) => formatCurrencyForPdf(amount, compact);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ctx: DrawContext = { pdfDoc, font, bold, page, y };

  const ensureSpace = (needed: number) => {
    if (ctx.y < MARGIN + needed) {
      ctx.page = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      ctx.y = PAGE_HEIGHT - MARGIN;
    }
  };

  const drawText = (
    text: string,
    opts: { size?: number; bold?: boolean; indent?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    const usedFont = opts.bold ? bold : font;
    const indent = opts.indent ?? 0;
    const safeText = sanitizePdfText(text, compact);
    const lines = wrapText(safeText, usedFont, size, CONTENT_WIDTH - indent);

    for (const line of lines) {
      ensureSpace(size + 4);
      ctx.page.drawText(line, {
        x: MARGIN + indent,
        y: ctx.y,
        size,
        font: usedFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      ctx.y -= LINE_HEIGHT;
    }
  };

  const section = (title: string) => {
    ctx.y -= 6;
    drawText(title, { size: 12, bold: true });
    ctx.y -= 2;
  };

  const subSection = (title: string) => {
    ctx.y -= 4;
    drawText(title, { size: 10, bold: true });
  };

  const blank = (n = 1) => {
    ctx.y -= LINE_HEIGHT * n;
  };

  const drawCheckboxLine = (label: string, checked: boolean, otherText?: string) => {
    const box = checked ? '[X]' : '[ ]';
    const suffix = otherText ? `: ${otherText}` : '';
    drawText(`${box} ${label}${suffix}`, { indent: 12 });
  };

  const drawField = (label: string, value: string) => {
    drawText(`${label}: ${value || '—'}`);
  };

  const agreementDate = formatAgreementDate(metadata.generatedAt);
  const duration = computeLeaseDuration(data.terms.startDate, data.terms.endDate);
  const advanceRent = data.terms.advanceRent ?? 0;
  const totalInitial = data.terms.deposit + advanceRent;
  const occupants = data.terms.authorizedOccupants ?? ['', '', ''];
  const paymentMethods = data.terms.paymentMethods ?? [];
  const tenantUtilities = data.terms.tenantUtilities ?? [];

  // Header
  drawText('RESIDENTIAL RENTAL AGREEMENT', { size: 16, bold: true });
  blank();
  drawText(
    `This Residential Rental Agreement ("Agreement") is made and entered into on ${agreementDate} by and between:`,
  );
  blank();

  // I. PARTIES
  section('I. PARTIES');
  subSection('LESSOR (Property Owner/Landlord)');
  drawField('Name', data.lessor.name);
  drawField('Address', data.lessor.address ?? '');
  drawField('Contact Number', data.lessor.phone);
  drawField('Email Address', data.lessor.email);
  blank();
  subSection('LESSEE (Tenant)');
  drawField('Name', data.lessee.name);
  drawField('Date of Birth', data.lessee.dateOfBirth ? formatDate(data.lessee.dateOfBirth) : '');
  drawField('Civil Status', data.lessee.civilStatus ?? '');
  drawField('Nationality', data.lessee.nationality ?? '');
  drawField('Current Address', data.lessee.address ?? '');
  drawField('Contact Number', data.lessee.phone);
  drawField('Email Address', data.lessee.email);
  drawField('Emergency Contact', data.lessee.emergencyContactName ?? '');
  drawField('Emergency Contact Number', data.lessee.emergencyContactPhone ?? '');
  blank();

  // II. RENTAL PROPERTY
  section('II. RENTAL PROPERTY');
  drawField('Property Name', data.property.propertyName);
  drawText('Property Type:', { bold: true });
  for (const [key, label] of Object.entries(PROPERTY_TYPE_LABELS)) {
    drawCheckboxLine(label, data.property.propertyType === (key as PropertyType));
  }
  drawField('Unit/Room Number', data.property.unitNumber);
  drawText('Complete Address:', { bold: true });
  drawText(data.property.address);
  blank();

  // III. RENTAL PERIOD
  section('III. RENTAL PERIOD');
  drawField('Start Date', formatDate(data.terms.startDate));
  drawField('End Date', formatDate(data.terms.endDate));
  drawField('Lease Duration', duration);
  drawText('Renewable:', { bold: true });
  drawCheckboxLine('Yes', data.terms.renewable === true, undefined);
  drawCheckboxLine('No', data.terms.renewable === false, undefined);
  blank();

  // IV. RENTAL FEES
  section('IV. RENTAL FEES');
  drawText(`Monthly Rental: ${money(data.terms.rent)}`, { bold: true });
  drawText(`Security Deposit: ${money(data.terms.deposit)}`, { bold: true });
  drawText(`Advance Rental: ${money(advanceRent)}`, { bold: true });
  drawText(`Total Initial Payment: ${money(totalInitial)}`, { bold: true });
  drawField('Payment Due Date', `${data.terms.paymentDueDay} of each month`);
  drawText('Accepted Payment Methods:', { bold: true });
  for (const [key, label] of Object.entries(PAYMENT_METHOD_LABELS)) {
    const method = key as LeasePaymentMethod;
    const isOther = method === 'other';
    drawCheckboxLine(
      label,
      paymentMethods.includes(method),
      isOther ? data.terms.paymentMethodsOther : undefined,
    );
  }
  drawText('Late payments may incur penalties as agreed upon by both parties.');
  blank();

  // V. UTILITIES
  section('V. UTILITIES');
  drawText('The Lessee shall be responsible for the payment of:');
  for (const [key, label] of Object.entries(TENANT_UTILITY_LABELS)) {
    const utility = key as TenantUtility;
    const isOther = utility === 'other';
    drawCheckboxLine(
      label,
      tenantUtilities.includes(utility),
      isOther ? data.terms.utilitiesOther : undefined,
    );
  }
  drawText('Utility billing arrangement:');
  if (data.terms.utilityBillingNotes) {
    drawText(data.terms.utilityBillingNotes, { indent: 12 });
  } else {
    drawText('—', { indent: 12 });
  }
  blank();

  // VI. OCCUPANCY
  section('VI. OCCUPANCY');
  drawField('Maximum Number of Occupants', String(data.terms.maxOccupants ?? '—'));
  drawText('Authorized Occupants:');
  for (let i = 0; i < 3; i++) {
    drawText(`${i + 1}. ${occupants[i]?.trim() || '—'}`, { indent: 12 });
  }
  drawText(
    'Subleasing or allowing unauthorized occupants is prohibited unless approved in writing by the Lessor.',
  );
  blank();

  // VII. HOUSE RULES
  section('VII. HOUSE RULES');
  drawText(
    'The Lessee agrees to comply with all house rules established by the property owner or property management, including but not limited to:',
  );
  const houseRules = [
    'Maintaining cleanliness of the rented premises.',
    'Keeping noise at reasonable levels.',
    'Respecting neighboring tenants.',
    'No illegal activities within the premises.',
    'No property modifications without written approval.',
    'Compliance with visitor and curfew policies, if applicable.',
  ];
  for (const rule of houseRules) {
    drawText(`- ${rule}`, { indent: 12 });
  }
  drawText('Failure to comply may constitute grounds for termination of this Agreement.');
  blank();

  // VIII. MAINTENANCE AND DAMAGES
  section('VIII. MAINTENANCE AND DAMAGES');
  drawText('The Lessee shall keep the rented premises clean and in good condition.');
  drawText(
    'Any damages caused by negligence or misuse shall be repaired or paid for by the Lessee.',
  );
  drawText('Normal wear and tear shall not be charged to the Lessee.');
  blank();

  // IX. TERMINATION
  section('IX. TERMINATION');
  drawText(
    'Either party may terminate this Agreement subject to the agreed notice period.',
  );
  drawText('Upon termination, the Lessee shall:');
  const terminationItems = [
    'Vacate the property.',
    'Return all keys or access devices.',
    'Settle all unpaid obligations.',
    'Allow inspection of the premises.',
  ];
  for (const item of terminationItems) {
    drawText(`- ${item}`, { indent: 12 });
  }
  drawText(
    'The security deposit shall be refunded after deducting unpaid bills, damages, or other lawful deductions.',
  );
  blank();

  // X. GOVERNING LAW
  section('X. GOVERNING LAW');
  drawText(
    'This Agreement shall be governed by the laws of the Republic of the Philippines.',
  );
  blank();

  // XI. ENTIRE AGREEMENT
  section('XI. ENTIRE AGREEMENT');
  drawText(
    'This Agreement constitutes the entire understanding between the Lessor and the Lessee.',
  );
  drawText(
    'Any amendments shall be valid only if made in writing and signed by both parties.',
  );
  blank();

  // SIGNATURES
  section('SIGNATURES');
  drawText(
    'The parties acknowledge that they have read, understood, and agreed to all terms and conditions stated in this Agreement.',
  );
  blank(2);
  subSection('LESSOR');
  drawText('Name: ___________________________');
  drawText('Signature: _______________________');
  drawText('Date: ___________________________');
  blank(2);
  subSection('LESSEE');
  drawText('Name: ___________________________');
  drawText('Signature: _______________________');
  drawText('Date: ___________________________');
  blank();

  // WITNESSES
  section('WITNESSES');
  subSection('Witness 1');
  drawText('Name: ___________________________');
  drawText('Signature: _______________________');
  blank();
  subSection('Witness 2');
  drawText('Name: ___________________________');
  drawText('Signature: _______________________');
  blank();

  // PROPERTY TURNOVER CHECKLIST
  section('PROPERTY TURNOVER CHECKLIST');
  drawText('Keys Received:');
  const keys = ['Main Door Key', 'Room Key', 'Gate Key', 'Mailbox Key', 'Access Card'];
  for (const key of keys) {
    drawCheckboxLine(key, false);
  }
  drawText('Condition of Unit:');
  for (const cond of ['Excellent', 'Good', 'Needs Repair']) {
    drawCheckboxLine(cond, false);
  }
  drawText('Remarks:');
  drawText('_______________________________________________');
  blank(2);

  // SYSTEM INFORMATION
  section('SYSTEM INFORMATION');
  drawField('Rental Agreement No.', metadata.leaseId);
  drawField('Property ID', metadata.propertyId);
  drawField('Tenant ID', metadata.tenantId);
  drawField('Generated On', formatGeneratedTimestamp(metadata.generatedAt));

  return pdfDoc.save({ useObjectStreams: true });
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, size: number) => number },
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}
