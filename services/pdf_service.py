import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Table, TableStyle,
                                 Paragraph, Spacer, HRFlowable)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from config import Config


def num_to_words(n):
    """Convert number to Indian words (Rupees)."""
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
            'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
            'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
            'Sixty', 'Seventy', 'Eighty', 'Ninety']

    def helper(num):
        if num == 0:
            return ''
        elif num < 20:
            return ones[num] + ' '
        elif num < 100:
            return tens[num // 10] + ' ' + helper(num % 10)
        elif num < 1000:
            return ones[num // 100] + ' Hundred ' + helper(num % 100)
        elif num < 100000:
            return helper(num // 1000) + 'Thousand ' + helper(num % 1000)
        elif num < 10000000:
            return helper(num // 100000) + 'Lakh ' + helper(num % 100000)
        else:
            return helper(num // 10000000) + 'Crore ' + helper(num % 10000000)

    rupees = int(n)
    paise = round((n - rupees) * 100)
    result = helper(rupees).strip()
    if paise > 0:
        result += f' and {helper(paise).strip()} Paise'
    return result + ' Only'


def generate_invoice_pdf(invoice):
    """Generate a GST-compliant Indian invoice PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=15*mm, leftMargin=15*mm,
        topMargin=10*mm, bottomMargin=10*mm
    )

    styles = getSampleStyleSheet()
    primary_color = colors.HexColor('#1a237e')
    accent_color = colors.HexColor('#283593')
    light_bg = colors.HexColor('#e8eaf6')
    table_header_bg = colors.HexColor('#3949ab')

    title_style = ParagraphStyle('title', fontSize=20, textColor=primary_color,
                                  alignment=TA_CENTER, spaceAfter=2, fontName='Helvetica-Bold')
    subtitle_style = ParagraphStyle('subtitle', fontSize=9, textColor=colors.grey,
                                     alignment=TA_CENTER, spaceAfter=2)
    header_style = ParagraphStyle('header', fontSize=10, textColor=primary_color,
                                   fontName='Helvetica-Bold')
    normal_style = ParagraphStyle('normal_small', fontSize=8, leading=12)
    right_style = ParagraphStyle('right', fontSize=9, alignment=TA_RIGHT)
    bold_style = ParagraphStyle('bold', fontSize=9, fontName='Helvetica-Bold')

    story = []

    # ── Company Header ──────────────────────────────────────────────────────────
    company_info = [
        [Paragraph(Config.COMPANY_NAME, title_style)],
        [Paragraph(Config.COMPANY_ADDRESS, subtitle_style)],
        [Paragraph(f'Ph: {Config.COMPANY_PHONE}  |  Email: {Config.COMPANY_EMAIL}', subtitle_style)],
        [Paragraph(f'GSTIN: <b>{Config.GST_NUMBER}</b>', subtitle_style)],
    ]
    header_table = Table(company_info, colWidths=[180*mm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, primary_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4*mm))

    # ── TAX INVOICE title ───────────────────────────────────────────────────────
    inv_title = Table([[Paragraph('TAX INVOICE', ParagraphStyle(
        'inv', fontSize=12, fontName='Helvetica-Bold',
        textColor=colors.white, alignment=TA_CENTER))]],
        colWidths=[180*mm])
    inv_title.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), table_header_bg),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(inv_title)
    story.append(Spacer(1, 3*mm))

    # ── Invoice Meta + Customer Info ────────────────────────────────────────────
    created_at = invoice.get('created_at')
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        except Exception:
            created_at = datetime.utcnow()

    inv_meta = [
        [Paragraph('<b>Invoice No:</b>', normal_style), Paragraph(invoice.get('invoice_number', ''), bold_style),
         Paragraph('<b>Bill To:</b>', normal_style), Paragraph(invoice.get('customer_name', 'Walk-in'), bold_style)],
        [Paragraph('<b>Date:</b>', normal_style), Paragraph(created_at.strftime('%d %b %Y'), normal_style),
         Paragraph('<b>Phone:</b>', normal_style), Paragraph(invoice.get('customer_phone', '-'), normal_style)],
        [Paragraph('<b>Payment:</b>', normal_style), Paragraph(invoice.get('payment_method', 'Cash').title(), normal_style),
         Paragraph('<b>Address:</b>', normal_style), Paragraph(invoice.get('customer_address', '-'), normal_style)],
        [Paragraph('<b>Status:</b>', normal_style), Paragraph(invoice.get('payment_status', 'Paid').title(), normal_style),
         Paragraph('<b>GSTIN:</b>', normal_style), Paragraph(invoice.get('customer_gst', '-'), normal_style)],
    ]
    meta_table = Table(inv_meta, colWidths=[30*mm, 55*mm, 30*mm, 65*mm])
    meta_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.grey),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 4*mm))

    # ── Items Table ─────────────────────────────────────────────────────────────
    item_header = ['#', 'Product / Description', 'HSN', 'Qty', 'Unit', 'Rate (₹)', 'Disc (₹)', 'GST%', 'Amount (₹)']
    item_rows = [item_header]

    for idx, item in enumerate(invoice.get('items', []), 1):
        amount = float(item.get('subtotal', float(item['quantity']) * float(item['unit_price'])))
        item_rows.append([
            str(idx),
            item.get('product_name', ''),
            item.get('hsn_code', '-'),
            str(item.get('quantity', '')),
            item.get('unit', 'pcs'),
            f"{float(item.get('unit_price', 0)):,.2f}",
            f"{float(item.get('item_discount', 0)):,.2f}",
            f"{float(item.get('tax_rate', 18))}%",
            f"{amount:,.2f}"
        ])

    col_widths = [8*mm, 52*mm, 16*mm, 12*mm, 12*mm, 22*mm, 16*mm, 14*mm, 22*mm]
    items_table = Table(item_rows, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), table_header_bg),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('BOX', (0, 0), (-1, -1), 0.5, primary_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 3*mm))

    # ── Totals ──────────────────────────────────────────────────────────────────
    totals_data = [
        ['', '', Paragraph('<b>Subtotal</b>', right_style), f"₹ {invoice.get('subtotal', 0):,.2f}"],
    ]
    if invoice.get('discount_amount', 0) > 0:
        totals_data.append(['', '', Paragraph('Discount', right_style),
                             f"- ₹ {invoice.get('discount_amount', 0):,.2f}"])
        totals_data.append(['', '', Paragraph('Taxable Amount', right_style),
                             f"₹ {invoice.get('taxable_amount', 0):,.2f}"])

    if not invoice.get('is_interstate'):
        totals_data.append(['', '', Paragraph(f"CGST", right_style), f"₹ {invoice.get('cgst', 0):,.2f}"])
        totals_data.append(['', '', Paragraph(f"SGST", right_style), f"₹ {invoice.get('sgst', 0):,.2f}"])
    else:
        totals_data.append(['', '', Paragraph(f"IGST", right_style), f"₹ {invoice.get('igst', 0):,.2f}"])

    totals_data.append(['', '', Paragraph('<b>Grand Total</b>', ParagraphStyle(
        'gt', fontSize=10, fontName='Helvetica-Bold', alignment=TA_RIGHT, textColor=primary_color)),
        f"₹ {invoice.get('grand_total', 0):,.2f}"])

    totals_table = Table(totals_data, colWidths=[50*mm, 50*mm, 55*mm, 25*mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ('LINEABOVE', (2, -1), (3, -1), 1, primary_color),
        ('LINEBELOW', (2, -1), (3, -1), 1.5, primary_color),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BACKGROUND', (2, -1), (3, -1), light_bg),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 3*mm))

    # ── Amount in words ─────────────────────────────────────────────────────────
    words = num_to_words(invoice.get('grand_total', 0))
    story.append(Paragraph(f'<b>Amount in Words:</b> Indian Rupees {words}', normal_style))
    story.append(Spacer(1, 5*mm))

    # ── Footer ──────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.grey))
    story.append(Spacer(1, 3*mm))
    footer_data = [
        [Paragraph('Terms & Conditions:\n1. Goods once sold will not be taken back.\n'
                   '2. Subject to local jurisdiction.\n3. E.&O.E.', normal_style),
         Paragraph(f'For {Config.COMPANY_NAME}\n\n\n\nAuthorised Signatory', ParagraphStyle(
             'sig', fontSize=8, alignment=TA_RIGHT))]
    ]
    footer_table = Table(footer_data, colWidths=[120*mm, 60*mm])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(footer_table)

    doc.build(story)
    buffer.seek(0)
    return buffer
