export function generateDocPrefix(docType: string): string {
  switch (docType) {
    case 'SALE_INVOICE':
      return 'BH-INV';
    case 'QUOTATION':
      return 'BH-EST';
    case 'PROFORMA':
      return 'BH-PRO';
    case 'SALE_ORDER':
      return 'BH-SO';
    case 'SALE_RETURN':
      return 'BH-CRN';
    case 'PURCHASE_BILL':
      return 'BH-PB';
    case 'PURCHASE_ORDER':
      return 'BH-PO';
    case 'PURCHASE_RETURN':
      return 'BH-DRN';
    case 'EXPENSE':
      return 'BH-EXP';
    default:
      return 'BH-DOC';
  }
}

export function formatDocNumber(prefix: string, count: number): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

export async function generateNextDocNumber(
  model: any,
  prefix: string,
  field: string = 'docNumber'
): Promise<string> {
  const now = new Date();
  const istDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .replace(/-/g, '');

  const pattern = new RegExp(`^${prefix}-${istDateStr}-`);
  const latest = await model
    .findOne({ [field]: pattern })
    .sort({ [field]: -1 })
    .lean();

  let nextSeq = 1;
  if (latest && latest[field]) {
    const parts = (latest[field] as string).split('-');
    const lastPart = parts[parts.length - 1];
    const parsed = parseInt(lastPart, 10);
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  let docNumber = `${prefix}-${istDateStr}-${String(nextSeq).padStart(4, '0')}`;
  while (await model.exists({ [field]: docNumber })) {
    nextSeq++;
    docNumber = `${prefix}-${istDateStr}-${String(nextSeq).padStart(4, '0')}`;
  }

  return docNumber;
}

