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

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export interface ParsedImportRow {
  index: number;
  raw: Record<string, any>;
  name: string;
  slug?: string;
  description: string;
  category: string;
  secondaryCategories?: string[];
  subcategory: string;
  price: number;
  mrp: number;
  quantity: number;
  gst: number;
  isTaxable?: boolean;
  isActive?: boolean;
  imageFilename: string;
  variants: ParsedVariant[];
  isUpdate: boolean;
  isUnchanged: boolean;
  changedFields: string[];
  existingProduct?: {
    _id: string;
    name: string;
    slug?: string;
    price: number;
    mrp: number;
    image: string;
    category?: string;
    subcategory?: string;
    categories?: Array<{ name: string; slug: string }>;
    quantity?: number;
    gst?: number;
    isActive?: boolean;
    isTaxable?: boolean;
    description?: string;
    variants?: ParsedVariant[];
  };
  matchedImageFile?: File | null;
  matchedPreviewUrl?: string | null;
  matchReason?: string;
  issues: string[];
  isValid: boolean;
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

export function sanitizeProductDescription(html: any): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*[\/]?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/h[1-6]>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8211;|–/g, '-')
    .replace(/&#8212;|—/g, '-')
    .replace(/&#8216;|&#8217;|&apos;|&#039;|'/g, "'")
    .replace(/&#8220;|&#8221;|&quot;|"/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const normalizeDescriptionText = sanitizeProductDescription;

export function areVariantsEqual(v1: any[] = [], v2: any[] = []): boolean {
  const list1 = Array.isArray(v1) ? v1 : [];
  const list2 = Array.isArray(v2) ? v2 : [];
  if (list1.length !== list2.length) return false;
  if (list1.length === 0 && list2.length === 0) return true;

  const norm1 = [...list1]
    .map((v) => ({
      name: String(v.name || '').trim().toLowerCase(),
      price: Number(v.price || 0),
      mrp: Number(v.mrp ?? v.price ?? 0),
      quantity: Number(v.quantity ?? 10),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const norm2 = [...list2]
    .map((v) => ({
      name: String(v.name || '').trim().toLowerCase(),
      price: Number(v.price || 0),
      mrp: Number(v.mrp ?? v.price ?? 0),
      quantity: Number(v.quantity ?? 10),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return norm1.every((item, idx) => {
    const other = norm2[idx];
    return (
      item.name === other.name &&
      Math.abs(item.price - other.price) < 0.01 &&
      Math.abs(item.mrp - other.mrp) < 0.01 &&
      item.quantity === other.quantity
    );
  });
}

export function parseExcelRowsToImportItems(
  rawRows: any[],
  existingProducts: any[] = [],
  imageFiles: File[] = [],
  categories: Array<{ name: string; slug?: string; subcategories?: Array<{ name: string; slug?: string }> }> = []
): ParsedImportRow[] {
  if (!Array.isArray(rawRows)) return [];

  const results: ParsedImportRow[] = [];
  const names = new Set<string>();

  // Helper to safely parse numeric currencies / quantities
  const parseNum = (val: any, fallback = 0): number => {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    if (!val) return fallback;
    const cleanVal = String(val).replace(/[^0-9.-]/g, '').trim();
    const num = parseFloat(cleanVal);
    return isNaN(num) ? fallback : num;
  };

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rawRow = rawRows[idx];
    if (!rawRow || typeof rawRow !== 'object') continue;

    // Normalize keys to lowercase alphanumeric
    const norm: Record<string, any> = {};
    for (const key of Object.keys(rawRow)) {
      const cleanK = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      norm[cleanK] = rawRow[key];
    }

    // 1. Extract Product Title / Name
    const name = (
      rawRow['Product Title'] ||
      rawRow['Product Title *'] ||
      norm.producttitle ||
      norm.productname ||
      norm.name ||
      norm.title ||
      rawRow['Product Name *'] ||
      rawRow['Product Name'] ||
      rawRow['Title'] ||
      rawRow['Name'] ||
      ''
    )
      .toString()
      .trim();

    // Skip empty rows without a product name
    if (!name) continue;

    // 1b. Extract Product Slug
    const rawSlug = (
      rawRow['Product Slug'] ||
      rawRow['Product Slug *'] ||
      rawRow['Slug'] ||
      rawRow['Slug *'] ||
      rawRow['Product slug'] ||
      rawRow['product_slug'] ||
      norm.productslug ||
      norm.slug ||
      ''
    )
      .toString()
      .trim();

    const slug = rawSlug ? slugify(rawSlug) : slugify(name);

    // 2. Extract Product Description
    const description = (
      rawRow['Product Description'] ||
      rawRow['Product Description *'] ||
      norm.productdescription ||
      norm.description ||
      norm.desc ||
      norm.details ||
      rawRow['Description *'] ||
      rawRow['Description'] ||
      name
    )
      .toString()
      .trim();

    // 3. Extract Image Filename
    const imageFilename = (
      rawRow['Product Image name of the image file to import'] ||
      rawRow['Product Image Name of the Image File to Import'] ||
      norm.productimagenameoftheimagefiletoimport ||
      norm.imagefilename ||
      norm.image ||
      norm.imagename ||
      norm.imagefilenameegrosejpg ||
      norm.imageurl ||
      norm.photo ||
      rawRow['Image Filename'] ||
      rawRow['Image'] ||
      ''
    )
      .toString()
      .trim();

    // 4. Extract Pricing: MRP & Selling Price
    const rawMrp = parseNum(
      rawRow['MRP (Original $) *'] ||
        rawRow['MRP (Original $)'] ||
        norm.mrporiginal ||
        norm.mrporiginalprice ||
        norm.basemrp ||
        norm.mrp ||
        norm.originalprice ||
        rawRow['Base MRP ($) *'] ||
        rawRow['Base MRP'] ||
        rawRow['MRP'],
      0
    );

    const rawPrice = parseNum(
      rawRow['Selling Price ($) *'] ||
        rawRow['Selling Price ($)'] ||
        norm.sellingprice ||
        norm.baseprice ||
        norm.price ||
        rawRow['Base Price ($) *'] ||
        rawRow['Base Price'] ||
        rawRow['Price'],
      0
    );

    const price = rawPrice < 0 ? 0 : rawPrice;
    const mrp = rawMrp < price ? price : rawMrp;

    // 5. Extract Stock Quantity
    const rawQty = parseNum(
      rawRow['Stock Quantity *'] ||
        rawRow['Stock Quantity'] ||
        norm.stockquantity ||
        norm.quantity ||
        norm.qty ||
        norm.stock,
      10
    );
    const quantity = Math.max(0, Math.floor(rawQty));

    // 6. Extract Category & Subcategory & Secondary Categories
    const category = (
      rawRow['Category *'] ||
      rawRow['Category'] ||
      norm.category ||
      norm.categoryname ||
      'Indian Wedding Garlands'
    )
      .toString()
      .trim();

    const rawSecondary = (
      rawRow['Secondary Categories (Optional)'] ||
      rawRow['Secondary Categories'] ||
      norm.secondarycategoriesoptional ||
      norm.secondarycategories ||
      norm.secondarycategory ||
      ''
    )
      .toString()
      .trim();

    const secondaryCategories: string[] = rawSecondary
      ? rawSecondary
          .split(/[,;]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    const subcategory = (
      rawRow['Subcategory (Optional)'] ||
      rawRow['Subcategory'] ||
      norm.subcategoryoptional ||
      norm.subcategory ||
      norm.subcat ||
      norm.subcatname ||
      rawRow['Sub Category'] ||
      ''
    )
      .toString()
      .trim();

    // 7. Extract Sales Tax Status
    const rawTax = (
      rawRow['Sales Tax Status'] ||
      norm.salestaxstatus ||
      norm.taxstatus ||
      norm.istaxable ||
      rawRow['Is Taxable'] ||
      norm.gsttax ||
      norm.gst ||
      norm.tax ||
      rawRow['GST Tax %'] ||
      ''
    )
      .toString()
      .trim()
      .toLowerCase();

    let isTaxable = true;
    let gst = 0;

    if (rawTax) {
      if (['non-taxable', 'nontaxable', 'exempt', 'no', 'false', '0', '0%'].includes(rawTax)) {
        isTaxable = false;
        gst = 0;
      } else if (['taxable', 'yes', 'true', '1', 'standard'].includes(rawTax)) {
        isTaxable = true;
        gst = 0;
      } else {
        const taxRate = parseFloat(rawTax.replace(/[^0-9.]/g, ''));
        if (!isNaN(taxRate)) {
          gst = taxRate;
          isTaxable = taxRate > 0;
        }
      }
    }

    // 8. Extract Storefront Visibility (Active/Disabled)
    let isActive = true;
    const rawVis = (
      rawRow['Storefront Visibility'] ||
      norm.storefrontvisibility ||
      norm.visibility ||
      norm.status ||
      norm.isactive ||
      rawRow['Status (Active/Disabled)'] ||
      rawRow['Status'] ||
      ''
    )
      .toString()
      .trim()
      .toLowerCase();

    if (rawVis) {
      if (['hidden', 'hide', 'disabled', 'inactive', 'false', '0', 'no'].includes(rawVis)) {
        isActive = false;
      } else if (['visible', 'show', 'active', 'enabled', 'true', '1', 'yes'].includes(rawVis)) {
        isActive = true;
      }
    }

    // 9. Extract Variants (Separate columns first, fallback to token string)
    const variants: ParsedVariant[] = [];

    // Priority 1: Check distinct separate columns (Variant 1 - Name, Variant 1 - Price, etc.)
    for (let v = 1; v <= 15; v++) {
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

      const vPrice = parseNum(
        norm[`variant${v}price`] ||
          norm[`v${v}price`] ||
          norm[`variant${v}sellingprice`] ||
          rawRow[`Variant ${v} - Price ($)`] ||
          rawRow[`Variant ${v} - Price`] ||
          rawRow[`Variant ${v} Price`],
        price
      );

      const vMrp = parseNum(
        norm[`variant${v}mrp`] ||
          norm[`v${v}mrp`] ||
          norm[`variant${v}originalprice`] ||
          rawRow[`Variant ${v} - MRP ($)`] ||
          rawRow[`Variant ${v} - MRP`] ||
          rawRow[`Variant ${v} MRP`],
        vPrice
      );

      const vQty = Math.max(
        0,
        Math.floor(
          parseNum(
            norm[`variant${v}stockqty`] ||
              norm[`variant${v}quantity`] ||
              norm[`variant${v}qty`] ||
              norm[`v${v}qty`] ||
              rawRow[`Variant ${v} - Stock Qty`] ||
              rawRow[`Variant ${v} Quantity`],
            quantity
          )
        )
      );

      const finalVPrice = vPrice < 0 ? 0 : vPrice;
      const finalVMrp = vMrp < finalVPrice ? finalVPrice : vMrp;
      const vDiscount =
        finalVMrp > finalVPrice ? Math.round(((finalVMrp - finalVPrice) / finalVMrp) * 100) : 0;

      variants.push({
        name: vName,
        price: finalVPrice,
        mrp: finalVMrp,
        quantity: vQty,
        discount: vDiscount,
      });
    }

    // Priority 2: Fallback to token string 'Product Variants & Pricing' only if no separate columns found
    if (variants.length === 0) {
      const rawVariantsStr = (
        rawRow['Product Variants & Pricing'] ||
        norm.productvariantspricing ||
        norm.productvariants ||
        norm.variants ||
        norm.variant ||
        rawRow['Variants'] ||
        ''
      )
        .toString()
        .trim();

      if (rawVariantsStr) {
        const tokens = rawVariantsStr.split(';').map((s: string) => s.trim()).filter(Boolean);
        for (const token of tokens) {
          const segs = token.split(':').map((s: string) => s.trim());
          if (segs.length === 0 || !segs[0]) continue;

          const vName = segs[0];
          let vPrice = price;
          let vMrp = mrp;
          let vQty = quantity;

          if (segs.length >= 4) {
            vPrice = parseNum(segs[1], price);
            vMrp = parseNum(segs[2], vPrice);
            vQty = Math.max(0, Math.floor(parseNum(segs[3], quantity)));
          } else if (segs.length === 3) {
            vPrice = parseNum(segs[1], price);
            vMrp = parseNum(segs[2], vPrice);
          } else if (segs.length === 2) {
            vPrice = parseNum(segs[1], price);
            vMrp = vPrice;
          }

          const finalVPrice = vPrice < 0 ? 0 : vPrice;
          const finalVMrp = vMrp < finalVPrice ? finalVPrice : vMrp;
          const vDiscount =
            finalVMrp > finalVPrice ? Math.round(((finalVMrp - finalVPrice) / finalVMrp) * 100) : 0;

          variants.push({
            name: vName,
            price: finalVPrice,
            mrp: finalVMrp,
            quantity: vQty,
            discount: vDiscount,
          });
        }
      }
    }

    // Slug-First Lookup: Match by slug first (preserving canonical URLs and handling title edits), then fallback to name
    let existing: any = undefined;
    if (slug) {
      existing = existingProducts.find(
        (p) => p && p.slug && p.slug.trim().toLowerCase() === slug.toLowerCase()
      );
    }
    if (!existing && name) {
      existing = existingProducts.find(
        (p) => p && p.name && p.name.trim().toLowerCase() === name.toLowerCase()
      );
    }

    // Image matching from dropped files
    const { file: matchedFile, reason: matchReason } = matchImageForProduct(
      imageFilename,
      name,
      imageFiles
    );

    const issues: string[] = [];
    const normalizedName = name.toLowerCase();
    if (names.has(normalizedName)) issues.push('Duplicate product name in this Excel file');
    names.add(normalizedName);
    if (!description) issues.push('Product description is required');
    if (price <= 0) issues.push('Selling price must be greater than $0');
    const matchedCategory = categories.find(
      (item) => item.name.trim().toLowerCase() === category.toLowerCase() || item.slug?.toLowerCase() === slugify(category)
    );
    if (!matchedCategory) issues.push(`Category "${category}" does not exist in the catalog`);
    else if (subcategory && !matchedCategory.subcategories?.some(
      (item) => item.name.trim().toLowerCase() === subcategory.toLowerCase() || item.slug?.toLowerCase() === slugify(subcategory)
    )) issues.push(`Subcategory "${subcategory}" does not belong to "${matchedCategory.name}"`);

    for (const secCat of secondaryCategories) {
      const matchSec = categories.find(
        (item) => item.name.trim().toLowerCase() === secCat.toLowerCase() || item.slug?.toLowerCase() === slugify(secCat)
      );
      if (!matchSec) {
        issues.push(`Secondary category "${secCat}" does not exist in the catalog`);
      }
    }

    const changedFields: string[] = [];
    if (existing) {
      if (normalizeDescriptionText(existing.description) !== normalizeDescriptionText(description)) {
        changedFields.push('Description');
      }
      if (normalizeDescriptionText(existing.category).toLowerCase() !== normalizeDescriptionText(category).toLowerCase()) {
        changedFields.push('Category');
      }
      if (normalizeDescriptionText(existing.subcategory || '').toLowerCase() !== normalizeDescriptionText(subcategory || '').toLowerCase()) {
        changedFields.push('Subcategory');
      }

      // Diff secondary categories
      const existingSecList = Array.isArray(existing.categories) && existing.categories.length > 1
        ? existing.categories.slice(1).map((c: any) => (typeof c === 'string' ? c : c.name || '')).map((s: string) => s.trim().toLowerCase()).filter(Boolean).sort()
        : [];
      const incomingSecList = secondaryCategories
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .sort();

      const areSecEqual =
        existingSecList.length === incomingSecList.length &&
        existingSecList.every((val: string, i: number) => val === incomingSecList[i]);

      if (!areSecEqual) {
        changedFields.push('Secondary Categories');
      }

      const existingPrice = Number(existing.price || 0);
      const incomingPrice = Number(price || 0);
      if (Math.abs(existingPrice - incomingPrice) >= 0.01) {
        changedFields.push('Price');
      }
      const existingMrp = Number(existing.mrp ?? existing.price ?? 0);
      const incomingMrp = Number(mrp ?? price ?? 0);
      const isExistingMrpPriceEqual = Math.abs(existingMrp - existingPrice) < 0.01;
      const isIncomingMrpPriceEqual = Math.abs(incomingMrp - incomingPrice) < 0.01;
      if (!(isExistingMrpPriceEqual && isIncomingMrpPriceEqual) && Math.abs(existingMrp - incomingMrp) >= 0.01) {
        changedFields.push('MRP');
      }
      if (Number(existing.quantity ?? 0) !== Number(quantity ?? 0)) {
        changedFields.push('Stock');
      }
      if (Number(existing.gst ?? 0) !== Number(gst ?? 0)) {
        changedFields.push('Tax');
      }
      if (Boolean(existing.isActive !== false) !== Boolean(isActive !== false)) {
        changedFields.push('Storefront status');
      }
      if (Boolean(existing.isTaxable !== false) !== Boolean(isTaxable !== false)) {
        changedFields.push('Taxable');
      }
      if (!areVariantsEqual(existing.variants || [], variants)) {
        changedFields.push('Variants');
      }
    }

    results.push({
      index: idx,
      raw: rawRow,
      name,
      slug,
      description,
      category,
      secondaryCategories,
      subcategory,
      price,
      mrp,
      quantity,
      gst,
      isTaxable,
      isActive,
      imageFilename,
      variants,
      isUpdate: Boolean(existing && changedFields.length > 0),
      isUnchanged: Boolean(existing && changedFields.length === 0),
      changedFields,
      existingProduct: existing
        ? {
            _id: existing._id,
            name: existing.name,
            slug: existing.slug,
            price: existing.price,
            mrp: existing.mrp,
            image: existing.image,
            category: existing.category,
            subcategory: existing.subcategory,
            categories: existing.categories,
            quantity: existing.quantity,
            gst: existing.gst,
            isActive: existing.isActive,
            isTaxable: existing.isTaxable,
            description: existing.description,
            variants: existing.variants,
          }
        : undefined,
      matchedImageFile: matchedFile,
      matchedPreviewUrl: safeCreateObjectURL(matchedFile),
      matchReason,
      issues,
      isValid: issues.length === 0,
    });
  }

  return results;
}
