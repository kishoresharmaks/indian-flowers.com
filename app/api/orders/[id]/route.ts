import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await request.json();

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Lock Completed Orders from status changes
    if (existingOrder.status === 'Completed' && body.status && body.status !== 'Completed') {
      return NextResponse.json(
        { success: false, message: 'A completed order status is locked and cannot be changed further.' },
        { status: 400 }
      );
    }

    // Prevent marking payment as paid on a cancelled order
    if (existingOrder.status === 'Cancelled' && body.paymentStatus === 'Paid') {
      return NextResponse.json(
        { success: false, message: 'Cannot mark a cancelled order as paid.' },
        { status: 400 }
      );
    }

    // Lock Paid Payment Status from further changes
    if (existingOrder.paymentStatus === 'Paid' && body.paymentStatus && body.paymentStatus !== 'Paid') {
      return NextResponse.json(
        { success: false, message: 'A paid payment status is locked and cannot be changed further.' },
        { status: 400 }
      );
    }

    const updateFields: any = {};
    if (body.status) {
      if (!['Pending', 'Processing', 'Completed', 'Cancelled'].includes(body.status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid order status' },
          { status: 400 }
        );
      }
      updateFields.status = body.status;
    }

    if (body.paymentStatus) {
      if (!['Pending', 'Paid', 'Failed'].includes(body.paymentStatus)) {
        return NextResponse.json(
          { success: false, message: 'Invalid payment status' },
          { status: 400 }
        );
      }
      updateFields.paymentStatus = body.paymentStatus;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    await captureServerEvent(request, 'order_updated', {
      order_id: existingOrder.orderId || id,
      previous_order_status: existingOrder.status,
      order_status: updatedOrder?.status,
      previous_payment_status: existingOrder.paymentStatus,
      payment_status: updatedOrder?.paymentStatus,
    }, `order:${id}`);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error: any) {
    await captureServerException(request, error, `order:${params.id}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
