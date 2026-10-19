import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';
import { reversePointsOnRefund, creditOrderPoints } from '@/lib/loyalty/loyaltyEngine';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { releaseInventory } from '@/lib/inventory';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
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

    // 1. DEDICATED REFUND & RETURN ACTION
    if (body.action === 'refund') {
      const orderTotal = Number(existingOrder.totalAmount) || 0;
      const requestedRefund =
        body.refundAmount !== undefined ? Number(body.refundAmount) : orderTotal;

      if (isNaN(requestedRefund) || requestedRefund <= 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid refund amount. Must be greater than $0.00' },
          { status: 400 }
        );
      }

      if (requestedRefund > orderTotal) {
        return NextResponse.json(
          {
            success: false,
            message: `Refund amount ($${requestedRefund.toFixed(2)}) cannot exceed the order total ($${orderTotal.toFixed(2)})`,
          },
          { status: 400 }
        );
      }

      const isFullRefund = requestedRefund >= orderTotal;
      const newPaymentStatus = isFullRefund ? 'Refunded' : 'Partially_Refunded';
      const newOrderStatus = body.status || (isFullRefund ? 'Returned' : existingOrder.status);

      const updateFields: any = {
        refundAmount: requestedRefund,
        refundReason: body.refundReason || 'Customer requested return / refund',
        refundNotes: body.refundNotes || '',
        refundDate: new Date(),
        paymentStatus: newPaymentStatus,
        status: newOrderStatus,
      };

      // Restock inventory if requested and not already restocked
      if (body.restockItems === true && !existingOrder.isRestocked) {
        try {
          await releaseInventory(
            (existingOrder.items || []).map((item) => ({
              productId: item.productId,
              quantity: Number(item.quantity) || 1,
              variantName: item.variantName || undefined,
            }))
          );
          updateFields.isRestocked = true;
          updateFields.restockedAt = new Date();
        } catch (restockErr) {
          console.error('Inventory restocking warning on refund:', restockErr);
        }
      }

      // Reverse loyalty points (deduct points awarded, restore points redeemed)
      try {
        await reversePointsOnRefund(existingOrder, requestedRefund);
      } catch (loyaltyErr) {
        console.error('Failed to reverse loyalty points on refund:', loyaltyErr);
      }

      const updatedOrder = await Order.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      await captureServerEvent(
        request,
        'order_refund_processed',
        {
          order_id: existingOrder.orderId || id,
          refund_amount: requestedRefund,
          is_full_refund: isFullRefund,
          restocked: !!updateFields.isRestocked,
        },
        `order:${id}`
      );

      return NextResponse.json({
        success: true,
        message: `Order successfully ${
          isFullRefund ? 'refunded and returned' : 'partially refunded'
        }.`,
        data: updatedOrder,
      });
    }

    // 2. STANDARD ORDER STATUS & PAYMENT STATUS UPDATES
    // Prevent marking payment as paid on a cancelled order
    if (existingOrder.status === 'Cancelled' && body.paymentStatus === 'Paid') {
      return NextResponse.json(
        { success: false, message: 'Cannot mark a cancelled order as paid.' },
        { status: 400 }
      );
    }

    // Lock Completed / Delivered Orders from moving backwards unless refunding or returning
    if (
      (existingOrder.status === 'Completed' || existingOrder.status === 'Delivered') &&
      body.status &&
      body.status !== 'Completed' &&
      body.status !== 'Delivered' &&
      body.status !== 'Refunded' &&
      body.status !== 'Returned'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A delivered or completed order status can only be transitioned to Returned or Refunded.',
        },
        { status: 400 }
      );
    }

    // Lock Paid Payment Status from changes unless marking Refunded / Partially_Refunded
    if (
      existingOrder.paymentStatus === 'Paid' &&
      body.paymentStatus &&
      body.paymentStatus !== 'Paid' &&
      body.paymentStatus !== 'Refunded' &&
      body.paymentStatus !== 'Partially_Refunded'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A paid payment status can only be modified via refund or return.',
        },
        { status: 400 }
      );
    }

    const updateFields: any = {};
    if (body.status) {
      if (
        ![
          'Pending',
          'Processing',
          'Delivered',
          'Completed',
          'Cancelled',
          'Refunded',
          'Returned',
        ].includes(body.status)
      ) {
        return NextResponse.json(
          { success: false, message: 'Invalid order status' },
          { status: 400 }
        );
      }
      updateFields.status = body.status;
    }

    if (body.paymentStatus) {
      if (
        ![
          'Pending',
          'Paid',
          'Failed',
          'Refunded',
          'Partially_Refunded',
        ].includes(body.paymentStatus)
      ) {
        return NextResponse.json(
          { success: false, message: 'Invalid payment status' },
          { status: 400 }
        );
      }
      updateFields.paymentStatus = body.paymentStatus;
    }

    // Award loyalty points ONLY after the order is Delivered or Completed for customer orders
    const isNowDeliveredOrCompleted =
      updateFields.status === 'Delivered' ||
      updateFields.status === 'Completed' ||
      (!updateFields.status &&
        (existingOrder.status === 'Delivered' || existingOrder.status === 'Completed'));

    if (
      isNowDeliveredOrCompleted &&
      !existingOrder.pointsAwarded &&
      existingOrder.customerId
    ) {
      try {
        const netSpend = Math.max(
          0,
          (existingOrder.subtotal || 0) - (existingOrder.discountAmount || 0)
        );
        const awarded = await creditOrderPoints(
          String(existingOrder.customerId),
          existingOrder.orderId,
          netSpend
        );
        if (awarded > 0) {
          updateFields.pointsEarned = awarded;
          updateFields.pointsAwarded = true;
        }
      } catch (creditErr) {
        console.error('Failed to credit loyalty points on order delivery/completion:', creditErr);
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    await captureServerEvent(
      request,
      'order_updated',
      {
        order_id: existingOrder.orderId || id,
        previous_order_status: existingOrder.status,
        order_status: updatedOrder?.status,
        previous_payment_status: existingOrder.paymentStatus,
        payment_status: updatedOrder?.paymentStatus,
      },
      `order:${id}`
    );

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
