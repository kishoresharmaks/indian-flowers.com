import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

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
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<br\s*[\/]?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats variants as a semicolon-delimited token string for easy bulk re-import
 */
function formatVariantsString(variants: any[] | undefined): string {
  if (!Array.isArray(variants) || variants.length === 0) return '';
  return variants
    .map(
      (v) =>
        `${(v.name || 'Standard').trim()}:${Number(v.price || 0)}:${Number(v.mrp || v.price || 0)}:${Number(
          v.quantity || 0
        )}`
    )
    .join('; ');
}

/**
 * Shared Columns Definition for Product Catalog Worksheets
 */
const CATALOG_COLUMNS = [
  // 1. Identifiers & Catalog Structure (Brand Dark Forest Green)
  { header: 'Product ID', key: 'id', width: 26 },
  { header: 'Product Name *', key: 'name', width: 42 },
  { header: 'Slug', key: 'slug', width: 36 },
  { header: 'WordPress ID', key: 'wpId', width: 15 },
  { header: 'Category *', key: 'category', width: 28 },
  { header: 'Subcategory', key: 'subcategory', width: 26 },
  { header: 'Category Slug', key: 'categorySlug', width: 24 },
  { header: 'Parent Category Slug', key: 'parentCategorySlug', width: 24 },

  // 2. Pricing & Inventory (Deep Forest Green)
  { header: 'Base Price ($) *', key: 'price', width: 16 },
  { header: 'Base MRP ($) *', key: 'mrp', width: 16 },
  { header: 'Discount %', key: 'discount', width: 14 },
  { header: 'Stock Quantity', key: 'quantity', width: 16 },
  { header: 'Stock Status', key: 'stockStatus', width: 16 },
  { header: 'GST Tax %', key: 'gst', width: 14 },
  { header: 'Is Taxable', key: 'isTaxable', width: 14 },
  { header: 'Tax Code', key: 'taxCode', width: 16 },

  // 3. IMAGE COLUMNS (Standout Cyan/Teal #0E7490 - User Requested Focus!)
  { header: 'Image Filename', key: 'imageFilename', width: 38 },
  { header: 'Image Full Path / URL', key: 'imagePath', width: 52 },
  { header: 'Gallery Image Filenames', key: 'galleryFilenames', width: 44 },
  { header: 'Gallery Image Paths', key: 'galleryPaths', width: 60 },

  // 4. Variants Columns (Direct Bulk Import Compatible)
  // Variant 1 (Deep Rose #9F1239)
  { header: 'Variant 1 - Name', key: 'v1_name', width: 24 },
  { header: 'Variant 1 - Price ($)', key: 'v1_price', width: 18 },
  { header: 'Variant 1 - MRP ($)', key: 'v1_mrp', width: 18 },
  { header: 'Variant 1 - Stock Qty', key: 'v1_qty', width: 18 },

  // Variant 2 (Deep Indigo #4338CA)
  { header: 'Variant 2 - Name', key: 'v2_name', width: 24 },
  { header: 'Variant 2 - Price ($)', key: 'v2_price', width: 18 },
  { header: 'Variant 2 - MRP ($)', key: 'v2_mrp', width: 18 },
  { header: 'Variant 2 - Stock Qty', key: 'v2_qty', width: 18 },

  // Variant 3 (Warm Amber #B45309)
  { header: 'Variant 3 - Name', key: 'v3_name', width: 24 },
  { header: 'Variant 3 - Price ($)', key: 'v3_price', width: 18 },
  { header: 'Variant 3 - MRP ($)', key: 'v3_mrp', width: 18 },
  { header: 'Variant 3 - Stock Qty', key: 'v3_qty', width: 18 },

  // Variant 4 (Slate #475569)
  { header: 'Variant 4 - Name', key: 'v4_name', width: 24 },
  { header: 'Variant 4 - Price ($)', key: 'v4_price', width: 18 },
  { header: 'Variant 4 - MRP ($)', key: 'v4_mrp', width: 18 },
  { header: 'Variant 4 - Stock Qty', key: 'v4_qty', width: 18 },

  // Variant 5
  { header: 'Variant 5 - Name', key: 'v5_name', width: 24 },
  { header: 'Variant 5 - Price ($)', key: 'v5_price', width: 18 },
  { header: 'Variant 5 - MRP ($)', key: 'v5_mrp', width: 18 },
  { header: 'Variant 5 - Stock Qty', key: 'v5_qty', width: 18 },

  // Variant 6
  { header: 'Variant 6 - Name', key: 'v6_name', width: 24 },
  { header: 'Variant 6 - Price ($)', key: 'v6_price', width: 18 },
  { header: 'Variant 6 - MRP ($)', key: 'v6_mrp', width: 18 },
  { header: 'Variant 6 - Stock Qty', key: 'v6_qty', width: 18 },

  // Variant 7
  { header: 'Variant 7 - Name', key: 'v7_name', width: 24 },
  { header: 'Variant 7 - Price ($)', key: 'v7_price', width: 18 },
  { header: 'Variant 7 - MRP ($)', key: 'v7_mrp', width: 18 },
  { header: 'Variant 7 - Stock Qty', key: 'v7_qty', width: 18 },

  // Variant 8
  { header: 'Variant 8 - Name', key: 'v8_name', width: 24 },
  { header: 'Variant 8 - Price ($)', key: 'v8_price', width: 18 },
  { header: 'Variant 8 - MRP ($)', key: 'v8_mrp', width: 18 },
  { header: 'Variant 8 - Stock Qty', key: 'v8_qty', width: 18 },

  // Compact Variants String & Count
  { header: 'All Variants String', key: 'variantsString', width: 44 },
  { header: 'Variants Count', key: 'variantsCount', width: 15 },

  // 5. Storefront & SEO Details
  { header: 'Rating', key: 'rating', width: 12 },
  { header: 'Reviews Count', key: 'reviewsCount', width: 15 },
  { header: 'SEO Landing Page', key: 'isSeoLanding', width: 18 },
  { header: 'Hide From Home', key: 'hideFromHome', width: 16 },
  { header: 'Tags', key: 'tags', width: 40 },
  { header: 'Attributes / Sizes', key: 'attributes', width: 32 },

  // 6. Descriptions
  { header: 'Description', key: 'description', width: 65 },
  { header: 'Short Description', key: 'shortDescription', width: 45 },
  { header: 'Description HTML', key: 'descriptionHtml', width: 65 },

  // 7. Audit Timestamps
  { header: 'Created At', key: 'createdAt', width: 22 },
  { header: 'Updated At', key: 'updatedAt', width: 22 },
];

/**
 * Builds and formats a products worksheet with custom styling, auto-filter, and highlighted image filename
 */
function buildProductWorksheet(wb: ExcelJS.Workbook, sheetName: string, products: any[]) {
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  ws.columns = CATALOG_COLUMNS;

  // Auto-filter
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: CATALOG_COLUMNS.length },
  };

  // Style Header Row 1
  const headerRow = ws.getRow(1);
  headerRow.height = 36;

  for (let colIdx = 1; colIdx <= CATALOG_COLUMNS.length; colIdx++) {
    const cell = headerRow.getCell(colIdx);
    let fillArgb = 'FF0B3B24'; // Default Forest Green (Cols 1-8: ID, Name, Slug, Category)

    if (colIdx >= 9 && colIdx <= 16) {
      fillArgb = 'FF134633'; // Pricing & Inventory
    } else if (colIdx >= 17 && colIdx <= 20) {
      fillArgb = 'FF0E7490'; // IMAGE FILENAME & IMAGE PATHS (Cyan/Teal Standout!)
    } else if (colIdx >= 21 && colIdx <= 24) {
      fillArgb = 'FF9F1239'; // Variant 1 (Deep Rose)
    } else if (colIdx >= 25 && colIdx <= 28) {
      fillArgb = 'FF4338CA'; // Variant 2 (Deep Indigo)
    } else if (colIdx >= 29 && colIdx <= 32) {
      fillArgb = 'FFB45309'; // Variant 3 (Warm Amber)
    } else if (colIdx >= 33 && colIdx <= 36) {
      fillArgb = 'FF334155'; // Variant 4 (Slate)
    } else if (colIdx >= 37 && colIdx <= 40) {
      fillArgb = 'FF475569'; // Variant 5 (Slate Dark)
    } else if (colIdx >= 41 && colIdx <= 44) {
      fillArgb = 'FF64748B'; // Variant 6 (Slate Medium)
    } else if (colIdx >= 45 && colIdx <= 48) {
      fillArgb = 'FF78716C'; // Variant 7 (Stone)
    } else if (colIdx >= 49 && colIdx <= 52) {
      fillArgb = 'FF57534E'; // Variant 8 (Stone Dark)
    } else if (colIdx >= 53 && colIdx <= 54) {
      fillArgb = 'FF1E293B'; // Variants Summary String & Count
    } else if (colIdx >= 55 && colIdx <= 60) {
      fillArgb = 'FF1E3A8A'; // Storefront, Rating & SEO
    } else if (colIdx >= 61 && colIdx <= 63) {
      fillArgb = 'FF374151'; // Descriptions
    } else {
      fillArgb = 'FF1F2937'; // Timestamps
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
    const galleryFilenames = extractAllFilenames(images);
    const galleryPaths = images.join(', ');

    const cleanDesc = stripHtml(p.description || '');
    const shortDesc = stripHtml(p.shortDescription || '');
    const descHtml = p.descriptionHtml || p.description || '';

    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : '';
    const attributes = Array.isArray(p.attributes)
      ? p.attributes
          .map((a: any) => `${a.name || 'attr'}: ${Array.isArray(a.terms) ? a.terms.join(', ') : ''}`)
          .join(' | ')
      : '';

    const stockQty = Number(p.quantity ?? 0);
    let stockStatus = 'In Stock';
    if (stockQty <= 0) stockStatus = 'Out of Stock';
    else if (stockQty <= 5) stockStatus = 'Low Stock';

    const createdAtStr = p.createdAt ? new Date(p.createdAt).toISOString().replace('T', ' ').substring(0, 19) : '';
    const updatedAtStr = p.updatedAt ? new Date(p.updatedAt).toISOString().replace('T', ' ').substring(0, 19) : '';

    const rowData: Record<string, any> = {
      id: p._id?.toString() || '',
      name: p.name || '',
      slug: p.slug || '',
      wpId: p.wpId ? Number(p.wpId) : '',
      category: p.category || '',
      subcategory: p.subcategory || '',
      categorySlug: p.categorySlug || '',
      parentCategorySlug: p.parentCategorySlug || '',

      price: Number(p.price ?? 0),
      mrp: Number(p.mrp ?? p.price ?? 0),
      discount: Number(p.discount ?? 0),
      quantity: stockQty,
      stockStatus,
      gst: Number(p.gst ?? 0),
      isTaxable: p.isTaxable !== false ? 'YES' : 'NO',
      taxCode: p.taxCode || '',

      // Image Filename (Standout Cyan/Teal focus)
      imageFilename,
      imagePath: primaryImage,
      galleryFilenames,
      galleryPaths,

      variantsString: formatVariantsString(variants),
      variantsCount: variants.length,

      rating: Number(p.rating ?? 4.8),
      reviewsCount: Number(p.reviewsCount ?? 0),
      isSeoLanding: p.isSeoLanding ? 'YES' : 'NO',
      hideFromHome: p.hideFromHome ? 'YES' : 'NO',
      tags,
      attributes,

      description: cleanDesc,
      shortDescription: shortDesc,
      descriptionHtml: descHtml,

      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };

    // Populate up to 8 variants columns
    for (let v = 1; v <= 8; v++) {
      const variant = variants[v - 1];
      if (variant) {
        rowData[`v${v}_name`] = variant.name || `Variant ${v}`;
        rowData[`v${v}_price`] = Number(variant.price ?? p.price ?? 0);
        rowData[`v${v}_mrp`] = Number(variant.mrp ?? variant.price ?? p.mrp ?? 0);
        rowData[`v${v}_qty`] = Number(variant.quantity ?? 10);
      } else {
        rowData[`v${v}_name`] = '';
        rowData[`v${v}_price`] = '';
        rowData[`v${v}_mrp`] = '';
        rowData[`v${v}_qty`] = '';
      }
    }

    const row = ws.addRow(rowData);
    row.height = 24;

    const isEven = idx % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    for (let c = 1; c <= CATALOG_COLUMNS.length; c++) {
      const cell = row.getCell(c);
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

      // Currency columns
      if ([9, 10, 22, 23, 26, 27, 30, 31, 34, 35, 38, 39, 42, 43, 46, 47, 50, 51].includes(c)) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (typeof cell.value === 'number') {
          cell.numFmt = '$#,##0.00';
        }
      }
      // Quantity & percentage columns
      else if ([11, 12, 14, 24, 28, 32, 36, 40, 44, 48, 52, 54, 55, 56].includes(c)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      // Image Filename (Column 17) - Highlight with monospace & soft teal background
      else if (c === 17) {
        cell.font = { name: 'Consolas', size: 10, bold: true, color: { argb: 'FF0E7490' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF0FDFA' : 'FFE6FFFA' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
      // Status & Flags
      else if ([13, 15, 57, 58].includes(c)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (cell.value === 'In Stock') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
        } else if (cell.value === 'Out of Stock') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
        } else if (cell.value === 'Low Stock') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB45309' } };
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
        userFilter.category = category;
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
      buildSummaryWorksheet(wb, 'Export Summary', coreProducts, [], 'core');
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
