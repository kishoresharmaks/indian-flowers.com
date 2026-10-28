/**
 * Bulk Import Helpers for Indian-Flowers.com
 * Handles parsing, variant extraction, image matching, and duplicate checking
 */

export interface ParsedVariant {
  name: string;
  price: number;
  mrp: number;
  quantity: number;
  discount: number;
}

export interface ParsedImportRow {
  index: number;
  raw: Record<string, any>;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  mrp: number;
  quantity: number;
  gst: number;
  imageFilename: string;
  variants: ParsedVariant[];
  isUpdate: boolean;
  existingProduct?: {
    _id: string;
    name: string;
    price: number;
    mrp: number;
    image: string;
    category?: string;
  };
  matchedImageFile?: File | null;
  matchedPreviewUrl?: string | null;
  matchReason?: string;
}

export function cleanStringForMatch(str: string): string {
  if (!str) return '';
  // Extract base filename if a full directory path or URL was passed
  const clean = str.toString().split('?')[0].split('#')[0].trim();
  const segments = clean.split(/[/\\]/);
  const base = segments[segments.length - 1] || clean;
  return base
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/i, '') // strip extensions like .jpg, .png, .webp
    .replace(/[^a-z0-9]/g, '');
}

export function matchImageForProduct(
  imageFilename: string,
  productName: string,
  files: File[]
): { file: File | null; reason: string } {
  if (!files || files.length === 0) {
    return { file: null, reason: 'No images dropped' };
  }

  const cleanImg = cleanStringForMatch(imageFilename);
  const cleanProd = cleanStringForMatch(productName);

  // 1. Match by Image Filename if specified in Excel
  if (cleanImg) {
    const match = files.find((f) => cleanStringForMatch(f.name) === cleanImg);
    if (match) return { file: match, reason: `Matched filename: "${match.name}"` };
  }

  // 2. Match by Product Name if filename is missing or didn't match
  if (cleanProd) {
    const match = files.find((f) => cleanStringForMatch(f.name) === cleanProd);
    if (match) return { file: match, reason: `Matched product name: "${match.name}"` };
  }

  return { file: null, reason: 'No image matched' };
}

function safeCreateObjectURL(file: any): string | null {
  if (!file) return null;
  try {
    if (typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(file);
    }
  } catch {
    // Non-browser or test environment fallback
  }
  return null;
}

export function parseExcelRowsToImportItems(
  rawRows: any[],
  existingProducts: any[] = [],
  imageFiles: File[] = []
): ParsedImportRow[] {
  if (!Array.isArray(rawRows)) return [];

  const results: ParsedImportRow[] = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rawRow = rawRows[idx];
    if (!rawRow || typeof rawRow !== 'object') continue;

    // Normalize keys to lowercase alphanumeric
    const norm: Record<string, any> = {};
    for (const key of Object.keys(rawRow)) {
      const cleanK = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      norm[cleanK] = rawRow[key];
    }

    const name = (
      norm.productname ||
      norm.name ||
      norm.title ||
      norm.producttitle ||
      rawRow['Product Name *'] ||
      rawRow['Product Name'] ||
      rawRow['Name'] ||
      ''
    )
      .toString()
      .trim();

    // Skip empty rows without a product name
    if (!name) continue;

    const description = (
      norm.description ||
      norm.desc ||
      norm.details ||
      rawRow['Description *'] ||
      rawRow['Description'] ||
      name
    )
      .toString()
      .trim();

    const category = (
      norm.category ||
      norm.categoryname ||
      rawRow['Category *'] ||
      rawRow['Category'] ||
      'Indian Wedding Garlands'
    )
      .toString()
      .trim();

    const subcategory = (
      norm.subcategory ||
      norm.subcat ||
      norm.subcatname ||
      rawRow['Subcategory'] ||
      rawRow['Sub Category'] ||
      ''
    )
      .toString()
      .trim();

    const rawPrice = Number(
      norm.baseprice ||
        norm.price ||
        norm.sellingprice ||
        rawRow['Base Price ($) *'] ||
        rawRow['Base Price'] ||
        rawRow['Price'] ||
        0
    );

    const rawMrp = Number(
      norm.basemrp ||
        norm.mrp ||
        norm.originalprice ||
        rawRow['Base MRP ($) *'] ||
        rawRow['Base MRP'] ||
        rawRow['MRP'] ||
        rawPrice
    );

    const price = isNaN(rawPrice) || rawPrice < 0 ? 0 : rawPrice;
    const mrp = isNaN(rawMrp) || rawMrp < price ? price : rawMrp;
    const quantity = Number(norm.stockquantity || norm.quantity || norm.qty || norm.stock || 10) || 10;
    const gst = Number(norm.gsttax || norm.gst || norm.tax || 0) || 0;

    const imageFilename = (
      norm.image ||
      norm.imagefilename ||
      norm.imagefilenameegrosejpg ||
      norm.imageurl ||
      norm.photo ||
      rawRow['Image Filename'] ||
      rawRow['Image'] ||
      ''
    )
      .toString()
      .trim();

    // Extract variants (Separate Non-Technical Columns)
    const variants: ParsedVariant[] = [];
    for (let v = 1; v <= 8; v++) {
      const vName = (
        norm[`variant${v}name`] ||
        norm[`variant${v}`] ||
        norm[`v${v}name`] ||
        rawRow[`Variant ${v} - Name`] ||
        rawRow[`Variant ${v} Name`] ||
        ''
      )
        .toString()
        .trim();

      if (!vName) continue;

      const vPrice =
        Number(
          norm[`variant${v}price`] ||
            norm[`v${v}price`] ||
            norm[`variant${v}sellingprice`] ||
            rawRow[`Variant ${v} - Price ($)`] ||
            rawRow[`Variant ${v} Price`] ||
            price
        ) || price;

      const vMrp =
        Number(
          norm[`variant${v}mrp`] ||
            norm[`v${v}mrp`] ||
            norm[`variant${v}originalprice`] ||
            rawRow[`Variant ${v} - MRP ($)`] ||
            rawRow[`Variant ${v} MRP`] ||
            vPrice
        ) || vPrice;

      const vQty =
        Number(
          norm[`variant${v}stockqty`] ||
            norm[`variant${v}quantity`] ||
            norm[`variant${v}qty`] ||
            norm[`v${v}qty`] ||
            rawRow[`Variant ${v} - Stock Qty`] ||
            rawRow[`Variant ${v} Quantity`] ||
            quantity
        ) || quantity;

      const finalVPrice = vPrice < 0 ? 0 : vPrice;
      const finalVMrp = vMrp < finalVPrice ? finalVPrice : vMrp;
      const vDiscount =
        finalVMrp > finalVPrice ? Math.round(((finalVMrp - finalVPrice) / finalVMrp) * 100) : 0;

      variants.push({
        name: vName,
        price: finalVPrice,
        mrp: finalVMrp,
        quantity: vQty < 0 ? 0 : Math.floor(vQty),
        discount: vDiscount,
      });
    }

    // Semicolon/colon fallback if no separate columns provided
    if (variants.length === 0) {
      const rawVStr = (norm.variants || norm.variant || rawRow['Variants'] || '')
        .toString()
        .trim();
      if (rawVStr) {
        const parts = rawVStr.split(';').map((s: string) => s.trim()).filter(Boolean);
        for (const p of parts) {
          const segs = p.split(':').map((s: string) => s.trim());
          const vName = segs[0] || 'Standard';
          const vPrice = Number(segs[1]) || price;
          const vMrp = Number(segs[2]) || mrp;
          const vQty = Number(segs[3]) !== undefined && !isNaN(Number(segs[3])) ? Number(segs[3]) : quantity;
          const vDiscount = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
          variants.push({
            name: vName,
            price: vPrice,
            mrp: vMrp >= vPrice ? vMrp : vPrice,
            quantity: vQty,
            discount: vDiscount,
          });
        }
      }
    }

    // Duplicate check against existing store products
    const existing = existingProducts.find(
      (p) => p && p.name && p.name.trim().toLowerCase() === name.toLowerCase()
    );

    // Image matching from dropped files
    const { file: matchedFile, reason: matchReason } = matchImageForProduct(
      imageFilename,
      name,
      imageFiles
    );

    results.push({
      index: idx,
      raw: rawRow,
      name,
      description,
      category,
      subcategory,
      price,
      mrp,
      quantity,
      gst,
      imageFilename,
      variants,
      isUpdate: Boolean(existing),
      existingProduct: existing
        ? {
            _id: existing._id,
            name: existing.name,
            price: existing.price,
            mrp: existing.mrp,
            image: existing.image,
            category: existing.category,
          }
        : undefined,
      matchedImageFile: matchedFile,
      matchedPreviewUrl: safeCreateObjectURL(matchedFile),
      matchReason,
    });
  }

  return results;
}
