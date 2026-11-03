import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { sanitizeProductDescription } from '@/lib/bulkImportHelpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Cleanly extracts only the image filename from a full path or URL.
 * e.g. "/wp-content/uploads/2024/11/Rose-Petal-Garlands-RP40-1.webp" -> "Rose-Petal-Garlands-RP40-1.webp"
 */
function extractImageFilename(imagePath: string | undefined | null): string {
  if (!imagePath || typeof imagePath !== 'string') return '';
  const clean = imagePath.split('?')[0].split('#')[0].trim();
  if (!clean) return '';
  const segments = clean.split(/[/\\]/);
  return segments[segments.length - 1] || '';
}

/**
 * Extracts comma-separated filenames from an array of image paths
 */
function extractAllFilenames(images: string[] | undefined | null): string {
  if (!Array.isArray(images) || images.length === 0) return '';
  return images
    .map((img) => extractImageFilename(img))
    .filter(Boolean)
    .join(', ');
}

/**
 * Strips HTML tags and entities for clean Excel text cell rendering
 */
function stripHtml(html: string | undefined | null): string {
  return sanitizeProductDescription(html);
}

function formatVariantsString(variants: any[] | undefined): string {
  if (!Array.isArray(variants) || variants.length === 0) return '';
  return variants
    .map(
      (v) =>
        `${(v.name || 'Standard').trim()}: ${Number(v.price ?? 0)}: ${Number(v.mrp ?? v.price ?? 0)}: ${Number(
          v.quantity ?? 10
        )}`
    )
    .join('; ');
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Builds catalog columns dynamically:
 * Base catalog columns followed by distinct columns for each variant (up to maxVariants, min 4),
 * and finally the combined 'Product Variants & Pricing' column for backward compatibility.
 */
function getCatalogColumns(maxVariants: number) {
  const baseCols = [
    { header: 'Product Title', key: 'title', width: 42 },
    { header: 'Product Slug', key: 'slug', width: 36 },
    { header: 'Product Description', key: 'description', width: 55 },
    { header: 'Product Image name of the image file to import', key: 'imageFilename', width: 44 },
    { header: 'MRP (Original $) *', key: 'mrp', width: 20 },
    { header: 'Selling Price ($) *', key: 'price', width: 20 },
    { header: 'Stock Quantity *', key: 'quantity', width: 18 },
    { header: 'Category *', key: 'category', width: 28 },
    { header: 'Sales Tax Status', key: 'salesTaxStatus', width: 20 },
    { header: 'Subcategory (Optional)', key: 'subcategory', width: 26 },
    { header: 'Storefront Visibility', key: 'visibility', width: 22 },
  ];

  const variantCols = [];
  for (let i = 1; i <= maxVariants; i++) {
    variantCols.push(
      { header: `Variant ${i} - Name`, key: `v${i}_name`, width: 24 },
      { header: `Variant ${i} - Price ($)`, key: `v${i}_price`, width: 18 },
      { header: `Variant ${i} - MRP ($)`, key: `v${i}_mrp`, width: 18 },
      { header: `Variant ${i} - Stock Qty`, key: `v${i}_quantity`, width: 18 }
    );
  }

  // Combined convenience column
  variantCols.push({ header: 'Product Variants & Pricing', key: 'variants', width: 48 });

  return [...baseCols, ...variantCols];
}

/**
 * Builds and formats a products worksheet with custom styling, auto-filter, and highlighted image filename
 */
function buildProductWorksheet(wb: ExcelJS.Workbook, sheetName: string, products: any[]) {
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  const maxBatchVariants = products.reduce((max, p) => {
    return Math.max(max, Array.isArray(p.variants) ? p.variants.length : 0);
  }, 0);
  const maxVariants = Math.max(4, Math.min(15, maxBatchVariants));
  const columns = getCatalogColumns(maxVariants);

  ws.columns = columns;

  // Auto-filter
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  // Style Header Row 1
  const headerRow = ws.getRow(1);
  headerRow.height = 36;

  for (let colIdx = 1; colIdx <= columns.length; colIdx++) {
    const cell = headerRow.getCell(colIdx);
    let fillArgb = 'FF0B3B24'; // Default Brand Forest Green (Cols 1, 3: Title, Description)

    if (colIdx === 2) {
      fillArgb = 'FF134633'; // Brand 900 (Product Slug)
    } else if (colIdx === 4) {
      fillArgb = 'FF0E7490'; // Standout Cyan/Teal (Image Filename)
    } else if (colIdx >= 5 && colIdx <= 7) {
      fillArgb = 'FF134633'; // Pricing & Stock (MRP, Selling Price, Quantity)
    } else if (colIdx >= 8 && colIdx <= 10) {
      fillArgb = 'FF1C563F'; // Category, Sales Tax Status, Subcategory
    } else if (colIdx === 11) {
      fillArgb = 'FF1E3A8A'; // Storefront Visibility
    } else {
      fillArgb = 'FF9F1239'; // Variant columns (Rose Accent)
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

  // Populate Product Rows
  products.forEach((p: any, idx: number) => {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const images = Array.isArray(p.images) ? p.images : p.image ? [p.image] : [];
    const primaryImage = p.image || images[0] || '';
    const imageFilename = extractImageFilename(primaryImage);

    const cleanDesc = stripHtml(p.description || '');
    const stockQty = Number(p.quantity ?? 0);
    const mrpVal = Number(p.mrp ?? p.price ?? 0);
    const priceVal = Number(p.price ?? 0);
    const taxStatus = p.isTaxable === false ? 'Non-Taxable' : 'Taxable';
    const visibility = p.isActive !== false ? 'Visible' : 'Hidden';
    const productSlug = p.slug || (p.name ? slugify(p.name) : '');

    const rowData: Record<string, any> = {
      title: p.name || '',
      slug: productSlug,
      description: cleanDesc,
      imageFilename: imageFilename,
      mrp: mrpVal,
      price: priceVal,
      quantity: stockQty,
      category: p.category || 'Indian Wedding Garlands',
      salesTaxStatus: taxStatus,
      subcategory: p.subcategory || '',
      visibility: visibility,
    };

    // Populate separate variant columns
    for (let i = 1; i <= maxVariants; i++) {
      const v = variants[i - 1];
      rowData[`v${i}_name`] = v ? v.name || '' : '';
      rowData[`v${i}_price`] = v && v.price !== undefined && v.price !== null ? Number(v.price) : '';
      rowData[`v${i}_mrp`] = v && (v.mrp !== undefined || v.price !== undefined) ? Number(v.mrp ?? v.price) : '';
      rowData[`v${i}_quantity`] = v && v.quantity !== undefined ? Number(v.quantity) : '';
    }

    rowData['variants'] = formatVariantsString(variants);

    const row = ws.addRow(rowData);
    row.height = 24;

    const isEven = idx % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    for (let c = 1; c <= columns.length; c++) {
      const cell = row.getCell(c);
      const colDef = columns[c - 1];
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

      // Col 2: Product Slug - Clean Monospace
      if (c === 2) {
        cell.font = { name: 'Consolas', size: 9.5, color: { argb: 'FF334155' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
      // Col 4: Image Filename - Monospace & Teal highlight
      else if (c === 4) {
        cell.font = { name: 'Consolas', size: 10, bold: true, color: { argb: 'FF0E7490' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF0FDFA' : 'FFE6FFFA' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
      // Pricing cells (Base MRP, Base Price, or Variant Price / MRP)
      else if (c === 5 || c === 6 || (colDef && (colDef.key.endsWith('_price') || colDef.key.endsWith('_mrp')))) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (typeof cell.value === 'number') {
          cell.numFmt = '$#,##0.00';
        }
        if (c === 6 || (colDef && colDef.key.endsWith('_price'))) {
          cell.font = { name: 'Segoe UI', size: 10, bold: true };
        }
      }
      // Quantity cells (Base Stock or Variant Quantity)
      else if (c === 7 || (colDef && colDef.key.endsWith('_quantity'))) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
      }
      // Col 9: Sales Tax Status - Center
      else if (c === 9) {
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

  return ws;
}

/**
 * Builds Summary Sheet
 */
function buildSummaryWorksheet(
  wb: ExcelJS.Workbook,
  sheetTitle: string,
  coreProducts: any[],
  seoProducts: any[],
  catalogType: string
) {
  const wsSummary = wb.addWorksheet(sheetTitle);
  wsSummary.views = [{ showGridLines: true }];

  wsSummary.columns = [
    { header: 'Metric / Category', key: 'label', width: 35 },
    { header: 'Value / Product Count', key: 'value', width: 30 },
    { header: 'Notes / Percentage', key: 'notes', width: 40 },
  ];

  const sumHeader = wsSummary.getRow(1);
  sumHeader.height = 32;
  for (let c = 1; c <= 3; c++) {
    const cell = sumHeader.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3B24' } };
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: c === 2 ? 'center' : 'left' };
  }

  const coreCount = coreProducts.length;
  const seoCount = seoProducts.length;
  const totalCount = coreCount + seoCount;

  const inStockCore = coreProducts.filter((p: any) => (p.quantity ?? 0) > 5).length;
  const lowStockCore = coreProducts.filter((p: any) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 5).length;
  const outOfStockCore = coreProducts.filter((p: any) => (p.quantity ?? 0) <= 0).length;
  const withImagesCore = coreProducts.filter((p: any) => Boolean(p.image && p.image.trim())).length;

  const categoryCounts: Record<string, number> = {};
  coreProducts.forEach((p: any) => {
    const cat = p.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const summaryData: { label: string; value: any; notes: string; isHeader?: boolean }[] = [
    { label: '--- CATALOG SEGMENTATION OVERVIEW ---', value: '', notes: '', isHeader: true },
    {
      label: 'Export Timestamp',
      value: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      notes: 'Live MongoDB Snapshot',
    },
    {
      label: 'Export Scope Selected',
      value: catalogType === 'core' ? 'Core Catalog Products (Clean)' : catalogType === 'seo' ? 'SEO Landing Pages Only' : 'All Products (Multi-Tab)',
      notes: 'Separated to eliminate state-name repetition',
    },
    {
      label: 'Core Store Products (Clean Catalog)',
      value: coreCount,
      notes: 'Authentic products for daily sales & image updates',
    },
    {
      label: 'Programmatic State SEO Pages',
      value: seoCount,
      notes: 'City/State landing pages for Google Organic SEO',
    },
    {
      label: 'Total Products in Store Database',
      value: totalCount,
      notes: '100% complete database records',
    },
    { label: '', value: '', notes: '' },
    { label: '--- CORE CATALOG INVENTORY METRICS ---', value: '', notes: '', isHeader: true },
    {
      label: 'Core Products with Image Filenames',
      value: withImagesCore,
      notes: `${coreCount ? Math.round((withImagesCore / coreCount) * 100) : 0}% image coverage`,
    },
    { label: 'In-Stock Core Items (> 5 qty)', value: inStockCore, notes: 'Active storefront inventory' },
    { label: 'Low-Stock Core Items (1-5 qty)', value: lowStockCore, notes: 'Restock recommended' },
    { label: 'Out-of-Stock Core Items (0 qty)', value: outOfStockCore, notes: 'Marked as Sold Out' },
    { label: '', value: '', notes: '' },
    { label: '--- CORE CATEGORY BREAKDOWN ---', value: '', notes: '', isHeader: true },
  ];

  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      summaryData.push({
        label: cat,
        value: count,
        notes: `${coreCount ? ((count / coreCount) * 100).toFixed(1) : 0}% of core catalog`,
      });
    });

  summaryData.forEach((item) => {
    const r = wsSummary.addRow({ label: item.label, value: item.value, notes: item.notes });
    r.height = 24;
    for (let c = 1; c <= 3; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: c === 2 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (item.isHeader) {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0B3B24' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      }
    }
  });

  return wsSummary;
}

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && !isAuthenticatedAdmin(request)) {
      return unauthenticatedResponse();
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    // catalogType: 'core' (default: 317 items without state spam) | 'seo' (1656 state pages) | 'all' (multi-tab)
    const catalogType = (searchParams.get('catalogType') || 'core').toLowerCase();
    const scope = searchParams.get('scope') || 'all';
    const category = searchParams.get('category');
    const stock = searchParams.get('stock');
    const search = searchParams.get('search');

    // Build base filters
    const userFilter: Record<string, any> = {};

    if (scope === 'filtered') {
      if (category && category !== 'All') {
        if (category === '__legacy_brass__') {
          userFilter.category = { $regex: '^brass', $options: 'i' };
        } else {
          const catTrimmed = category.trim();
          userFilter.$or = [
            { category: { $regex: new RegExp(`^${catTrimmed}$`, 'i') } },
            { categorySlug: catTrimmed.toLowerCase() },
            { parentCategorySlug: catTrimmed.toLowerCase() },
          ];
        }
      }

      if (stock === 'inStock') {
        userFilter.quantity = { $gt: 5 };
      } else if (stock === 'lowStock') {
        userFilter.quantity = { $gt: 0, $lte: 5 };
      } else if (stock === 'outOfStock') {
        userFilter.quantity = { $lte: 0 };
      }

      if (search && search.trim()) {
        const s = search.trim();
        userFilter.$or = [
          { name: { $regex: s, $options: 'i' } },
          { slug: { $regex: s, $options: 'i' } },
          { category: { $regex: s, $options: 'i' } },
          { subcategory: { $regex: s, $options: 'i' } },
        ];
      }
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Indian-Flowers.com Admin CMS';
    wb.lastModifiedBy = 'Indian-Flowers.com Admin CMS';
    wb.created = new Date();
    wb.modified = new Date();

    const dateStamp = new Date().toISOString().split('T')[0];
    let filename = `IndianFlowers_Core_Products_${dateStamp}.xlsx`;

    if (catalogType === 'core') {
      // 1. DEFAULT: Only Core Store Products (Clean, no state-name spam)
      const coreProducts = await Product.find({
        ...userFilter,
        isSeoLanding: { $ne: true },
        hideFromHome: { $ne: true },
      })
        .sort({ category: 1, name: 1 })
        .lean();

      buildProductWorksheet(wb, 'Core Catalog Products', coreProducts);
      filename = `IndianFlowers_Core_Catalog_Export_${dateStamp}.xlsx`;
    } else if (catalogType === 'seo') {
      // 2. SEO State Landing Pages Only
      const seoProducts = await Product.find({
        ...userFilter,
        $or: [{ isSeoLanding: true }, { hideFromHome: true }],
      })
        .sort({ category: 1, name: 1 })
        .lean();

      buildProductWorksheet(wb, 'State SEO Landing Pages', seoProducts);
      buildSummaryWorksheet(wb, 'Export Summary', [], seoProducts, 'seo');
      filename = `IndianFlowers_State_SEO_Landing_Pages_${dateStamp}.xlsx`;
    } else {
      // 3. ALL PRODUCTS: Divided cleanly into separate worksheets!
      const [coreProducts, seoProducts] = await Promise.all([
        Product.find({
          ...userFilter,
          isSeoLanding: { $ne: true },
          hideFromHome: { $ne: true },
        })
          .sort({ category: 1, name: 1 })
          .lean(),
        Product.find({
          ...userFilter,
          $or: [{ isSeoLanding: true }, { hideFromHome: true }],
        })
          .sort({ category: 1, name: 1 })
          .lean(),
      ]);

      buildProductWorksheet(wb, 'Core Catalog Products', coreProducts);
      buildProductWorksheet(wb, 'State SEO Landing Pages', seoProducts);
      buildSummaryWorksheet(wb, 'Export Summary', coreProducts, seoProducts, 'all');
      filename = `IndianFlowers_Complete_Catalog_All_${dateStamp}.xlsx`;
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Failed to export products to Excel:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to export products to Excel' },
      { status: 500 }
    );
  }
}
