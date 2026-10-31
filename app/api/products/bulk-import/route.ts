import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import fs from 'fs/promises';
import path from 'path';

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

      // Look for product sheet ('Core Catalog Products', 'Products', 'Catalog') or fall back to the first sheet
      const candidateSheets = ['core catalog products', 'products', 'core catalog', 'core products', 'catalog'];
      const matchedSheet = workbook.SheetNames.find((s) => candidateSheets.includes(s.toLowerCase().trim()));
      const sheetName = matchedSheet || workbook.SheetNames[0];

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
        const candidateSheets = ['core catalog products', 'products', 'core catalog', 'core products', 'catalog'];
        const matchedSheet = workbook.SheetNames.find((s) => candidateSheets.includes(s.toLowerCase().trim()));
        const sheetName = matchedSheet || workbook.SheetNames[0];
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

    const parseNum = (val: any, fallback = 0): number => {
      if (typeof val === 'number') return isNaN(val) ? fallback : val;
      if (!val) return fallback;
      const cleanVal = String(val).replace(/[^0-9.-]/g, '').trim();
      const num = parseFloat(cleanVal);
      return isNaN(num) ? fallback : num;
    };

    for (let index = 0; index < rawRows.length; index++) {
      const originalRow = rawRows[index];
      const row = normalizeRow(originalRow);
      const rowNum = index + 2;

      // 1. Extract Product Title / Name
      const name = (
        originalRow['Product Title'] ||
        originalRow['Product Title *'] ||
        row.producttitle ||
        row.productname ||
        row.name ||
        row.title ||
        originalRow['Product Name *'] ||
        originalRow['Product Name'] ||
        originalRow['Name'] ||
        originalRow['Title'] ||
        ''
      )
        .toString()
        .trim();

      if (!name) {
        // Skip blank empty rows
        continue;
      }

      // 2. Extract Product Description
      const description = (
        originalRow['Product Description'] ||
        originalRow['Product Description *'] ||
        row.productdescription ||
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
        originalRow['Category *'] ||
        originalRow['Category'] ||
        row.category ||
        row.categoryname ||
        'Indian Wedding Garlands'
      )
        .toString()
        .trim();

      const subcategoryName = (
        originalRow['Subcategory (Optional)'] ||
        originalRow['Subcategory'] ||
        row.subcategoryoptional ||
        row.subcategory ||
        row.subcat ||
        row.subcatname ||
        originalRow['Sub Category'] ||
        ''
      )
        .toString()
        .trim();

      // 4. Extract Pricing: Selling Price & MRP
      const rawPrice = parseNum(
        originalRow['Selling Price ($) *'] ||
          originalRow['Selling Price ($)'] ||
          row.sellingprice ||
          row.baseprice ||
          row.price ||
          originalRow['Base Price ($) *'] ||
          originalRow['Base Price'] ||
          originalRow['Price'],
        0
      );

      const rawMrp = parseNum(
        originalRow['MRP (Original $) *'] ||
          originalRow['MRP (Original $)'] ||
          row.mrporiginal ||
          row.mrporiginalprice ||
          row.basemrp ||
          row.mrp ||
          row.originalprice ||
          originalRow['Base MRP ($) *'] ||
          originalRow['Base MRP'] ||
          originalRow['MRP'],
        0
      );

      const rawQty = parseNum(
        originalRow['Stock Quantity *'] ||
          originalRow['Stock Quantity'] ||
          row.stockquantity ||
          row.quantity ||
          row.qty ||
          row.stock ||
          originalRow['Quantity'],
        10
      );

      // 5. Extract Sales Tax Status
      let parsedIsTaxable: boolean | undefined = undefined;
      let rawGst = parseNum(
        row.gsttax || row.gst || row.tax || originalRow['GST Tax %'] || originalRow['GST'],
        0
      );

      const rawTaxStatus = (
        originalRow['Sales Tax Status'] ||
        row.salestaxstatus ||
        row.taxstatus ||
        row.istaxable ||
        originalRow['Is Taxable'] ||
        ''
      )
        .toString()
        .trim()
        .toLowerCase();

      if (rawTaxStatus) {
        if (['non-taxable', 'nontaxable', 'exempt', 'no', 'false', '0', '0%'].includes(rawTaxStatus)) {
          parsedIsTaxable = false;
          rawGst = 0;
        } else if (['taxable', 'yes', 'true', '1', 'standard'].includes(rawTaxStatus)) {
          parsedIsTaxable = true;
        } else {
          const parsedRate = parseFloat(rawTaxStatus.replace(/[^0-9.]/g, ''));
          if (!isNaN(parsedRate)) {
            rawGst = parsedRate;
            parsedIsTaxable = parsedRate > 0;
          }
        }
      }
      if (typeof originalRow.isTaxable === 'boolean') {
        parsedIsTaxable = originalRow.isTaxable;
      }

      const price = rawPrice < 0 ? 0 : rawPrice;
      const mrp = rawMrp < price ? price : rawMrp;
      const quantity = Math.max(0, Math.floor(rawQty));
      const gst = rawGst < 0 ? 0 : rawGst;
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      // 6. Extract Image Filename or URL
      let image = (
        originalRow['Product Image name of the image file to import'] ||
        originalRow['Product Image Name of the Image File to Import'] ||
        row.productimagenameoftheimagefiletoimport ||
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

      // 7. Extract Storefront Visibility (Active/Disabled)
      let parsedIsActive: boolean | undefined = undefined;
      const rawStatus = (
        originalRow['Storefront Visibility'] ||
        row.storefrontvisibility ||
        row.visibility ||
        row.status ||
        row.isactive ||
        row.active ||
        row.statusactivedisabled ||
        originalRow['Status'] ||
        originalRow['Status (Active/Disabled)'] ||
        originalRow['Is Active'] ||
        ''
      )
        .toString()
        .trim()
        .toLowerCase();

      if (rawStatus) {
        if (['disabled', 'inactive', 'false', '0', 'no', 'hide', 'hidden'].includes(rawStatus)) {
          parsedIsActive = false;
        } else if (['active', 'enabled', 'true', '1', 'yes', 'show', 'live', 'visible'].includes(rawStatus)) {
          parsedIsActive = true;
        }
      }
      if (typeof originalRow.isActive === 'boolean') {
        parsedIsActive = originalRow.isActive;
      }

      // Ensure no Base64 is stored in MongoDB: decode and write to disk
      if (image.startsWith('data:image')) {
        try {
          const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            let ext = matches[1].toLowerCase();
            if (ext === 'jpeg') ext = 'jpg';
            if (ext === 'svg+xml') ext = 'svg';
            const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.writeFile(path.join(uploadDir, filename), Buffer.from(matches[2], 'base64'));
            image = `/uploads/products/${filename}`;
          }
        } catch (err) {
          console.warn('Failed to save bulk-import base64 image to disk:', err);
        }
      }

      // 8. Extract Variants (Single token string 'Product Variants & Pricing' or separate columns)
      let parsedVariants: any[] = [];
      const rawVariantsStr = (
        originalRow['Product Variants & Pricing'] ||
        row.productvariantspricing ||
        row.productvariants ||
        row.variants ||
        row.variant ||
        originalRow['Variants'] ||
        ''
      )
        .toString()
        .trim();

      if (rawVariantsStr) {
        const tokens = rawVariantsStr.split(';').map((v: string) => v.trim()).filter(Boolean);
        for (const token of tokens) {
          const parts = token.split(':').map((p: string) => p.trim());
          if (parts.length === 0 || !parts[0]) continue;

          const vName = parts[0] || 'Standard';
          let vPrice = price;
          let vMrp = mrp;
          let vQty = quantity;

          if (parts.length >= 4) {
            vPrice = parseNum(parts[1], price);
            vMrp = parseNum(parts[2], vPrice);
            vQty = Math.max(0, Math.floor(parseNum(parts[3], quantity)));
          } else if (parts.length === 3) {
            vPrice = parseNum(parts[1], price);
            vMrp = parseNum(parts[2], vPrice);
          } else if (parts.length === 2) {
            vPrice = parseNum(parts[1], price);
            vMrp = vPrice;
          }

          const finalVPrice = vPrice < 0 ? 0 : vPrice;
          const finalVMrp = vMrp < finalVPrice ? finalVPrice : vMrp;
          const vDiscount =
            finalVMrp > finalVPrice ? Math.round(((finalVMrp - finalVPrice) / finalVMrp) * 100) : 0;

          parsedVariants.push({
            name: vName,
            price: finalVPrice,
            mrp: finalVMrp,
            quantity: vQty,
            discount: vDiscount,
          });
        }
      }

      // Fallback: If no single variants string, check separate columns (Variant 1 - Name, etc.)
      if (parsedVariants.length === 0) {
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

          const rawVPrice = parseNum(
            row[`variant${vIdx}price`] ||
              row[`v${vIdx}price`] ||
              row[`variant${vIdx}sellingprice`] ||
              originalRow[`Variant ${vIdx} - Price ($)`] ||
              originalRow[`Variant ${vIdx} Price`],
            price
          );

          const rawVMrp = parseNum(
            row[`variant${vIdx}mrp`] ||
              row[`v${vIdx}mrp`] ||
              row[`variant${vIdx}originalprice`] ||
              originalRow[`Variant ${vIdx} - MRP ($)`] ||
              originalRow[`Variant ${vIdx} MRP`],
            rawVPrice || price
          );

          const rawVQty = Math.max(
            0,
            Math.floor(
              parseNum(
                row[`variant${vIdx}stockqty`] ||
                  row[`variant${vIdx}quantity`] ||
                  row[`variant${vIdx}qty`] ||
                  row[`v${vIdx}qty`] ||
                  originalRow[`Variant ${vIdx} - Stock Qty`] ||
                  originalRow[`Variant ${vIdx} Quantity`],
                quantity
              )
            )
          );

          const vPrice = rawVPrice < 0 ? 0 : rawVPrice;
          const vMrp = rawVMrp < vPrice ? vPrice : rawVMrp;
          const vDiscount = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;

          parsedVariants.push({
            name: vName,
            price: vPrice,
            mrp: vMrp,
            quantity: rawVQty,
            discount: vDiscount,
          });
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
          if (parsedIsActive !== undefined) {
            existingProduct.isActive = parsedIsActive;
          }
          if (parsedIsTaxable !== undefined) {
            existingProduct.isTaxable = parsedIsTaxable;
          }

          // CRITICAL INTEGRITY CHECK:
          // Only overwrite existing image if a real new Base64 or URL was provided.
          // Never overwrite an existing good photo with a blank or default placeholder!
          if (isNewImageProvided) {
            existingProduct.image = image;
            existingProduct.images = [
              image,
              ...(Array.isArray(existingProduct.images)
                ? existingProduct.images.filter((img: string) => img !== image)
                : []),
            ];
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
            isTaxable: parsedIsTaxable !== undefined ? parsedIsTaxable : true,
            image: finalImage,
            variants: parsedVariants,
            rating: 4.8,
            reviewsCount: 35,
            isActive: parsedIsActive !== undefined ? parsedIsActive : true,
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
