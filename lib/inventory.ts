import Product from '@/models/Product';

export interface InventoryReservation {
  productId: string;
  quantity: number;
  variantName?: string;
}

export async function reserveInventory(items: InventoryReservation[]) {
  const reserved: InventoryReservation[] = [];

  for (const item of items) {
    const filter = item.variantName
      ? { _id: item.productId, variants: { $elemMatch: { name: item.variantName, quantity: { $gte: item.quantity } } } }
      : { _id: item.productId, quantity: { $gte: item.quantity } };
    const update = item.variantName
      ? { $inc: { 'variants.$.quantity': -item.quantity } }
      : { $inc: { quantity: -item.quantity } };
    const result = await Product.updateOne(filter, update);

    if (result.modifiedCount !== 1) {
      await releaseInventory(reserved);
      throw new Error(`Insufficient stock for ${item.variantName || 'this product'}.`);
    }
    reserved.push(item);
  }

  return reserved;
}

export async function releaseInventory(items: InventoryReservation[]) {
  await Promise.all(
    items.map((item) =>
      Product.updateOne(
        item.variantName
          ? { _id: item.productId, 'variants.name': item.variantName }
          : { _id: item.productId },
        item.variantName
          ? { $inc: { 'variants.$.quantity': item.quantity } }
          : { $inc: { quantity: item.quantity } }
      )
    )
  );
}
