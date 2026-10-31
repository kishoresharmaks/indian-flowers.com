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
    const wsProducts = wb.addWorksheet('Core Catalog Products', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    const columns = [
      { header: 'Product Title', key: 'title', width: 42 },
      { header: 'Product Description', key: 'description', width: 55 },
      { header: 'Product Image name of the image file to import', key: 'imageFilename', width: 44 },
      { header: 'MRP (Original $) *', key: 'mrp', width: 20 },
      { header: 'Selling Price ($) *', key: 'price', width: 20 },
      { header: 'Stock Quantity *', key: 'quantity', width: 18 },
      { header: 'Category *', key: 'category', width: 28 },
      { header: 'Sales Tax Status', key: 'salesTaxStatus', width: 20 },
      { header: 'Subcategory (Optional)', key: 'subcategory', width: 26 },
      { header: 'Product Variants & Pricing', key: 'variants', width: 48 },
      { header: 'Storefront Visibility', key: 'visibility', width: 22 },
    ];

    wsProducts.columns = columns;

    // Style Header Row 1
    const headerRow = wsProducts.getRow(1);
    headerRow.height = 36;

    for (let colIdx = 1; colIdx <= columns.length; colIdx++) {
      const cell = headerRow.getCell(colIdx);
      let fillArgb = 'FF0B3B24'; // Default Brand Forest Green (Cols 1-2: Title, Description)

      if (colIdx === 3) {
        fillArgb = 'FF0E7490'; // Standout Cyan/Teal (Image Filename)
      } else if (colIdx >= 4 && colIdx <= 6) {
        fillArgb = 'FF134633'; // Pricing & Stock (MRP, Selling Price, Quantity)
      } else if (colIdx >= 7 && colIdx <= 9) {
        fillArgb = 'FF1C563F'; // Category, Sales Tax Status, Subcategory
      } else if (colIdx === 10) {
        fillArgb = 'FF9F1239'; // Product Variants & Pricing (Rose Accent)
      } else if (colIdx === 11) {
        fillArgb = 'FF1E3A8A'; // Storefront Visibility
      }

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
        title: 'Crimson Rose Petal & Peach Carnation Grand Varmala',
        description: 'Authentic handcrafted fresh red rose petal and carnation wedding garland pair for bride and groom. Flown fresh priority across the USA.',
        imageFilename: 'rose-petal-varmala.jpg',
        mrp: 95.0,
        price: 75.0,
        quantity: 25,
        category: 'Indian Wedding Garlands',
        salesTaxStatus: 'Taxable',
        subcategory: 'Rose Petal Garlands',
        variants: 'Standard Length (4 ft): 75: 95: 15; Grand Length (5 ft): 95: 120: 10',
        visibility: 'Visible',
      },
      {
        title: 'White Carnation & Red Rose Wedding Varmala with Golden Tassels',
        description: 'Premium white carnations intertwined with fresh red rosebuds and auspicious golden tassels. Ideal for wedding muhurtham rituals.',
        imageFilename: 'carnation-rose-garland.jpg',
        mrp: 110.0,
        price: 89.0,
        quantity: 20,
        category: 'Indian Wedding Garlands',
        salesTaxStatus: 'Taxable',
        subcategory: 'Carnation Garlands',
        variants: 'Single Garland (4 ft): 89: 110: 10; Matching Pair (Set of 2): 170: 210: 10',
        visibility: 'Visible',
      },
      {
        title: 'Fresh Fragrant Madurai Jasmine (Mallipoo) String',
        description: 'Authentic South Indian Sambac Jasmine (Madurai Mallipoo) strung on auspicious cotton thread. Shipped overnight in insulated cold-chain boxes.',
        imageFilename: 'madurai-mallipoo.jpg',
        mrp: 30.0,
        price: 24.0,
        quantity: 50,
        category: 'strings',
        salesTaxStatus: 'Taxable',
        subcategory: 'Jasmine Strings',
        variants: '1 Yard: 24: 30: 25; 2 Yards: 44: 55: 15; 5 Yards (Grand Puja Pack): 99: 125: 10',
        visibility: 'Visible',
      },
      {
        title: 'Fresh Orange & Yellow Marigold Loose Flowers (Genda)',
        description: 'Freshly harvested loose marigold blooms and petals for daily puja, Diwali archana, and festive entrance rangoli decor.',
        imageFilename: 'marigold-loose.jpg',
        mrp: 25.0,
        price: 18.0,
        quantity: 40,
        category: 'Pooja flowers',
        salesTaxStatus: 'Taxable',
        subcategory: 'Loose Flowers',
        variants: '250 Grams: 18: 25: 20; 500 Grams: 32: 45: 15; 1 Kilogram Box: 60: 85: 5',
        visibility: 'Visible',
      },
      {
        title: 'Fresh Indian Mango Leaves Bunch (Mavilai for Kalasam & Toran)',
        description: 'Auspicious fresh green mango leaves bunch for kalasam sthapanam, festival toran, and home gruhapravesam rituals.',
        imageFilename: 'mango-leaves.jpg',
        mrp: 15.0,
        price: 12.0,
        quantity: 35,
        category: 'Pooja leaves',
        salesTaxStatus: 'Taxable',
        subcategory: 'Pooja Leaves',
        variants: '', // Simple product without variants
        visibility: 'Visible',
      },
    ];

    sampleRows.forEach((row, idx) => {
      const addedRow = wsProducts.addRow(row);
      addedRow.height = 24;

      const isEven = idx % 2 === 0;
      const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      for (let c = 1; c <= columns.length; c++) {
        const cell = addedRow.getCell(c);
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBgColor },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Col 3: Image Filename - Monospace & Teal highlight
        if (c === 3) {
          cell.font = { name: 'Consolas', size: 10, bold: true, color: { argb: 'FF0E7490' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFF0FDFA' : 'FFE6FFFA' },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
        // Col 4 & 5: MRP & Selling Price - Currency formatting
        else if (c === 4 || c === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '$#,##0.00';
          }
          if (c === 5) {
            cell.font = { name: 'Segoe UI', size: 10, bold: true };
          }
        }
        // Col 6: Stock Quantity - Number center
        else if (c === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        }
        // Col 8: Sales Tax Status - Center
        else if (c === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        // Col 11: Storefront Visibility - Center with color
        else if (c === 11) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (cell.value === 'Visible') {
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
          } else {
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF64748B' } };
          }
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
        topic: '3. Product Variants & Pricing',
        details:
          'To add variants, enter them in the format "Variant Name: Selling Price: MRP: Stock Quantity", separated by semicolons (;) for multiple variants. If a product does not have variants (like Mango Leaves), simply leave this column blank.',
        example: 'Standard Length (4 ft): 75: 95: 15; Grand Length (5 ft): 95: 120: 10',
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
