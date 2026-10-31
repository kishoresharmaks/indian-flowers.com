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
  isTaxable?: boolean;
  isActive?: boolean;
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

    // 6. Extract Category & Subcategory
    const category = (
      rawRow['Category *'] ||
      rawRow['Category'] ||
      norm.category ||
      norm.categoryname ||
      'Indian Wedding Garlands'
    )
      .toString()
      .trim();

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

    // 9. Extract Variants (Token String: Name: Price: MRP: Qty or separate columns)
    const variants: ParsedVariant[] = [];
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

    // Fallback: If no single variants string, check separate columns (Variant 1 - Name, etc.)
    if (variants.length === 0) {
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

        const vPrice = parseNum(
          norm[`variant${v}price`] ||
            norm[`v${v}price`] ||
            norm[`variant${v}sellingprice`] ||
            rawRow[`Variant ${v} - Price ($)`] ||
            rawRow[`Variant ${v} Price`],
          price
        );

        const vMrp = parseNum(
          norm[`variant${v}mrp`] ||
            norm[`v${v}mrp`] ||
            norm[`variant${v}originalprice`] ||
            rawRow[`Variant ${v} - MRP ($)`] ||
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
      isTaxable,
      isActive,
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
