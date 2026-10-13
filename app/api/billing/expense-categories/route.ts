import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ExpenseCategory from '@/models/ExpenseCategory';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    let categories = await ExpenseCategory.find().sort({ name: 1 }).lean();

    // Auto-seed default expense categories if empty
    if (categories.length === 0) {
      const defaults = [
        { name: 'Rent', description: 'Store & warehouse rent' },
        { name: 'Electricity & Utilities', description: 'Power and water bills' },
        { name: 'Logistics & Transport', description: 'Honey delivery & farmland shipping' },
        { name: 'Packaging Supplies', description: 'Bottles, jars, labels, tape' },
        { name: 'Labor & Salary', description: 'Staff wages & worker payouts' },
        { name: 'Maintenance & Repairs', description: 'Equipment upkeep' },
      ];
      await ExpenseCategory.insertMany(defaults);
      categories = await ExpenseCategory.find().sort({ name: 1 }).lean();
    }

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Category name required.' }, { status: 400 });
    }

    const cat = await ExpenseCategory.create({
      name: body.name.trim(),
      description: body.description || '',
    });

    return NextResponse.json({ success: true, data: cat }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
