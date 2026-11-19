import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '@/types/billing';

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
const teal: [number, number, number] = [0, 125, 133];
const dark: [number, number, number] = [23, 49, 57];
const grey: [number, number, number] = [103, 115, 118];
const cream: [number, number, number] = [239, 247, 244];
const money = (amount: number) => 'KES ' + Number(amount || 0).toLocaleString('en-KE', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const dateString = (date: string) => {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};
function safe(value: string | undefined, placeholder = '—') {
  return value?.trim() || placeholder;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { invoice } = data;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftWidth = 66;
  const x = leftWidth + 9;
  const right = pageWidth - 9;
  const mainWidth = right - x;
  const company = safe(invoice.invoiceDisplayName || data.propertyName);
  const details = invoice.lines?.length
    ? invoice.lines.map(line => [line.description, money(line.amount)])
    : [[invoice.description || invoice.type.toUpperCase() + ' charge', money(invoice.amount)]];
  const prior = Number(invoice.priorBalanceAtIssue || 0);
  const chargeAmount = Number(invoice.amount || 0);
  const paid = Number(invoice.amountPaid || 0);
  const accountAtIssue = prior + chargeAmount;
  const invoiceBalance = Number(invoice.balance || 0);
  const billingPeriod = invoice.billingYear && invoice.billingMonth
    ? new Date(invoice.billingYear, invoice.billingMonth - 1, 1)
        .toLocaleDateString('en-GB', {month:'short', year:'numeric'}).toUpperCase()
    : dateString(invoice.dueDate).toUpperCase();

  doc.setFillColor(...cream); doc.rect(0,0,leftWidth,pageHeight,'F');
  doc.setFillColor(255,255,255); doc.rect(leftWidth,0,pageWidth-leftWidth,pageHeight,'F');
  doc.setFillColor(30,192,164); doc.rect(x,8,mainWidth,2.5,'F');

  // Left information rail, adapted from the supplied H&R Apartment invoice.
  doc.setFillColor(203,169,112);doc.roundedRect(10,17,22,6,2,2,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
  doc.text('LIVE BILLING',12,21);
  doc.setTextColor(...teal);doc.setFontSize(16);doc.text(doc.splitTextToSize(company.toUpperCase(),48),10,35);
  doc.setFontSize(10);doc.setTextColor(195,157,99);doc.text('RENT INVOICE',10,52);
  doc.setTextColor(...grey);doc.setFont('helvetica','normal');doc.setFontSize(7);
  doc.text(doc.splitTextToSize('Validated tenant billing for rent, water, arrears and payments.',48),10,59);
  const leftField=(label:string,value:string,y:number) => {
    doc.setFillColor(255,255,255);doc.roundedRect(9,y,49,15,1.3,1.3,'F');
    doc.setTextColor(...grey);doc.setFont('helvetica','bold');doc.setFontSize(6);
    doc.text(label.toUpperCase(),11,y+5);
    doc.setTextColor(...teal);doc.setFontSize(9);
    doc.text(doc.splitTextToSize(value,44).slice(0,2),11,y+11);
  };
  leftField('Billing period',billingPeriod,83);
  leftField('Unit',data.unitNumber,101);
  leftField('Status',invoice.status.toUpperCase(),119);
  leftField('Account total at issue',money(accountAtIssue),137);
  leftField('Amount due on this invoice',money(invoiceBalance),155);
  leftField('Due date',dateString(invoice.dueDate),173);
  doc.setFontSize(7);doc.setTextColor(...grey);doc.text('ACCOUNT SUPPORT',10,202);
  doc.setFont('helvetica','normal');
  doc.text(doc.splitTextToSize(
    safe(invoice.paymentSupportContact || data.landlordEmail, 'Contact property management'),48),10,210);
  doc.text(doc.splitTextToSize('For billing or payment queries, contact property management.',48),10,223);

  doc.setTextColor(...teal);doc.setFont('helvetica','bold');doc.setFontSize(14);
  doc.text('RENT INVOICE',x,20);
  doc.setFont('helvetica','normal');doc.setTextColor(...grey);doc.setFontSize(7.5);
  doc.text('Unit '+safe(data.unitNumber),x,26);
  const metaX=pageWidth-53;
  doc.setFontSize(7);doc.setTextColor(...dark);
  doc.text('Invoice No: '+invoice.invoiceNumber,metaX,16,{maxWidth:45});
  doc.text('Invoice Date: '+dateString(invoice.issuedDate || invoice.createdAt),metaX,22,{maxWidth:45});
  doc.text('Due Date: '+dateString(invoice.dueDate),metaX,28,{maxWidth:45});
  doc.text('Billing Period: '+billingPeriod,metaX,34,{maxWidth:45});

  const info=(label:string,value:string,left:number,y:number,width:number) => {
    doc.setFillColor(245,247,247);doc.roundedRect(left,y,width,16,1,1,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(6);doc.setTextColor(...grey);
    doc.text(label.toUpperCase(),left+2,y+4);
    doc.setFontSize(8);doc.setTextColor(...dark);
    doc.text(doc.splitTextToSize(value,width-5).slice(0,2),left+2,y+10);
  };
  const col=(mainWidth-2)/2;
  info('Tenant',safe(data.tenantName),x,39,col);
  info('Property / Unit',safe(data.propertyName)+' / '+data.unitNumber,x+col+2,39,col);
  info('Tenant Email',safe(invoice.tenantEmail || data.tenantEmail),x,57,col);
  info('Status',invoice.status.toUpperCase(),x+col+2,57,col);

  doc.setFillColor(239,249,246);doc.roundedRect(x,78,mainWidth,14,1.5,1.5,'F');
  doc.setTextColor(...grey);doc.setFontSize(7.5);doc.text('TOTAL DUE AT ISSUE',x+3,87);
  doc.setTextColor(...teal);doc.setFont('helvetica','bold');doc.setFontSize(13);
  doc.text(money(accountAtIssue),right-3,87,{align:'right'});

  const rows = [
    ...(prior>0 ? [['Previous balance / arrears (already invoiced)',money(prior)]] : []),
    ...details,
  ];
  autoTable(doc,{
    startY:98,
    head:[['DESCRIPTION','AMOUNT']],
    body:rows,
    theme:'plain',
    margin:{left:x,right:9},
    tableWidth:mainWidth,
    headStyles:{fillColor:[110,115,117],textColor:[255,255,255],fontStyle:'bold',fontSize:7},
    bodyStyles:{fontSize:8,textColor:dark,cellPadding:2.1},
    columnStyles:{0:{cellWidth:mainWidth*0.68},1:{halign:'right',cellWidth:mainWidth*0.32}},
  });
  const tableY=(doc as jsPDF & {lastAutoTable?:{finalY:number}}).lastAutoTable?.finalY ?? 128;
  let y=Math.max(139,tableY+5);
  // The previous balance is informational only and is NOT included in invoice.amount;
  // accounting keeps the old unpaid invoices outstanding for accurate allocation.
  const summary=(label:string,val:string,bold=false) => {
    doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(bold?9:7.5);
    doc.setTextColor(...(bold?teal:dark));
    doc.text(label,x+mainWidth*0.47,y);
    doc.text(val,right-2,y,{align:'right'});
    y+=6.2;
  };
  summary('New charges',money(chargeAmount));
  summary('Previous outstanding at issue',money(prior));
  summary('Account total at issue',money(accountAtIssue));
  summary('Paid against this invoice',money(paid));
  summary('New invoice balance',money(invoiceBalance),true);

  const reading=invoice.waterReading;
  if(reading && y<214) {
    y+=5;
    doc.setTextColor(...teal);doc.setFont('helvetica','bold');doc.setFontSize(8);
    doc.text('WATER DETAILS',x,y);
    y+=5;
    info('Previous',String(reading.previousReading),x,y,mainWidth/3-1);
    info('Current',String(reading.currentReading),x+mainWidth/3,y,mainWidth/3-1);
    info('Consumption',String(reading.consumption),x+2*mainWidth/3,y,mainWidth/3-1);
    y+=20;
  }
  if(y>246) { doc.addPage(); y=25; }
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(...teal);
  doc.text('PAYMENT DETAILS',x,y);
  y+=5;
  info('Payment Method',safe(invoice.paymentMethodLabel,'Contact landlord'),x,y,col);
  info('Paybill / Business Number',safe(invoice.paybillNumber),x+col+2,y,col);
  y+=19;
  info('Account Reference',safe(invoice.paymentAccountReference,invoice.unitNumber),x,y,col);
  info('New invoice balance',money(invoiceBalance),x+col+2,y,col);
  y+=20;
  doc.setTextColor(...grey);doc.setFont('helvetica','normal');doc.setFontSize(7);
  doc.text(doc.splitTextToSize(
    safe(invoice.paymentInstructions,'Please include the invoice number when paying.'),mainWidth),x,y);
  doc.setDrawColor(228,235,232);doc.line(x,pageHeight-22,right,pageHeight-22);
  doc.setFontSize(6.5);doc.text('Generated from the validated tenant billing record.',x,pageHeight-17);
  return doc;
}
export function downloadInvoicePDF(data: InvoiceData): void {
  generateInvoicePDF(data).save('Invoice-'+data.invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g,'-')+'.pdf');
}
export function getInvoicePDFBlob(data: InvoiceData): Blob {
  return generateInvoicePDF(data).output('blob');
}
