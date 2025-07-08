import PDFDocument from 'pdfkit';
import { QuoteData } from '@/types/quote';

export interface PDFGenerationOptions {
  companyName?: string;
  companyAddress?: string[];
  companyPhone?: string;
  companyEmail?: string;
  companyABN?: string;
  logoUrl?: string;
}

const DEFAULT_OPTIONS: PDFGenerationOptions = {
  companyName: "G'dAI Mate Property Services",
  companyAddress: [
    "123 Property Lane",
    "Sydney NSW 2000",
    "Australia"
  ],
  companyPhone: "+61 2 1234 5678",
  companyEmail: "quotes@gdaimate.com",
  companyABN: "12 345 678 901",
};

export const generateQuotePDF = async (
  quote: QuoteData,
  options: PDFGenerationOptions = {}
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      generateHeader(doc, opts, quote);
      
      // Client information
      generateClientInfo(doc, quote);
      
      // Property details
      generatePropertyDetails(doc, quote);
      
      // Services table
      generateServicesTable(doc, quote);
      
      // Totals
      generateTotals(doc, quote);
      
      // Terms and footer
      generateTermsAndFooter(doc, quote);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

function generateHeader(doc: PDFKit.PDFDocument, options: PDFGenerationOptions, quote: QuoteData) {
  // Company name
  doc.fontSize(24)
     .fillColor('#2c3e50')
     .text(options.companyName!, 50, 50);

  // Quote title and number
  doc.fontSize(18)
     .fillColor('#34495e')
     .text('QUOTE', 400, 50)
     .fontSize(12)
     .text(`Quote #: ${quote.id}`, 400, 75)
     .text(`Date: ${new Date(quote.createdAt).toLocaleDateString('en-AU')}`, 400, 90)
     .text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString('en-AU')}`, 400, 105);

  // Company details
  doc.fontSize(10)
     .fillColor('#7f8c8d');
  
  let yPos = 75;
  options.companyAddress?.forEach(line => {
    doc.text(line, 50, yPos);
    yPos += 12;
  });

  if (options.companyPhone) {
    doc.text(`Phone: ${options.companyPhone}`, 50, yPos);
    yPos += 12;
  }

  if (options.companyEmail) {
    doc.text(`Email: ${options.companyEmail}`, 50, yPos);
    yPos += 12;
  }

  if (options.companyABN) {
    doc.text(`ABN: ${options.companyABN}`, 50, yPos);
  }

  // Horizontal line
  doc.strokeColor('#bdc3c7')
     .lineWidth(1)
     .moveTo(50, 150)
     .lineTo(550, 150)
     .stroke();
}

function generateClientInfo(doc: PDFKit.PDFDocument, quote: QuoteData) {
  doc.fontSize(14)
     .fillColor('#2c3e50')
     .text('QUOTE FOR:', 50, 170);

  doc.fontSize(12)
     .fillColor('#34495e')
     .text(quote.clientName, 50, 190);

  if (quote.clientEmail) {
    doc.text(`Email: ${quote.clientEmail}`, 50, 205);
  }

  if (quote.clientPhone) {
    doc.text(`Phone: ${quote.clientPhone}`, 50, 220);
  }
}

function generatePropertyDetails(doc: PDFKit.PDFDocument, quote: QuoteData) {
  const startY = 250;
  
  doc.fontSize(14)
     .fillColor('#2c3e50')
     .text('PROPERTY DETAILS:', 50, startY);

  doc.fontSize(12)
     .fillColor('#34495e')
     .text(`Address: ${quote.property.address}`, 50, startY + 20)
     .text(`Type: ${quote.property.propertyType}`, 50, startY + 35)
     .text(`Condition: ${quote.property.condition}`, 50, startY + 50);

  let detailsY = startY + 65;
  if (quote.property.size?.squareMeters) {
    doc.text(`Size: ${quote.property.size.squareMeters}m²`, 50, detailsY);
    detailsY += 15;
  }

  if (quote.property.size?.bedrooms) {
    doc.text(`Bedrooms: ${quote.property.size.bedrooms}`, 200, startY + 65);
  }

  if (quote.property.size?.bathrooms) {
    doc.text(`Bathrooms: ${quote.property.size.bathrooms}`, 300, startY + 65);
  }

  return detailsY + 20;
}

function generateServicesTable(doc: PDFKit.PDFDocument, quote: QuoteData) {
  const tableTop = 360;
  const tableLeft = 50;
  
  // Table header
  doc.fontSize(12)
     .fillColor('#2c3e50');

  const headers = ['Description', 'Qty', 'Unit', 'Rate', 'Amount'];
  const columnWidths = [250, 50, 60, 80, 80];
  const columnPositions = [tableLeft];
  
  for (let i = 1; i < columnWidths.length; i++) {
    columnPositions.push(columnPositions[i - 1] + columnWidths[i - 1]);
  }

  // Draw header
  headers.forEach((header, i) => {
    doc.text(header, columnPositions[i], tableTop, { width: columnWidths[i] });
  });

  // Header line
  doc.strokeColor('#bdc3c7')
     .lineWidth(1)
     .moveTo(tableLeft, tableTop + 20)
     .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), tableTop + 20)
     .stroke();

  // Table rows
  let currentY = tableTop + 30;
  doc.fontSize(10)
     .fillColor('#34495e');

  quote.services.forEach((service, index) => {
    if (currentY > 700) { // Start new page if needed
      doc.addPage();
      currentY = 50;
    }

    const rowData = [
      service.description,
      service.quantity.toString(),
      service.unit,
      `$${service.unitPrice.toFixed(2)}`,
      `$${service.totalPrice.toFixed(2)}`
    ];

    rowData.forEach((data, i) => {
      doc.text(data, columnPositions[i], currentY, { 
        width: columnWidths[i],
        align: i > 0 ? 'right' : 'left'
      });
    });

    if (service.notes) {
      currentY += 15;
      doc.fontSize(8)
         .fillColor('#7f8c8d')
         .text(`Note: ${service.notes}`, columnPositions[0], currentY, { width: 400 });
      doc.fontSize(10)
         .fillColor('#34495e');
    }

    currentY += 25;
  });

  return currentY;
}

function generateTotals(doc: PDFKit.PDFDocument, quote: QuoteData) {
  const totalsX = 420;
  let currentY = doc.y + 20;

  doc.fontSize(12)
     .fillColor('#34495e');

  // Subtotal
  doc.text('Subtotal:', totalsX, currentY)
     .text(`$${quote.subtotal.toFixed(2)}`, totalsX + 80, currentY, { align: 'right', width: 80 });
  
  currentY += 20;

  // GST
  doc.text('GST (10%):', totalsX, currentY)
     .text(`$${quote.gst.toFixed(2)}`, totalsX + 80, currentY, { align: 'right', width: 80 });
  
  currentY += 20;

  // Line above total
  doc.strokeColor('#bdc3c7')
     .lineWidth(1)
     .moveTo(totalsX, currentY)
     .lineTo(totalsX + 160, currentY)
     .stroke();

  currentY += 10;

  // Total
  doc.fontSize(14)
     .fillColor('#2c3e50')
     .text('TOTAL:', totalsX, currentY)
     .text(`$${quote.total.toFixed(2)}`, totalsX + 80, currentY, { align: 'right', width: 80 });
}

function generateTermsAndFooter(doc: PDFKit.PDFDocument, quote: QuoteData) {
  const footerY = 650;
  
  doc.fontSize(10)
     .fillColor('#7f8c8d')
     .text('Terms & Conditions:', 50, footerY)
     .text('• Quote valid for 30 days from date of issue', 50, footerY + 15)
     .text('• 50% deposit required before commencement', 50, footerY + 30)
     .text('• Final payment due within 7 days of completion', 50, footerY + 45)
     .text('• All prices include GST', 50, footerY + 60);

  if (quote.notes) {
    doc.fontSize(10)
       .fillColor('#34495e')
       .text('Additional Notes:', 50, footerY + 85)
       .text(quote.notes, 50, footerY + 100, { width: 500 });
  }

  // Footer
  doc.fontSize(8)
     .fillColor('#95a5a6')
     .text('This quote was generated by G\'dAI Mate - AI-powered property assessment', 50, 750, {
       align: 'center',
       width: 500
     });
}