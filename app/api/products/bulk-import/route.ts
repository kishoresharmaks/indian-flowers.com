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

// Helper to normalize keys of an object to lowercase alphanumeric only
function normalizeRow(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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
      // JSON payload: containing rows (with base64 compressed images already attached by client)
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
          { success: false, message: 'Provide either product rows or an Excel workbook.' },
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
    const itemSummaries: {
      name: string;
      action: 'created' | 'updated' | 'skipped';
      category: string;
      price: number;
      variantsCount: number;
      hasImage: boolean;
      reason?: string;
    }[] = [];

    // Pre-load all categories into memory for efficient matching
    const allCategories = await Category.find({});
    const categoryMap = new Map<string, any>();
    allCategories.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase().trim(), cat);
    });

    const DEFAULT_PLACEHOLDER = '/images/products/prod-rose-petal-varmala.jpg';

    for (let index = 0; index < rawRows.length; index++) {
      const originalRow = rawRows[index];
      const row = normalizeRow(originalRow);
      const rowNum = index + 2;

      // 1. Extract Product Name
      const name = (
        row.productname ||
        row.name ||
        row.title ||
        row.producttitle ||
        originalRow['Product Name *'] ||
        originalRow['Product Name'] ||
        originalRow['Name'] ||
        ''
      )
        .toString()
        .trim();

      if (!name) {
        // Skip blank empty rows
        continue;
      }

      // 2. Extract Description
      const description = (
        row.description ||
        row.desc ||
        row.details ||
        originalRow['Description *'] ||
        originalRow['Description'] ||
        name
      )
        .toString()
        .trim();

      // 3. Extract Category & Subcategory
      let categoryName = (
        row.category ||
        row.categoryname ||
        originalRow['Category *'] ||
        originalRow['Category'] ||
        'Indian Wedding Garlands'
      )
        .toString()
        .trim();

      const subcategoryName = (
        row.subcategory ||
        row.subcat ||
        row.subcatname ||
        originalRow['Subcategory'] ||
        originalRow['Sub Category'] ||
        ''
      )
        .toString()
        .trim();

      // 4. Extract Pricing & Quantities
      const rawPrice = Number(
        row.baseprice ||
          row.price ||
          row.sellingprice ||
          originalRow['Base Price ($) *'] ||
          originalRow['Base Price'] ||
          originalRow['Price'] ||
          0
      );

      const rawMrp = Number(
        row.basemrp ||
          row.mrp ||
          row.originalprice ||
          originalRow['Base MRP ($) *'] ||
          originalRow['Base MRP'] ||
          originalRow['MRP'] ||
          0
      );

      const rawQty = Number(
        row.stockquantity ||
          row.quantity ||
          row.qty ||
          row.stock ||
          originalRow['Stock Quantity'] ||
          originalRow['Quantity'] ||
          10
      );

      const rawGst = Number(
        row.gsttax ||
          row.gst ||
          row.tax ||
          originalRow['GST Tax %'] ||
          originalRow['GST'] ||
          0
      );

      const price = isNaN(rawPrice) || rawPrice < 0 ? 0 : rawPrice;
      const mrp = isNaN(rawMrp) || rawMrp < price ? price : rawMrp;
      const quantity = isNaN(rawQty) || rawQty < 0 ? 10 : Math.floor(rawQty);
      const gst = isNaN(rawGst) || rawGst < 0 ? 0 : rawGst;
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      // 5. Extract Image (could be Base64 data URL, URL, or filename)
      let image = (
        row.image ||
        row.imagefilename ||
        row.imagefilenameegrosejpg ||
        row.imageurl ||
        row.photo ||
        originalRow['Image Filename'] ||
        originalRow['Image'] ||
        ''
      )
        .toString()
        .trim();

      // 6. Extract Variants (Separate Non-Technical Columns First, fallback to semicolon format)
      let parsedVariants: any[] = [];

      for (let vIdx = 1; vIdx <= 8; vIdx++) {
        const vName = (
          row[`variant${vIdx}name`] ||
          row[`variant${vIdx}`] ||
          row[`v${vIdx}name`] ||
          originalRow[`Variant ${vIdx} - Name`] ||
          originalRow[`Variant ${vIdx} Name`] ||
          ''
        )
          .toString()
          .trim();

        if (!vName) continue;

        const rawVPrice = Number(
          row[`variant${vIdx}price`] ||
            row[`v${vIdx}price`] ||
            row[`variant${vIdx}sellingprice`] ||
            originalRow[`Variant ${vIdx} - Price ($)`] ||
            originalRow[`Variant ${vIdx} Price`] ||
            price
        );

        const rawVMrp = Number(
          row[`variant${vIdx}mrp`] ||
            row[`v${vIdx}mrp`] ||
            row[`variant${vIdx}originalprice`] ||
            originalRow[`Variant ${vIdx} - MRP ($)`] ||
            originalRow[`Variant ${vIdx} MRP`] ||
            (rawVPrice || price)
        );

        const rawVQty = Number(
          row[`variant${vIdx}stockqty`] ||
            row[`variant${vIdx}quantity`] ||
            row[`variant${vIdx}qty`] ||
            row[`v${vIdx}qty`] ||
            originalRow[`Variant ${vIdx} - Stock Qty`] ||
            originalRow[`Variant ${vIdx} Quantity`] ||
            quantity
        );

        const vPrice = isNaN(rawVPrice) || rawVPrice < 0 ? price : rawVPrice;
        const vMrp = isNaN(rawVMrp) || rawVMrp < vPrice ? vPrice : rawVMrp;
        const vQty = isNaN(rawVQty) || rawVQty < 0 ? 10 : Math.floor(rawVQty);
        const vDiscount = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;

        parsedVariants.push({
          name: vName,
          price: vPrice,
          mrp: vMrp,
          quantity: vQty,
          discount: vDiscount,
        });
      }

      // Fallback: If no separate columns provided, check old delimited Variants string
      if (parsedVariants.length === 0) {
        const rawDelimitedVariants = (
          row.variants ||
          row.variant ||
          originalRow['Variants'] ||
          ''
        )
          .toString()
          .trim();

        if (rawDelimitedVariants) {
          const tokens = rawDelimitedVariants.split(';').map((v: string) => v.trim()).filter(Boolean);
          for (const token of tokens) {
            const parts = token.split(':').map((p: string) => p.trim());
            const vName = parts[0] || 'Standard';
            const vPrice = Number(parts[1]) || price;
            const vMrp = Number(parts[2]) || mrp;
            const vQty =
              Number(parts[3]) !== undefined && !isNaN(Number(parts[3]))
                ? Number(parts[3])
                : quantity;
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
      }

      // 7. Sync Category and Subcategory in Category Model
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
          matchedCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          });
          if (matchedCategory) {
            categoryMap.set(categoryName.toLowerCase(), matchedCategory);
          }
        }
      }

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

      // 8. Find existing product by exact/trimmed case-insensitive name
      try {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingProduct = await Product.findOne({
          name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
        });

        const isNewImageProvided =
          image &&
          (image.startsWith('data:image/') ||
            image.startsWith('http://') ||
            image.startsWith('https://') ||
            (image.startsWith('/') && image !== DEFAULT_PLACEHOLDER));

        if (existingProduct) {
          // UPDATE EXISTING PRODUCT
          existingProduct.description = description;
          existingProduct.category = categoryName;
          existingProduct.subcategory = subcategoryName;
          existingProduct.price = price;
          existingProduct.mrp = mrp;
          existingProduct.discount = discount;
          existingProduct.quantity = quantity;
          existingProduct.gst = gst;

          // CRITICAL INTEGRITY CHECK:
          // Only overwrite existing image if a real new Base64 or URL was provided.
          // Never overwrite an existing good photo with a blank or default placeholder!
          if (isNewImageProvided) {
            existingProduct.image = image;
          }

          if (parsedVariants.length > 0) {
            existingProduct.variants = parsedVariants;
          }

          await existingProduct.save();
          updatedCount++;

          itemSummaries.push({
            name,
            action: 'updated',
            category: categoryName,
            price,
            variantsCount: parsedVariants.length,
            hasImage: Boolean(existingProduct.image),
          });
        } else {
          // CREATE NEW PRODUCT
          const finalImage = isNewImageProvided ? image : DEFAULT_PLACEHOLDER;

          await Product.create({
            name,
            description,
            category: categoryName,
            subcategory: subcategoryName,
            price,
            mrp,
            discount,
            quantity,
            gst,
            image: finalImage,
            variants: parsedVariants,
            rating: 4.8,
            reviewsCount: 35,
          });

          createdCount++;

          itemSummaries.push({
            name,
            action: 'created',
            category: categoryName,
            price,
            variantsCount: parsedVariants.length,
            hasImage: finalImage !== DEFAULT_PLACEHOLDER,
          });
        }
      } catch (prodErr: any) {
        errors.push(`Row ${rowNum} ("${name}"): ${prodErr.message || 'Error saving product'}`);
        itemSummaries.push({
          name,
          action: 'skipped',
          category: categoryName,
          price,
          variantsCount: parsedVariants.length,
          hasImage: false,
          reason: prodErr.message || 'Database error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk import completed! ${createdCount} created, ${updatedCount} updated.`,
      count: createdCount + updatedCount,
      created: createdCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
      items: itemSummaries,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Bulk import failed' },
      { status: 500 }
    );
  }
}
