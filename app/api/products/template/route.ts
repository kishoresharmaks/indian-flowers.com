import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const categories = await Category.find({}).sort({ order: 1, name: 1 }).lean();

    // 1. Create a new Workbook
    const wb = XLSX.utils.book_new();

    // 2. Sheet 1: Products Import Template
    const sampleProducts = [
      {
        'Name': 'Crimson Rose Petal & Peach Carnation Grand Varmala',
        'Description': 'Authentic handcrafted fresh red rose petal and carnation wedding garland pair for bride and groom. Flown fresh priority across the USA.',
        'Category': 'Indian Wedding Garlands',
        'Subcategory': 'Rose Petal Garlands',
        'MRP': 95.0,
        'Price': 75.0,
        'Quantity': 25,
        'Image': '/images/products/prod-rose-petal-varmala.jpg',
        'GST': 0,
        'Variants': 'Standard (4 ft):75:95:20; Grand Temple Length (5 ft):95:120:10',
      },
      {
        'Name': 'White Carnation & Red Rose Wedding Varmala with Golden Tassels',
        'Description': 'Premium white carnations intertwined with fresh red rosebuds and auspicious golden tassels. Ideal for wedding muhurtham.',
        'Category': 'Indian Wedding Garlands',
        'Subcategory': 'Carnation Garlands',
        'MRP': 110.0,
        'Price': 89.0,
        'Quantity': 20,
        'Image': '/images/products/prod-carnation-rose-garland.jpg',
        'GST': 0,
        'Variants': 'Single Garland (4 ft):89:110:15; Matching Pair (Set of 2):170:210:10',
      },
      {
        'Name': 'Fresh Fragrant Madurai Jasmine (Mallipoo) String',
        'Description': 'Authentic South Indian Sambac Jasmine (Madurai Mallipoo) strung on auspicious cotton thread. Shipped overnight in insulated cold-chain boxes.',
        'Category': 'strings',
        'Subcategory': '',
        'MRP': 30.0,
        'Price': 24.0,
        'Quantity': 50,
        'Image': '/images/products/prod-madurai-mallipoo.jpg',
        'GST': 0,
        'Variants': '1 Yard:24:30:25; 2 Yards:44:55:20; 5 Yards:99:125:10',
      },
      {
        'Name': 'Fresh Orange & Yellow Marigold Loose Flowers (Genda)',
        'Description': 'Freshly harvested loose marigold blooms and petals for daily puja, Diwali archana, and festive entrance rangoli.',
        'Category': 'Pooja flowers',
        'Subcategory': '',
        'MRP': 25.0,
        'Price': 18.0,
        'Quantity': 40,
        'Image': '/images/products/prod-orange-marigold-loose.jpg',
        'GST': 0,
        'Variants': '250g:18:25:20; 500g:32:45:15; 1kg Box:60:85:10',
      },
      {
        'Name': 'Fresh Indian Mango Leaves Bunch (Mavilai for Kalasam & Toran)',
        'Description': 'Auspicious fresh green mango leaves bunch for kalasam sthapanam, festival toran, and home gruhapravesam rituals.',
        'Category': 'Pooja leaves',
        'Subcategory': '',
        'MRP': 15.0,
        'Price': 12.0,
        'Quantity': 35,
        'Image': '/images/products/prod-mango-leaves-mavilai.jpg',
        'GST': 0,
        'Variants': '',
      },
      {
        'Name': 'Sacred Pooja Whole Coconut with Kalasam Husk',
        'Description': 'Naturally matured auspicious coconut with intact husk tuft, ideal for kalasam offering, temple archana, and havan.',
        'Category': 'Coconut',
        'Subcategory': '',
        'MRP': 10.0,
        'Price': 7.5,
        'Quantity': 60,
        'Image': '/images/products/prod-durva-bilva-combo.jpg',
        'GST': 0,
        'Variants': 'Pack of 1:7.5:10:30; Pack of 3:20:28:20; Pack of 5:32:45:10',
      },
    ];

    const wsProducts = XLSX.utils.json_to_sheet(sampleProducts);

    // Set column widths for readability
    wsProducts['!cols'] = [
      { wch: 45 }, // Name
      { wch: 60 }, // Description
      { wch: 26 }, // Category
      { wch: 24 }, // Subcategory
      { wch: 10 }, // MRP
      { wch: 10 }, // Price
      { wch: 10 }, // Quantity
      { wch: 42 }, // Image
      { wch: 8 },  // GST
      { wch: 50 }, // Variants
    ];

    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

    // 3. Sheet 2: Available Categories & Subcategories Reference
    const catReference = categories.map((c) => ({
      'Category Name': c.name,
      'Subcategories': (c.subcategories || []).map((s: any) => s.name).join(', ') || '(None)',
      'Display Order': c.order || 0,
    }));

    const wsCategories = XLSX.utils.json_to_sheet(catReference);
    wsCategories['!cols'] = [
      { wch: 30 },
      { wch: 60 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories Reference');

    // 4. Sheet 3: Instructions & Formatting Guide
    const instructions = [
      { 'Field': 'Name', 'Required': 'YES', 'Description': 'Product title displayed to customers on storefront and receipts.' },
      { 'Field': 'Description', 'Required': 'YES', 'Description': 'Detailed product description, floral freshness info, and usage notes.' },
      { 'Field': 'Category', 'Required': 'YES', 'Description': 'Must match an existing store category (see Categories Reference sheet).' },
      { 'Field': 'Subcategory', 'Required': 'OPTIONAL', 'Description': 'Subcategory name (e.g. "Rose Petal Garlands", "Carnation Garlands", etc.).' },
      { 'Field': 'MRP', 'Required': 'YES', 'Description': 'Maximum retail price in US Dollars (USD $).' },
      { 'Field': 'Price', 'Required': 'YES', 'Description': 'Selling price in US Dollars (USD $). Discount percentage is auto-computed.' },
      { 'Field': 'Quantity', 'Required': 'NO', 'Description': 'Initial inventory stock count. Default is 10 if left blank.' },
      { 'Field': 'Image', 'Required': 'NO', 'Description': 'Local path (/images/products/...) or public HTTPS image URL. Default placeholder used if blank.' },
      { 'Field': 'GST', 'Required': 'NO', 'Description': 'Tax rate percentage (0 for 0%, 5 for 5%). Default is 0.' },
      { 'Field': 'Variants', 'Required': 'OPTIONAL', 'Description': 'Format: Name:Price:MRP:Quantity separated by semicolons (;). Example: "1 Yard:24:30:15; 2 Yards:44:55:10"' },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [
      { wch: 18 },
      { wch: 12 },
      { wch: 80 },
    ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // 5. Generate Excel buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="IndianFlowers_Products_Bulk_Import_Template.xlsx"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}
