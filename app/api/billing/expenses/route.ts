import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import { generateDocPrefix, generateNextDocNumber } from '@/lib/billingUtils';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const filter: any = {};
    if (category && category !== 'All') filter.categoryName = category;

    const expenses = await Expense.find(filter).sort({ date: -1 }).lean();
    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const body = await req.json();

    const { categoryName, title, amount } = body;
    if (!categoryName || !title || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Category, title, and valid amount required.' },
        { status: 400 }
      );
    }

    const prefix = generateDocPrefix('EXPENSE');
    const expenseNumber = await generateNextDocNumber(Expense, prefix, 'expenseNumber');

    const expense = await Expense.create({
      expenseNumber,
      categoryName,
      title,
      amount: Number(amount),
      paymentMode: body.paymentMode || 'CASH',
      paidTo: body.paidTo || '',
      referenceNo: body.referenceNo || '',
      notes: body.notes || '',
      date: body.date ? new Date(body.date) : new Date(),
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Expense ID required.' }, { status: 400 });
    }

    await Expense.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

