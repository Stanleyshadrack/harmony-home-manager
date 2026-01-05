import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SubscriptionPayment } from '@/types/subscription';

export function generateSubscriptionReceiptPDF(payment: SubscriptionPayment): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [99, 102, 241]; // Indigo
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];
  const successColor: [number, number, number] = [34, 197, 94];

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Receipt title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SUBSCRIPTION RECEIPT', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt #: ${payment.transactionRef}`, 20, 38);
  doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 20, 46);

  // Status badge
  doc.setFillColor(...successColor);
  doc.roundedRect(pageWidth - 70, 18, 50, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', pageWidth - 45, 30, { align: 'center' });

  // Reset text color
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');

  // Customer info
  let yPos = 75;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('BILLED TO', 20, yPos);
  
  yPos += 8;
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.landlordName, 20, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.landlordEmail, 20, yPos);

  // Company info (right side)
  yPos = 75;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('FROM', pageWidth - 80, yPos);
  
  yPos += 8;
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Rentify Platform', pageWidth - 80, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('support@rentify.com', pageWidth - 80, yPos);

  // Line separator
  yPos = 110;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Subscription details table
  yPos = 120;

  const paymentMethodLabels: Record<string, string> = {
    card: `Credit Card ${payment.cardLast4 ? `(**** ${payment.cardLast4})` : ''}`,
    mpesa: 'M-PESA',
    bank: 'Bank Transfer',
  };

  const tableData = [
    ['Subscription Plan', payment.planName],
    ['Renewal Period', payment.renewalPeriod],
    ['Previous Expiry', new Date(payment.previousExpiryDate).toLocaleDateString()],
    ['New Expiry Date', new Date(payment.newExpiryDate).toLocaleDateString()],
    ['Payment Method', paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod],
    ['Transaction ID', payment.transactionRef],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Details']],
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
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 80;

  // Amount box
  yPos = finalY + 15;
  
  // Purple background for amount
  doc.setFillColor(238, 242, 255); // Light indigo background
  doc.roundedRect(20, yPos - 5, pageWidth - 40, 40, 3, 3, 'F');
  
  // Amount label
  doc.setFontSize(12);
  doc.setTextColor(...mutedColor);
  doc.text('TOTAL AMOUNT PAID', 30, yPos + 10);
  
  // Amount value
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`$${payment.amount.toLocaleString()}`, 30, yPos + 30);

  // Thank you message
  yPos = finalY + 70;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.text('Thank you for your subscription!', pageWidth / 2, yPos, { align: 'center' });

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('This is an official subscription payment receipt.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text('For questions, contact support@rentify.com', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}

export function downloadSubscriptionReceiptPDF(payment: SubscriptionPayment): void {
  const doc = generateSubscriptionReceiptPDF(payment);
  doc.save(`Subscription-Receipt-${payment.transactionRef}.pdf`);
}

export function getSubscriptionReceiptPDFBlob(payment: SubscriptionPayment): Blob {
  const doc = generateSubscriptionReceiptPDF(payment);
  return doc.output('blob');
}
