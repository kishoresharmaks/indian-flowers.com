import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const categories = await Category.find({}).sort({ order: 1, name: 1 }).lean();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Indian-Flowers.com Admin CMS';
    wb.created = new Date();

    // ==========================================
    // SHEET 1: PRODUCTS IMPORT TEMPLATE
    // ==========================================
    const wsProducts = wb.addWorksheet('Products', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    const columns = [
      { header: 'Product Name *', key: 'name', width: 38 },
      { header: 'Description *', key: 'description', width: 55 },
      { header: 'Category *', key: 'category', width: 26 },
      { header: 'Subcategory', key: 'subcategory', width: 24 },
      { header: 'Base Price ($) *', key: 'price', width: 16 },
      { header: 'Base MRP ($) *', key: 'mrp', width: 16 },
      { header: 'Stock Quantity', key: 'quantity', width: 16 },
      { header: 'Image Filename', key: 'image', width: 26 },
      { header: 'GST Tax %', key: 'gst', width: 14 },
      // Variant 1
      { header: 'Variant 1 - Name', key: 'v1_name', width: 24 },
      { header: 'Variant 1 - Price ($)', key: 'v1_price', width: 20 },
      { header: 'Variant 1 - MRP ($)', key: 'v1_mrp', width: 20 },
      { header: 'Variant 1 - Stock Qty', key: 'v1_qty', width: 20 },
      // Variant 2
      { header: 'Variant 2 - Name', key: 'v2_name', width: 24 },
      { header: 'Variant 2 - Price ($)', key: 'v2_price', width: 20 },
      { header: 'Variant 2 - MRP ($)', key: 'v2_mrp', width: 20 },
      { header: 'Variant 2 - Stock Qty', key: 'v2_qty', width: 20 },
      // Variant 3
      { header: 'Variant 3 - Name', key: 'v3_name', width: 24 },
      { header: 'Variant 3 - Price ($)', key: 'v3_price', width: 20 },
      { header: 'Variant 3 - MRP ($)', key: 'v3_mrp', width: 20 },
      { header: 'Variant 3 - Stock Qty', key: 'v3_qty', width: 20 },
      // Variant 4
      { header: 'Variant 4 - Name', key: 'v4_name', width: 24 },
      { header: 'Variant 4 - Price ($)', key: 'v4_price', width: 20 },
      { header: 'Variant 4 - MRP ($)', key: 'v4_mrp', width: 20 },
      { header: 'Variant 4 - Stock Qty', key: 'v4_qty', width: 20 },
    ];

    wsProducts.columns = columns;

    // Style Header Row 1
    const headerRow = wsProducts.getRow(1);
    headerRow.height = 34;

    for (let colIdx = 1; colIdx <= columns.length; colIdx++) {
      const cell = headerRow.getCell(colIdx);
      let fillArgb = 'FF0B3B24'; // Brand Deep Forest Green (Columns 1-4)
      if (colIdx >= 5 && colIdx <= 7) fillArgb = 'FF134633'; // Base Price & Stock
      else if (colIdx === 8) fillArgb = 'FF164E63'; // Image Filename
      else if (colIdx === 9) fillArgb = 'FF1E3A5F'; // Tax
      else if (colIdx >= 10 && colIdx <= 13) fillArgb = 'FF9F1239'; // Variant 1 (Deep Rose)
      else if (colIdx >= 14 && colIdx <= 17) fillArgb = 'FF4338CA'; // Variant 2 (Deep Indigo)
      else if (colIdx >= 18 && colIdx <= 21) fillArgb = 'FFB45309'; // Variant 3 (Warm Amber)
      else if (colIdx >= 22 && colIdx <= 25) fillArgb = 'FF475569'; // Variant 4 (Slate)

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillArgb },
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }

    // Sample Products demonstrating all combinations (with variants & without variants)
    const sampleRows = [
      {
        name: 'Crimson Rose Petal & Peach Carnation Grand Varmala',
        description: 'Authentic handcrafted fresh red rose petal and carnation wedding garland pair for bride and groom. Flown fresh priority across the USA.',
        category: 'Indian Wedding Garlands',
        subcategory: 'Rose Petal Garlands',
        price: 75.0,
        mrp: 95.0,
        quantity: 25,
        image: 'rose-petal-varmala.jpg',
        gst: 0,
        v1_name: 'Standard Length (4 ft)',
        v1_price: 75.0,
        v1_mrp: 95.0,
        v1_qty: 15,
        v2_name: 'Grand Length (5 ft)',
        v2_price: 95.0,
        v2_mrp: 120.0,
        v2_qty: 10,
        v3_name: '',
        v3_price: '',
        v3_mrp: '',
        v3_qty: '',
        v4_name: '',
        v4_price: '',
        v4_mrp: '',
        v4_qty: '',
      },
      {
        name: 'White Carnation & Red Rose Wedding Varmala with Golden Tassels',
        description: 'Premium white carnations intertwined with fresh red rosebuds and auspicious golden tassels. Ideal for wedding muhurtham rituals.',
        category: 'Indian Wedding Garlands',
        subcategory: 'Carnation Garlands',
        price: 89.0,
        mrp: 110.0,
        quantity: 20,
        image: 'carnation-rose-garland.jpg',
        gst: 0,
        v1_name: 'Single Garland (4 ft)',
        v1_price: 89.0,
        v1_mrp: 110.0,
        v1_qty: 10,
        v2_name: 'Matching Pair (Set of 2)',
        v2_price: 170.0,
        v2_mrp: 210.0,
        v2_qty: 10,
        v3_name: '',
        v3_price: '',
        v3_mrp: '',
        v3_qty: '',
        v4_name: '',
        v4_price: '',
        v4_mrp: '',
        v4_qty: '',
      },
      {
        name: 'Fresh Fragrant Madurai Jasmine (Mallipoo) String',
        description: 'Authentic South Indian Sambac Jasmine (Madurai Mallipoo) strung on auspicious cotton thread. Shipped overnight in insulated cold-chain boxes.',
        category: 'strings',
        subcategory: 'Jasmine Strings',
        price: 24.0,
        mrp: 30.0,
        quantity: 50,
        image: 'madurai-mallipoo.jpg',
        gst: 0,
        v1_name: '1 Yard',
        v1_price: 24.0,
        v1_mrp: 30.0,
        v1_qty: 25,
        v2_name: '2 Yards',
        v2_price: 44.0,
        v2_mrp: 55.0,
        v2_qty: 15,
        v3_name: '5 Yards (Grand Puja Pack)',
        v3_price: 99.0,
        v3_mrp: 125.0,
        v3_qty: 10,
        v4_name: '',
        v4_price: '',
        v4_mrp: '',
        v4_qty: '',
      },
      {
        name: 'Fresh Orange & Yellow Marigold Loose Flowers (Genda)',
        description: 'Freshly harvested loose marigold blooms and petals for daily puja, Diwali archana, and festive entrance rangoli decor.',
        category: 'Pooja flowers',
        subcategory: 'Loose Flowers',
        price: 18.0,
        mrp: 25.0,
        quantity: 40,
        image: 'marigold-loose.jpg',
        gst: 0,
        v1_name: '250 Grams',
        v1_price: 18.0,
        v1_mrp: 25.0,
        v1_qty: 20,
        v2_name: '500 Grams',
        v2_price: 32.0,
        v2_mrp: 45.0,
        v2_qty: 15,
        v3_name: '1 Kilogram Box',
        v3_price: 60.0,
        v3_mrp: 85.0,
        v3_qty: 5,
        v4_name: '',
        v4_price: '',
        v4_mrp: '',
        v4_qty: '',
      },
      {
        name: 'Fresh Indian Mango Leaves Bunch (Mavilai for Kalasam & Toran)',
        description: 'Auspicious fresh green mango leaves bunch for kalasam sthapanam, festival toran, and home gruhapravesam rituals.',
        category: 'Pooja leaves',
        subcategory: 'Pooja Leaves',
        price: 12.0,
        mrp: 15.0,
        quantity: 35,
        image: 'mango-leaves.jpg',
        gst: 0,
        // No variants - leaves blank to illustrate simple product
        v1_name: '',
        v1_price: '',
        v1_mrp: '',
        v1_qty: '',
        v2_name: '',
        v2_price: '',
        v2_mrp: '',
        v2_qty: '',
        v3_name: '',
        v3_price: '',
        v3_mrp: '',
        v3_qty: '',
        v4_name: '',
        v4_price: '',
        v4_mrp: '',
        v4_qty: '',
      },
      {
        name: 'Sacred Pooja Whole Coconut with Kalasam Husk',
        description: 'Naturally matured auspicious coconut with intact husk tuft, ideal for kalasam offering, temple archana, and havan ceremonies.',
        category: 'Coconut',
        subcategory: 'Whole Coconuts',
        price: 7.5,
        mrp: 10.0,
        quantity: 60,
        image: 'pooja-coconut.jpg',
        gst: 0,
        v1_name: 'Single Coconut (Pack of 1)',
        v1_price: 7.5,
        v1_mrp: 10.0,
        v1_qty: 30,
        v2_name: 'Pack of 3',
        v2_price: 20.0,
        v2_mrp: 28.0,
        v2_qty: 20,
        v3_name: 'Pack of 5 (Bulk Puja)',
        v3_price: 32.0,
        v3_mrp: 45.0,
        v3_qty: 10,
        v4_name: '',
        v4_price: '',
        v4_mrp: '',
        v4_qty: '',
      },
    ];

    sampleRows.forEach((row) => {
      const addedRow = wsProducts.addRow(row);
      addedRow.height = 24;

      // Style cells
      for (let c = 1; c <= columns.length; c++) {
        const cell = addedRow.getCell(c);
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Subtle background tint for variant groupings to make the sheet visually intuitive
        if (c >= 10 && c <= 13) {
          // Variant 1: Soft Rose tint
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
        } else if (c >= 14 && c <= 17) {
          // Variant 2: Soft Indigo tint
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
        } else if (c >= 18 && c <= 21) {
          // Variant 3: Soft Amber tint
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        } else if (c >= 22 && c <= 25) {
          // Variant 4: Soft Slate tint
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        }

        // Currency formatting for price/mrp
        if ([5, 6, 11, 12, 15, 16, 19, 20, 23, 24].includes(c) && typeof cell.value === 'number') {
          cell.numFmt = '"$"#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if ([7, 13, 17, 21, 25].includes(c) && typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (c === 8 || c === 9) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      }
    });

    // ==========================================
    // SHEET 2: CATEGORIES REFERENCE
    // ==========================================
    const wsCategories = wb.addWorksheet('Categories Reference', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    wsCategories.columns = [
      { header: 'Category Name', key: 'name', width: 32 },
      { header: 'Subcategories Available', key: 'subcategories', width: 65 },
      { header: 'Display Order', key: 'order', width: 16 },
    ];

    const catHeaderRow = wsCategories.getRow(1);
    catHeaderRow.height = 32;
    for (let c = 1; c <= 3; c++) {
      const cell = catHeaderRow.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0B3B24' },
      };
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    categories.forEach((cat) => {
      const subcatList = (cat.subcategories || []).map((s: any) => s.name).join(', ') || '(None)';
      const r = wsCategories.addRow({
        name: cat.name,
        subcategories: subcatList,
        order: cat.order || 0,
      });
      r.height = 22;
      for (let c = 1; c <= 3; c++) {
        const cell = r.getCell(c);
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (c === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        else cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    // ==========================================
    // SHEET 3: HOW TO USE & IMAGE GUIDE
    // ==========================================
    const wsGuide = wb.addWorksheet('Instructions & Image Guide');
    wsGuide.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    wsGuide.columns = [
      { header: 'Topic', key: 'topic', width: 28 },
      { header: 'Instructions & Non-Technical Guidance', key: 'details', width: 85 },
      { header: 'Example', key: 'example', width: 35 },
    ];

    const guideHeaderRow = wsGuide.getRow(1);
    guideHeaderRow.height = 32;
    for (let c = 1; c <= 3; c++) {
      const cell = guideHeaderRow.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0B3B24' },
      };
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    const guideRows = [
      {
        topic: '1. How Images Work (No Base64 In Excel!)',
        details:
          'In this Excel sheet, just write the image filename (e.g. rose-garland.jpg). In the Admin Bulk Import modal, drop your product photos in the "Drop Images" zone. The system automatically converts them to high-quality compressed Base64 on your computer and attaches them to each matching product.',
        example: 'rose-petal-varmala.jpg or mallipoo.png',
      },
      {
        topic: '2. Product Name Image Fallback',
        details:
          'If you leave the Image Filename column blank, our system will also automatically match any image file on your computer named after the product (e.g. "Crimson Rose Petal.jpg").',
        example: 'Photo named "Madurai Mallipoo.jpg"',
      },
      {
        topic: '3. Separate Variant Columns',
        details:
          'No technical syntax or coding needed! We provide separate columns for each variant (Variant 1, Variant 2, Variant 3, Variant 4). Simply fill in the Variant Name, Price ($), MRP ($), and Stock Quantity. If your product does not have variants (like Mango Leaves), just leave the variant columns completely blank.',
        example: 'Variant 1: "1 Yard" / $24.00 / 25 Qty',
      },
      {
        topic: '4. US Dollar Pricing ($)',
        details:
          'This store operates for the US market. Enter all Price and MRP amounts in US Dollars (USD $). Never enter Indian Rupees (INR).',
        example: '$75.00 (Price) / $95.00 (MRP)',
      },
      {
        topic: '5. Categories Reference',
        details:
          'Check Sheet 2 ("Categories Reference") for valid category and subcategory names. If you enter a new category or subcategory name, the store will automatically create it for you.',
        example: 'Indian Wedding Garlands',
      },
      {
        topic: '6. Duplicate & Update Protection',
        details:
          'If a product with the same name already exists in your store, importing will safely UPDATE its price, description, stock, and variants. If you do not upload a new image for an existing product, ITS EXISTING PHOTO IS PRESERVED safely!',
        example: 'Price updates will never erase photos',
      },
      {
        topic: '7. Pre-Import Live Preview',
        details:
          'When you upload this Excel file in the Admin modal, you will see a colored live preview showing which products are NEW (+New badge) and which are EXISTING (Update badge), along with image match statuses before you click Import.',
        example: 'Zero surprises before saving to DB',
      },
    ];

    guideRows.forEach((item) => {
      const r = wsGuide.addRow(item);
      r.height = 36;
      for (let c = 1; c <= 3; c++) {
        const cell = r.getCell(c);
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (c === 1) cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0B3B24' } };
      }
    });

    // Write to buffer
    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="IndianFlowers_Products_Bulk_Import_Template.xlsx"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Failed to generate Excel template:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}
