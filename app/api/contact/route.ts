import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import { sendContactFormConfirmationEmail, sendEmailViaMsg91, escapeHtml } from '@/lib/msg91';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthenticatedResponse();
    await connectToDatabase();
    const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: messages.length, data: messages });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { name, email, phone, subject, message, eventDate } = body;

    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please fill in all required fields (Name, Email, Phone, Subject, and Message).',
        },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const count = await ContactMessage.countDocuments();
    const referenceId = `MSG-${1001 + count}`;

    const contactMsg = await ContactMessage.create({
      referenceId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
      eventDate: eventDate ? String(eventDate).trim() : '',
      status: 'NEW',
    });

    // Send confirmation to customer via MSG91
    try {
      await sendContactFormConfirmationEmail({
        name: contactMsg.name,
        email: contactMsg.email,
        phone: contactMsg.phone,
        subject: contactMsg.subject,
        message: contactMsg.message,
        eventDate: contactMsg.eventDate,
        referenceId: contactMsg.referenceId,
      });

      // Also alert store admin
      const adminEmail = process.env.STORE_CONTACT_EMAIL || 'indianflowersorder@gmail.com';
      const safeName = escapeHtml(name);
      const safeSubject = escapeHtml(subject);
      const safeRefId = escapeHtml(referenceId);
      const safeEmail = escapeHtml(email);
      const safePhone = escapeHtml(phone);
      const safeDate = escapeHtml(eventDate);
      const safeMsg = escapeHtml(message);

      await sendEmailViaMsg91({
        to: [{ name: 'Indian Flowers Admin', email: adminEmail }],
        subject: `[CONTACT ENQUIRY ${safeRefId}] ${safeSubject} from ${safeName}`,
        htmlContent: `
          <h3>New Storefront Contact Enquiry</h3>
          <p><strong>Reference:</strong> ${safeRefId}</p>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Phone:</strong> ${safePhone}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          ${safeDate ? `<p><strong>Target Event Date:</strong> ${safeDate}</p>` : ''}
          <p><strong>Message:</strong><br>${safeMsg.replace(/\n/g, '<br>')}</p>
        `,
      });
    } catch (emailErr) {
      console.warn('[Contact] MSG91 email send error:', emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! Your message has been received. A confirmation has been sent to your email.',
        data: { referenceId },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit contact enquiry' },
      { status: 500 }
    );
  }
}
