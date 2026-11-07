import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (order) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Colors
  const greenColor = [46, 125, 50]; // #2e7d32
  const darkSlate = [30, 41, 59];   // #1e293b

  // Brand Header
  doc.setFillColor(...greenColor);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FreshFarm', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Online Vegetable Marketplace & Delivery System', 14, 25);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 160, 20);

  // Order & Customer Details Box
  doc.setTextColor(...darkSlate);
  doc.setFontSize(10);
  
  // Left Column - Customer Details
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer Name: ${order.customer_name || 'Customer'}`, 14, 48);
  doc.text(`Phone: ${order.customer_phone || 'N/A'}`, 14, 54);
  doc.text(`Delivery Address: ${order.delivery_address || 'N/A'}`, 14, 60, { maxWidth: 90 });

  // Right Column - Invoice Info
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', 120, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: #FF-ORD-${order.order_id}`, 120, 48);
  doc.text(`Date: ${new Date(order.order_date).toLocaleDateString('en-IN')}`, 120, 54);
  doc.text(`Payment Method: ${order.payment_method}`, 120, 60);
  doc.text(`Status: ${order.status}`, 120, 66);

  // Line Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 75, 196, 75);

  // Prepare Items Table
  const tableData = (order.items || []).map((item, index) => {
    const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : 'kg');
    const val = item.quantity_value !== undefined ? item.quantity_value : item.quantity;
    const lineTotal = item.quantity_unit === 'g'
      ? (parseFloat(item.price) * parseFloat(val)) / 1000
      : parseFloat(item.price) * parseFloat(val);

    return [
      index + 1,
      item.vegetable_name,
      item.category || 'General',
      item.farmer_name || 'Local Farmer',
      item.surplus_listing_id
        ? `Rescue Rs. ${parseFloat(item.price).toFixed(2)} (usual ${parseFloat(item.original_price).toFixed(2)})/${unit === 'piece' ? 'pc' : 'kg'}`
        : `Rs. ${parseFloat(item.price).toFixed(2)}/${unit === 'piece' ? 'pc' : 'kg'}`,
      `${val} ${unit === 'piece' ? (val > 1 ? 'pcs' : 'pc') : unit}`,
      `Rs. ${lineTotal.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: 80,
    head: [['#', 'Vegetable Name', 'Category', 'Farmer', 'Price/Unit', 'Qty', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: greenColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: darkSlate
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Calculate Summary
  const finalY = doc.lastAutoTable.finalY + 10;
  const itemsSubtotal = (order.items || []).reduce((acc, curr) => {
    const val = curr.quantity_value !== undefined ? curr.quantity_value : curr.quantity;
    const line = curr.quantity_unit === 'g'
      ? (parseFloat(curr.price) * parseFloat(val)) / 1000
      : parseFloat(curr.price) * parseFloat(val);
    return acc + line;
  }, 0);
  const gst = 0;
  const deliveryCharge = itemsSubtotal < 199 ? 15 : 0;
  const grandTotal = order.total_amount || (itemsSubtotal + gst + deliveryCharge);

  // Right-aligned Summary Box
  const summaryX = 130;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, summaryX, finalY);
  doc.text(`Rs. ${itemsSubtotal.toFixed(2)}`, 196, finalY, { align: 'right' });

  doc.text(`GST (0%):`, summaryX, finalY + 6);
  doc.text(`Rs. ${gst.toFixed(2)}`, 196, finalY + 6, { align: 'right' });

  doc.text(`Delivery Charge:`, summaryX, finalY + 12);
  doc.text(deliveryCharge === 0 ? 'FREE' : `Rs. ${deliveryCharge.toFixed(2)}`, 196, finalY + 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...greenColor);
  doc.text(`Grand Total:`, summaryX, finalY + 20);
  doc.text(`Rs. ${parseFloat(grandTotal).toFixed(2)}`, 196, finalY + 20, { align: 'right' });

  // Footer Message
  const footerY = 270;
  doc.setDrawColor(46, 125, 50);
  doc.setLineWidth(0.8);
  doc.line(14, footerY - 5, 196, footerY - 5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...greenColor);
  doc.text('Thank you for buying directly from local farmers with FreshFarm!', 105, footerY, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('FreshFarm Marketplace - VIT Pune Computer Engineering Mini Project', 105, footerY + 5, { align: 'center' });

  // Save PDF file
  doc.save(`FreshFarm_Invoice_ORD_${order.order_id}.pdf`);
};
