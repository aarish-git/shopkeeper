import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getLineAmount = (line, key) => Number(line[key] || 0) * Number(line.quantity || 0);

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export const generatePdfBill = (soldLines, totals) => {
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text('Shopkeeper Sales Bill', 14, 18);

  autoTable(pdf, {
    startY: 26,
    head: [['Product', 'Size', 'Qty', 'Cost Price', 'Selling Price', 'Cost Total', 'Selling Total', 'Sold At']],
    body: soldLines.map((line) => {
      const lineCost = getLineAmount(line, 'costPrice');
      const lineSelling = getLineAmount(line, 'sellingPrice');
      return [
        line.name,
        line.size || '-',
        line.quantity,
        formatCurrency(line.costPrice),
        formatCurrency(line.sellingPrice),
        formatCurrency(lineCost),
        formatCurrency(lineSelling),
        new Date(line.soldAt).toLocaleString(),
      ];
    }),
  });

  const summaryY = pdf.lastAutoTable.finalY + 12;
  pdf.text(`Total Cost Price: ${formatCurrency(totals.totalCost)}`, 14, summaryY);
  pdf.text(`Total Selling Price: ${formatCurrency(totals.totalSelling)}`, 14, summaryY + 8);
  pdf.text(`Total Profit: ${formatCurrency(totals.totalProfit)}`, 14, summaryY + 16);
  pdf.save('sales-bill.pdf');
};

export const generateWordBill = (soldLines, totals) => {
  const rows = soldLines
    .map((line) => {
      const lineCost = getLineAmount(line, 'costPrice');
      const lineSelling = getLineAmount(line, 'sellingPrice');
      return `${line.name}\t${line.size || '-'}\t${line.quantity}\t${line.costPrice}\t${line.sellingPrice}\t${lineCost}\t${lineSelling}\t${new Date(line.soldAt).toLocaleString()}`;
    })
    .join('\n');

  const content = [
    'Shopkeeper Sales Bill',
    '',
    'Product\tSize\tQty\tCost Price\tSelling Price\tCost Total\tSelling Total\tSold At',
    rows,
    '',
    `Total Cost Price: ${totals.totalCost.toFixed(2)}`,
    `Total Selling Price: ${totals.totalSelling.toFixed(2)}`,
    `Total Profit: ${totals.totalProfit.toFixed(2)}`,
  ].join('\n');

  const blob = new Blob([content], { type: 'application/msword' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = 'sales-bill.doc';
  link.click();
  URL.revokeObjectURL(objectUrl);
};
