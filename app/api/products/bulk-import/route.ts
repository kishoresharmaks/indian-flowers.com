import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Helper to normalize keys of an object to lowercase trimmed
function normalizeRow(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[\s_\-]+/g, '');
    normalized[cleanKey] = row[key];
  }
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();

    let rawRows: any[] = [];

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No file provided in form data.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Look for sheet named 'Products' or fall back to the first sheet
      const sheetName = workbook.SheetNames.includes('Products')
        ? 'Products'
        : workbook.SheetNames[0];

      if (!sheetName || !workbook.Sheets[sheetName]) {
        return NextResponse.json(
          { success: false, message: 'Invalid Excel workbook. No readable sheets found.' },
          { status: 400 }
        );
      }

      rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    } else {
      // JSON payload: either pre-parsed rows or base64 file
      const body = await request.json();
      if (Array.isArray(body.rows)) {
        rawRows = body.rows;
      } else if (body.fileBase64) {
        const buffer = Buffer.from(body.fileBase64, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames.includes('Products')
          ? 'Products'
          : workbook.SheetNames[0];
        rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      } else {
        return NextResponse.json(
          { success: false, message: 'Provide either an Excel file or product rows.' },
          { status: 400 }
        );
      }
    }

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'The Excel sheet is empty. No product rows found.' },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];
    const processedProducts: any[] = [];

    // Pre-load all categories into memory for efficient matching
    const allCategories = await Category.find({});
    const categoryMap = new Map<string, any>();
    allCategories.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase().trim(), cat);
    });

    for (let index = 0; index < rawRows.length; index++) {
      const originalRow = rawRows[index];
      const row = normalizeRow(originalRow);
      const rowNum = index + 2; // Accounting for 1-based index + header row

      // Extract and match columns
      const name = (
        row.name ||
        row.productname ||
        row.title ||
        originalRow['Name'] ||
        originalRow['Product Name'] ||
        ''
      ).toString().trim();

      if (!name) {
        // Skip blank empty rows
        continue;
      }

      const description = (
        row.description ||
        row.desc ||
        row.details ||
        originalRow['Description'] ||
        name
      ).toString().trim();

      let categoryName = (
        row.category ||
        row.categoryname ||
        originalRow['Category'] ||
        'Indian Wedding Garlands'
      ).toString().trim();

      const subcategoryName = (
        row.subcategory ||
        row.subcat ||
        row.subcatname ||
        originalRow['Subcategory'] ||
        originalRow['Sub Category'] ||
        ''
      ).toString().trim();

      const rawMrp = Number(row.mrp ?? originalRow['MRP'] ?? 0);
      const rawPrice = Number(row.price ?? originalRow['Price'] ?? 0);
      const rawQty = Number(row.quantity ?? row.qty ?? row.stock ?? originalRow['Quantity'] ?? 10);
      const rawGst = Number(row.gst ?? row.tax ?? originalRow['GST'] ?? 0);

      const price = isNaN(rawPrice) || rawPrice < 0 ? 0 : rawPrice;
      const mrp = isNaN(rawMrp) || rawMrp < price ? price : rawMrp;
      const quantity = isNaN(rawQty) || rawQty < 0 ? 10 : Math.floor(rawQty);
      const gst = isNaN(rawGst) || rawGst < 0 ? 0 : rawGst;
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      let image = (
        row.image ||
        row.imageurl ||
        row.photo ||
        originalRow['Image'] ||
        ''
      ).toString().trim();

      if (!image) {
        image = '/images/products/prod-rose-petal-varmala.jpg';
      }

      // Parse Variants column if present:
      // Format expected: "Name:Price:MRP:Quantity; Name2:Price:MRP:Quantity"
      const rawVariants = (
        row.variants ||
        row.variant ||
        originalRow['Variants'] ||
        ''
      ).toString().trim();

      let parsedVariants: any[] = [];
      if (rawVariants) {
        const vTokens = rawVariants.split(';').map((v: string) => v.trim()).filter(Boolean);
        for (const token of vTokens) {
          const parts = token.split(':').map((p: string) => p.trim());
          const vName = parts[0] || 'Standard';
          const vPrice = Number(parts[1]) || price;
          const vMrp = Number(parts[2]) || mrp;
          const vQty = Number(parts[3]) !== undefined && !isNaN(Number(parts[3])) ? Number(parts[3]) : quantity;
          const vDiscount = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
          parsedVariants.push({
            name: vName,
            price: vPrice,
            mrp: vMrp,
            quantity: vQty,
            discount: vDiscount,
          });
        }
      }

      // Sync category and subcategory in Category model
      let matchedCategory = categoryMap.get(categoryName.toLowerCase());
      if (!matchedCategory) {
        try {
          matchedCategory = await Category.create({
            name: categoryName,
            slug: slugify(categoryName),
            order: categoryMap.size,
            subcategories: subcategoryName
              ? [{ name: subcategoryName, slug: slugify(subcategoryName), order: 0 }]
              : [],
          });
          categoryMap.set(categoryName.toLowerCase(), matchedCategory);
        } catch (catErr: any) {
          // If already exists or error, fetch again
          matchedCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
          });
          if (matchedCategory) {
            categoryMap.set(categoryName.toLowerCase(), matchedCategory);
          }
        }
      }

      // If subcategory is provided and not present in matched category, append it
      if (matchedCategory && subcategoryName) {
        if (!Array.isArray(matchedCategory.subcategories)) {
          matchedCategory.subcategories = [];
        }
        const hasSub = matchedCategory.subcategories.some(
          (s: any) => s.name.toLowerCase() === subcategoryName.toLowerCase()
        );
        if (!hasSub) {
          matchedCategory.subcategories.push({
            name: subcategoryName,
            slug: slugify(subcategoryName),
            order: matchedCategory.subcategories.length,
          });
          try {
            await matchedCategory.save();
          } catch (saveErr) {
            console.error('Failed to save category subcategory during import', saveErr);
          }
        }
      }

      // Find existing product by name to update or create new
      try {
        const existingProduct = await Product.findOne({
          name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });

        if (existingProduct) {
          existingProduct.description = description;
          existingProduct.category = categoryName;
          existingProduct.subcategory = subcategoryName;
          existingProduct.price = price;
          existingProduct.mrp = mrp;
          existingProduct.discount = discount;
          existingProduct.quantity = quantity;
          existingProduct.gst = gst;
          if (image) existingProduct.image = image;
          if (parsedVariants.length > 0) {
            existingProduct.variants = parsedVariants;
          }
          await existingProduct.save();
          updatedCount++;
          processedProducts.push(existingProduct);
        } else {
          const newProd = await Product.create({
            name,
            description,
            category: categoryName,
            subcategory: subcategoryName,
            price,
            mrp,
            discount,
            quantity,
            gst,
            image,
            variants: parsedVariants,
            rating: 4.8,
            reviewsCount: 35,
          });
          createdCount++;
          processedProducts.push(newProd);
        }
      } catch (prodErr: any) {
        errors.push(`Row ${rowNum} ("${name}"): ${prodErr.message || 'Error saving product'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk import completed! ${createdCount} created, ${updatedCount} updated.`,
      count: createdCount + updatedCount,
      created: createdCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
      data: processedProducts.slice(0, 10), // return sample of processed products
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Bulk import failed' },
      { status: 500 }
    );
  }
}
