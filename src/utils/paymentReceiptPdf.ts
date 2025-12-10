import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payment, Invoice } from '@/types/billing';

interface PaymentReceiptData {
  payment: Payment;
  invoice: Invoice;
  propertyName: string;
  propertyAddress: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
}

export function generatePaymentReceiptPDF(data: PaymentReceiptData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [34, 197, 94]; // Green for receipt
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Receipt title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt #: ${data.payment.id.toUpperCase()}`, 20, 35);
  doc.text(`Date: ${new Date(data.payment.paymentDate).toLocaleDateString()}`, 20, 42);

  // Checkmark icon area
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth - 35, 25, 12, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(18);
  doc.text('✓', pageWidth - 39, 30);

  // Reset text color
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');

  // From section (Property/Landlord)
  let yPos = 65;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('RECEIVED BY', 20, yPos);
  
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

  // Tenant section
  yPos = 65;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('RECEIVED FROM', pageWidth / 2, yPos);
  
  yPos += 8;
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.payment.tenantName, pageWidth / 2, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Unit ${data.invoice.unitNumber}`, pageWidth / 2, yPos);

  // Line separator
  yPos = 115;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Payment details table
  yPos = 125;
  
  const paymentMethodLabels: Record<string, string> = {
    mpesa: 'M-PESA',
    card: 'Credit/Debit Card',
    bank: 'Bank Transfer',
    cash: 'Cash',
  };

  const tableData = [
    ['Invoice Number', data.invoice.invoiceNumber],
    ['Description', data.invoice.description],
    ['Payment Method', paymentMethodLabels[data.payment.paymentMethod] || data.payment.paymentMethod],
    ['Transaction Reference', data.payment.transactionRef],
    ['Payment Date', new Date(data.payment.paymentDate).toLocaleDateString()],
  ];

  if (data.payment.notes) {
    tableData.push(['Notes', data.payment.notes]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Detail', 'Value']],
    body: tableData,
    theme: 'striped',
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
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 110 },
    },
    margin: { left: 20, right: 20 },
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 60;

  // Amount box
  yPos = finalY + 15;
  
  // Green background for amount
  doc.setFillColor(240, 253, 244); // Light green background
  doc.roundedRect(20, yPos - 5, pageWidth - 40, 35, 3, 3, 'F');
  
  // Amount label
  doc.setFontSize(12);
  doc.setTextColor(...mutedColor);
  doc.text('AMOUNT PAID', 30, yPos + 8);
  
  // Amount value
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`KES ${data.payment.amount.toLocaleString()}`, 30, yPos + 25);

  // Invoice balance info
  yPos = finalY + 60;
  const newBalance = data.invoice.balance - data.payment.amount;
  const balanceText = newBalance <= 0 ? 'PAID IN FULL' : `Remaining Balance: KES ${Math.max(0, newBalance).toLocaleString()}`;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(newBalance <= 0 ? primaryColor[0] : 239, newBalance <= 0 ? primaryColor[1] : 68, newBalance <= 0 ? primaryColor[2] : 68);
  doc.text(balanceText, pageWidth / 2, yPos, { align: 'center' });

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 35;
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text('This is an official payment receipt.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text('Please keep this receipt for your records.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}

export function downloadPaymentReceiptPDF(data: PaymentReceiptData): void {
  const doc = generatePaymentReceiptPDF(data);
  doc.save(`Receipt-${data.payment.transactionRef}.pdf`);
}

export function getPaymentReceiptPDFBlob(data: PaymentReceiptData): Blob {
  const doc = generatePaymentReceiptPDF(data);
  return doc.output('blob');
}
