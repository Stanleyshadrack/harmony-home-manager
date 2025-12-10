import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types/billing';

interface InvoiceData {
  invoice: Invoice;
  tenantName: string;
  tenantEmail: string;
  unitNumber: string;
  propertyName: string;
  propertyAddress: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${data.invoice.invoiceNumber}`, 20, 35);

  // Invoice status badge
  const statusColors: Record<string, [number, number, number]> = {
    paid: [34, 197, 94],
    pending: [234, 179, 8],
    overdue: [239, 68, 68],
    partial: [59, 130, 246],
  };
  
  const statusColor = statusColors[data.invoice.status] || mutedColor;
  const statusText = data.invoice.status.toUpperCase();
  const statusWidth = doc.getTextWidth(statusText) + 10;
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 20 - statusWidth, 20, statusWidth, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth - 15 - statusWidth + 5, 27);

  // Reset text color
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');

  // From section (Landlord)
  let yPos = 60;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('FROM', 20, yPos);
  
  yPos += 8;
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.landlordName, 20, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.propertyName, 20, yPos);
  
  yPos += 5;
  doc.text(data.propertyAddress, 20, yPos);
  
  yPos += 5;
  doc.text(data.landlordPhone, 20, yPos);
  
  yPos += 5;
  doc.text(data.landlordEmail, 20, yPos);

  // To section (Tenant)
  yPos = 60;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('BILL TO', pageWidth / 2, yPos);
  
  yPos += 8;
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.tenantName, pageWidth / 2, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Unit ${data.unitNumber}`, pageWidth / 2, yPos);
  
  yPos += 5;
  doc.text(data.tenantEmail, pageWidth / 2, yPos);

  // Invoice details
  yPos = 60;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('INVOICE DATE', pageWidth - 50, yPos, { align: 'right' });
  
  yPos += 6;
  doc.setTextColor(...textColor);
  doc.text(new Date(data.invoice.createdAt).toLocaleDateString(), pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 10;
  doc.setTextColor(...mutedColor);
  doc.text('DUE DATE', pageWidth - 50, yPos, { align: 'right' });
  
  yPos += 6;
  doc.setTextColor(...textColor);
  doc.text(new Date(data.invoice.dueDate).toLocaleDateString(), pageWidth - 20, yPos, { align: 'right' });

  // Line separator
  yPos = 115;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Invoice items table
  yPos = 125;
  
  const invoiceTypeLabels: Record<string, string> = {
    rent: 'Monthly Rent',
    water: 'Water Bill',
    electricity: 'Electricity Bill',
    other: 'Other Charges',
  };

  const tableData = [
    [
      invoiceTypeLabels[data.invoice.type] || data.invoice.type,
      data.invoice.description || `${data.invoice.type} for ${new Date(data.invoice.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      `KES ${data.invoice.amount.toLocaleString()}`,
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Details', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [...mutedColor],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [...textColor],
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 30;

  // Summary section
  yPos = finalY + 15;
  
  const summaryStartX = pageWidth - 80;
  
  // Subtotal
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal:', summaryStartX, yPos);
  doc.setTextColor(...textColor);
  doc.text(`KES ${data.invoice.amount.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
  
  // Amount Paid
  yPos += 8;
  doc.setTextColor(...mutedColor);
  doc.text('Amount Paid:', summaryStartX, yPos);
  doc.setTextColor(34, 197, 94);
  doc.text(`KES ${data.invoice.amountPaid.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
  
  // Balance Due
  yPos += 12;
  doc.setDrawColor(229, 231, 235);
  doc.line(summaryStartX - 10, yPos - 5, pageWidth - 20, yPos - 5);
  
  const balance = data.invoice.amount - data.invoice.amountPaid;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Balance Due:', summaryStartX, yPos + 3);
  doc.setTextColor(balance > 0 ? 239 : 34, balance > 0 ? 68 : 197, balance > 0 ? 68 : 94);
  doc.text(`KES ${balance.toLocaleString()}`, pageWidth - 20, yPos + 3, { align: 'right' });

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your prompt payment.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text('For questions about this invoice, please contact us at the details above.', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(data: InvoiceData): void {
  const doc = generateInvoicePDF(data);
  doc.save(`Invoice-${data.invoice.invoiceNumber}.pdf`);
}

export function getInvoicePDFBlob(data: InvoiceData): Blob {
  const doc = generateInvoicePDF(data);
  return doc.output('blob');
}
