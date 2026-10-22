import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import EmailConfig from '@/models/EmailConfig';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { getEffectiveEmailConfig } from '@/lib/msg91';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const config = await getEffectiveEmailConfig();
    const dbConfig = await EmailConfig.findOne({ key: 'global' }).lean();

    return NextResponse.json({
      success: true,
      data: {
        provider: config.provider,
        msg91AuthKey: config.authKey ? `${config.authKey.substring(0, 6)}••••••••${config.authKey.slice(-4)}` : '',
        hasAuthKey: Boolean(config.authKey && !config.authKey.includes('placeholder')),
        msg91FromEmail: config.fromEmail,
        msg91FromName: config.fromName,
        msg91Domain: config.domain,
        msg91TemplateId: config.templateId || '',
        adminNotificationEmail: config.adminEmail,
        smtpHost: dbConfig?.smtpHost || '',
        smtpPort: dbConfig?.smtpPort || 587,
        smtpUser: dbConfig?.smtpUser || '',
        smtpPass: dbConfig?.smtpPass ? '••••••••' : '',
        hasSmtpPass: Boolean(dbConfig?.smtpPass),
        smtpSecure: dbConfig?.smtpSecure || false,
        replySignature: config.replySignature,
      },
    });
  } catch (error: any) {
    console.error('[API Admin Mail Config GET] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load mail configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();

  try {
    await connectToDatabase();
    const body = await req.json();

    const updateFields: any = {
      provider: body.provider || 'msg91',
      msg91FromEmail: body.msg91FromEmail?.trim() || 'orders@theindianflowers.com',
      msg91FromName: body.msg91FromName?.trim() || 'The Indian Flowers',
      msg91Domain: body.msg91Domain?.trim() || 'theindianflowers.com',
      msg91TemplateId: body.msg91TemplateId?.trim() || '',
      adminNotificationEmail: body.adminNotificationEmail?.trim() || 'indianflowersorder@gmail.com',
      smtpHost: body.smtpHost?.trim() || '',
      smtpPort: Number(body.smtpPort) || 587,
      smtpUser: body.smtpUser?.trim() || '',
      smtpSecure: Boolean(body.smtpSecure),
      replySignature: body.replySignature || 'Warm regards,\nThe Indian Flowers Team\n(909) 379-3678 | theindianflowers.com',
    };

    // Only update auth key if new non-masked value was provided
    if (body.msg91AuthKey && !body.msg91AuthKey.includes('••••')) {
      updateFields.msg91AuthKey = body.msg91AuthKey.trim();
    }

    // Only update SMTP pass if non-masked
    if (body.smtpPass && !body.smtpPass.includes('••••')) {
      updateFields.smtpPass = body.smtpPass.trim();
    }

    const updatedConfig = await EmailConfig.findOneAndUpdate(
      { key: 'global' },
      { $set: updateFields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Email configuration saved successfully',
      data: {
        provider: updatedConfig.provider,
        hasAuthKey: Boolean(updatedConfig.msg91AuthKey),
        msg91FromEmail: updatedConfig.msg91FromEmail,
        msg91FromName: updatedConfig.msg91FromName,
        msg91Domain: updatedConfig.msg91Domain,
        adminNotificationEmail: updatedConfig.adminNotificationEmail,
      },
    });
  } catch (error: any) {
    console.error('[API Admin Mail Config POST] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save mail configuration' },
      { status: 500 }
    );
  }
}
