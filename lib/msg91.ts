/**
 * MSG91 & Unified Transactional Email Service
 * Handles transactional emails, automated confirmations, customer replies,
 * test dispatches, and sent logging into MongoDB EmailLog collection.
 */

import connectToDatabase from '@/lib/db';
import EmailLog, { IEmailLog } from '@/models/EmailLog';
import EmailConfig, { IEmailConfig } from '@/models/EmailConfig';

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface SendEmailOptions {
  to: EmailRecipient[];
  from?: { name?: string; email?: string };
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: Record<string, string>;
  templateId?: string;
  type?: IEmailLog['type'];
  metadata?: Record<string, any>;
}

export interface Msg91EmailResult {
  success: boolean;
  message?: string;
  data?: any;
  simulated?: boolean;
  logId?: string;
}

/**
 * Escapes HTML characters to prevent HTML/XSS injection into transactional email templates
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Fetch effective email settings from MongoDB or environment variables
 */
export async function getEffectiveEmailConfig(): Promise<{
  provider: 'msg91' | 'brevo' | 'smtp';
  authKey: string;
  fromEmail: string;
  fromName: string;
  domain: string;
  templateId?: string;
  brevoApiKey: string;
  brevoFromEmail: string;
  brevoFromName: string;
  adminEmail: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  replySignature?: string;
}> {
  let dbConfig: any = null;
  try {
    await connectToDatabase();
    dbConfig = await EmailConfig.findOne({ key: 'global' }).lean();
  } catch (err) {
    console.warn('[EmailConfig] Failed to fetch EmailConfig from DB, using env:', err);
  }

  const authKey =
    dbConfig?.msg91AuthKey?.trim() ||
    process.env.MSG91_AUTH_KEY ||
    '';

  const fromEmail =
    dbConfig?.msg91FromEmail?.trim() ||
    process.env.MSG91_FROM_EMAIL ||
    'orders@theindianflowers.com';

  const fromName =
    dbConfig?.msg91FromName?.trim() ||
    process.env.MSG91_FROM_NAME ||
    'The Indian Flowers';

  const domain =
    dbConfig?.msg91Domain?.trim() ||
    process.env.MSG91_DOMAIN ||
    'theindianflowers.com';

  const brevoApiKey =
    dbConfig?.brevoApiKey?.trim() ||
    process.env.BREVO_API_KEY ||
    '';

  const brevoFromEmail =
    dbConfig?.brevoFromEmail?.trim() ||
    process.env.BREVO_FROM_EMAIL ||
    'orders@theindianflowers.com';

  const brevoFromName =
    dbConfig?.brevoFromName?.trim() ||
    process.env.BREVO_FROM_NAME ||
    'The Indian Flowers';

  const adminEmail =
    dbConfig?.adminNotificationEmail?.trim() ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.STORE_CONTACT_EMAIL ||
    'indianflowersorder@gmail.com';

  const templateId = dbConfig?.msg91TemplateId || process.env.MSG91_TEMPLATE_ID || '';

  return {
    provider: dbConfig?.provider || 'msg91',
    authKey,
    fromEmail,
    fromName,
    domain,
    templateId,
    brevoApiKey,
    brevoFromEmail,
    brevoFromName,
    adminEmail,
    smtpHost: dbConfig?.smtpHost,
    smtpPort: dbConfig?.smtpPort,
    smtpUser: dbConfig?.smtpUser,
    smtpPass: dbConfig?.smtpPass,
    smtpSecure: dbConfig?.smtpSecure,
    replySignature:
      dbConfig?.replySignature ||
      'Warm regards,\nThe Indian Flowers Team\n(909) 379-3678 | theindianflowers.com',
  };
}

/**
 * Record sent/simulated/failed email in the EmailLog collection
 */
async function recordEmailLog({
  to,
  recipientName,
  from,
  subject,
  type = 'OTHER',
  status,
  provider,
  errorMessage = '',
  htmlBody = '',
  metadata = {},
}: {
  to: string;
  recipientName?: string;
  from: string;
  subject: string;
  type?: IEmailLog['type'];
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  provider: 'MSG91' | 'BREVO' | 'SMTP' | 'SIMULATOR';
  errorMessage?: string;
  htmlBody?: string;
  metadata?: Record<string, any>;
}): Promise<string | undefined> {
  try {
    await connectToDatabase();
    const referenceId = `EML-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const logEntry = await EmailLog.create({
      referenceId,
      to,
      recipientName: recipientName || '',
      from,
      subject,
      type,
      status,
      provider,
      errorMessage,
      htmlBody,
      metadata,
      sentAt: new Date(),
    });

    return logEntry._id ? String(logEntry._id) : undefined;
  } catch (err) {
    console.error('[EmailLog] Failed to persist email log into DB:', err);
    return undefined;
  }
}

/**
 * Send email via Brevo (Sendinblue) Transactional REST API v3 with auto-logging into MongoDB
 */
export async function sendEmailViaBrevo(options: SendEmailOptions): Promise<Msg91EmailResult> {
  const config = await getEffectiveEmailConfig();
  const recipient = options.to[0] || { email: '', name: '' };
  const recipientEmail = recipient.email;
  const recipientName = recipient.name;

  // If Brevo API Key is missing or placeholder, run in simulation mode & log it
  if (!config.brevoApiKey || config.brevoApiKey.includes('placeholder')) {
    console.warn(
      `[Brevo] BREVO_API_KEY is not configured. Simulating email send to ${options.to.map((r) => r.email).join(', ')} with subject: "${options.subject}"`
    );

    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${config.brevoFromName || config.fromName} <${config.brevoFromEmail || config.fromEmail}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'SIMULATED',
      provider: 'SIMULATOR',
      errorMessage: 'Simulated dispatch (BREVO_API_KEY not configured in Admin/Environment)',
      htmlBody: options.htmlContent,
      metadata: options.metadata || {},
    });

    return {
      success: true,
      simulated: true,
      logId,
      message: 'Email simulated (BREVO_API_KEY not configured)',
    };
  }

  try {
    const senderEmail = (options.from?.email || config.brevoFromEmail || config.fromEmail || 'orders@theindianflowers.com').trim();
    const senderName = (options.from?.name || config.brevoFromName || config.fromName || 'The Indian Flowers').trim();

    const payload: any = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: options.to.map((r) => ({
        email: r.email,
        name: r.name || r.email,
      })),
      subject: options.subject,
      htmlContent: options.htmlContent,
      replyTo: {
        email: config.adminEmail || 'indianflowersorder@gmail.com',
        name: senderName,
      },
    };

    if (options.textContent) {
      payload.textContent = options.textContent;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': config.brevoApiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.messageId) {
      const errMsg = data.message || `Brevo responded with HTTP ${response.status} (${data.code || 'unknown'})`;
      console.error('[Brevo] Email dispatch failed:', response.status, data);

      const logId = await recordEmailLog({
        to: recipientEmail,
        recipientName,
        from: `${senderName} <${senderEmail}>`,
        subject: options.subject,
        type: options.type || 'OTHER',
        status: 'FAILED',
        provider: 'BREVO',
        errorMessage: errMsg,
        htmlBody: options.htmlContent,
        metadata: {
          responseData: data,
          httpStatus: response.status,
          ...(options.metadata || {}),
        },
      });

      return {
        success: false,
        message: errMsg,
        data,
        logId,
      };
    }

    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${senderName} <${senderEmail}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'SENT',
      provider: 'BREVO',
      htmlBody: options.htmlContent,
      metadata: {
        brevoMessageId: data.messageId,
        ...(options.metadata || {}),
      },
    });

    return {
      success: true,
      data,
      logId,
      message: 'Email sent successfully via Brevo',
    };
  } catch (error: any) {
    console.error('[Brevo] Network error during email dispatch:', error);
    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${config.brevoFromName || config.fromName} <${config.brevoFromEmail || config.fromEmail}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'FAILED',
      provider: 'BREVO',
      errorMessage: error.message || 'Network error communicating with Brevo API',
      htmlBody: options.htmlContent,
      metadata: options.metadata || {},
    });

    return {
      success: false,
      message: error.message || 'Failed to dispatch email via Brevo',
      logId,
    };
  }
}

/**
 * Send email via MSG91 Email API v5 (or active provider) with auto-logging into MongoDB
 */
export async function sendEmailViaMsg91(options: SendEmailOptions): Promise<Msg91EmailResult> {
  const config = await getEffectiveEmailConfig();

  // Route to Brevo if configured
  if (config.provider === 'brevo') {
    return sendEmailViaBrevo(options);
  }
  const recipient = options.to[0] || { email: '', name: '' };
  const recipientEmail = recipient.email;
  const recipientName = recipient.name;

  // If AuthKey is missing or placeholder, run in simulation mode & log it
  if (!config.authKey || config.authKey.includes('placeholder')) {
    console.warn(
      `[MSG91] MSG91_AUTH_KEY is not configured. Simulating email send to ${options.to.map((r) => r.email).join(', ')} with subject: "${options.subject}"`
    );

    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${config.fromName} <${config.fromEmail}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'SIMULATED',
      provider: 'SIMULATOR',
      errorMessage: 'Simulated dispatch (MSG91_AUTH_KEY not configured in Admin/Environment)',
      htmlBody: options.htmlContent,
      metadata: options.metadata || {},
    });

    return {
      success: true,
      simulated: true,
      logId,
      message: 'Email simulated (MSG91_AUTH_KEY not configured)',
    };
  }

  try {
    const cleanDomain = (config.domain || 'theindianflowers.com')
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .trim();

    // MSG91 strictly disallows public free webmail sender domains (like @gmail.com, @yahoo.com).
    // The "from.email" MUST use a verified domain registered in your MSG91 account.
    // If config.fromEmail has @gmail.com or is invalid, auto-sanitize it to orders@<cleanDomain>
    let effectiveFromEmail = (config.fromEmail || `orders@${cleanDomain}`).trim();
    if (/@(gmail|yahoo|hotmail|outlook|icloud)\.com$/i.test(effectiveFromEmail) || !effectiveFromEmail.includes('@')) {
      effectiveFromEmail = `orders@${cleanDomain}`;
    }

    const payload: any = {
      recipients: options.to.map((r) => ({
        to: [
          {
            name: r.name,
            email: r.email,
          },
        ],
        variables: {
          subject: options.subject,
          body: options.htmlContent,
          message: options.htmlContent,
          ...(options.variables || {}),
        },
      })),
      from: {
        name: options.from?.name || config.fromName || 'The Indian Flowers',
        email:
          options.from?.email && !/@(gmail|yahoo|hotmail|outlook|icloud)\.com$/i.test(options.from.email)
            ? options.from.email
            : effectiveFromEmail,
      },
      domain: cleanDomain,
      // Provide reply_to so customer replies flow directly to the store admin's Gmail / email address
      reply_to: [
        {
          email: config.adminEmail || config.fromEmail || 'indianflowersorder@gmail.com',
          name: config.fromName || 'The Indian Flowers',
        },
      ],
    };

    const templateId = options.templateId || config.templateId;
    if (templateId) {
      payload.template_id = templateId;
    } else {
      payload.subject = options.subject;
      // In MSG91 v5 Email API without template_id, "body" MUST be an object with "type" and "data":
      payload.body = {
        type: 'text/html',
        data: options.htmlContent || options.textContent || '',
      };
    }

    const response = await fetch('https://control.msg91.com/api/v5/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authkey: config.authKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status === 'fail' || data.hasError) {
      console.error('[MSG91] Email send failed with HTTP status:', response.status, data);

      let errMsg = data.message || `MSG91 responded with HTTP ${response.status}`;
      if (data.errors && typeof data.errors === 'object') {
        const errorList: string[] = [];
        for (const [key, val] of Object.entries(data.errors)) {
          if (Array.isArray(val)) {
            errorList.push(...val.map(String));
          } else if (typeof val === 'string') {
            errorList.push(val);
          }
        }
        if (errorList.length > 0) {
          errMsg = `${errMsg} — ${errorList.join('; ')}`;
        }
      }

      const logId = await recordEmailLog({
        to: recipientEmail,
        recipientName,
        from: `${payload.from.name} <${payload.from.email}>`,
        subject: options.subject,
        type: options.type || 'OTHER',
        status: 'FAILED',
        provider: 'MSG91',
        errorMessage: errMsg,
        htmlBody: options.htmlContent,
        metadata: {
          responseData: data,
          httpStatus: response.status,
          payloadSent: {
            from: payload.from,
            domain: payload.domain,
            reply_to: payload.reply_to,
            template_id: payload.template_id,
          },
          ...options.metadata,
        },
      });

      return {
        success: false,
        message: errMsg,
        data,
        logId,
      };
    }

    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${payload.from.name} <${payload.from.email}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'SENT',
      provider: 'MSG91',
      htmlBody: options.htmlContent,
      metadata: { responseData: data, ...options.metadata },
    });

    return {
      success: true,
      data,
      logId,
      message: 'Email sent successfully via MSG91',
    };
  } catch (error: any) {
    console.error('[MSG91] Exception while contacting MSG91 API:', error);
    const errMsg = error.message || 'Network exception while contacting MSG91 API';

    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${config.fromName} <${config.fromEmail}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'FAILED',
      provider: 'MSG91',
      errorMessage: errMsg,
      htmlBody: options.htmlContent,
      metadata: options.metadata || {},
    });

    return {
      success: false,
      message: errMsg,
      logId,
    };
  }
}

/**
 * Format and send an automated Customer Floral Request Confirmation email
 */
export async function sendFloralInquiryConfirmationEmail({
  customerName,
  customerEmail,
  customerPhone,
  cityState,
  eventDate,
  occasion,
  requirements,
  budget,
  inquiryId,
}: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cityState: string;
  eventDate: string;
  occasion: string;
  requirements: string;
  budget?: string;
  inquiryId: string;
}) {
  const safeCustomerName = escapeHtml(customerName);
  const safeOccasion = escapeHtml(occasion);
  const safeEventDate = escapeHtml(eventDate);
  const safeCityState = escapeHtml(cityState);
  const safeBudget = escapeHtml(budget);
  const safePhone = escapeHtml(customerPhone);
  const safeRequirements = escapeHtml(requirements);
  const safeInquiryId = escapeHtml(inquiryId);

  const subject = `Your Custom Floral Request Received [${safeInquiryId}] - Indian-Flowers.com`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF6F0; color: #111827; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0B3B24; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; color: #8FE7B8; font-size: 13px; font-weight: 500; }
    .body { padding: 28px 24px; }
    .badge { display: inline-block; background: #EAF5EE; color: #0B3B24; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .details { background: #FAF9F6; border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E5E7EB; font-size: 13px; }
    .details-row:last-child { border-bottom: none; }
    .label { color: #6B7280; font-weight: 500; }
    .value { color: #111827; font-weight: 600; text-align: right; }
    .notice { background: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400E; margin-top: 20px; }
    .footer { text-align: center; padding: 20px 24px; font-size: 11px; color: #9CA3AF; border-top: 1px solid #F3F4F6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>The Indian Flowers</h1>
      <p>Fresh Indian Flowers & Handcrafted Garlands Delivered Across USA</p>
    </div>
    <div class="body">
      <div class="badge">Inquiry Reference: ${safeInquiryId}</div>
      <p style="font-size: 15px; margin-top: 0;">Dear <strong>${safeCustomerName}</strong>,</p>
      <p style="font-size: 13.5px; line-height: 1.6; color: #374151;">
        Thank you for submitting your custom floral inquiry for your upcoming celebration. Our master garland artisan and floral coordinator have received your request and will review your requirements.
      </p>

      <div class="details">
        <div class="details-row"><span class="label">Inquiry ID:</span><span class="value">${safeInquiryId}</span></div>
        <div class="details-row"><span class="label">Occasion:</span><span class="value">${safeOccasion}</span></div>
        <div class="details-row"><span class="label">Event / Delivery Date:</span><span class="value">${safeEventDate}</span></div>
        <div class="details-row"><span class="label">Delivery Location:</span><span class="value">${safeCityState}</span></div>
        ${safeBudget ? `<div class="details-row"><span class="label">Estimated Budget:</span><span class="value">${safeBudget}</span></div>` : ''}
        <div class="details-row"><span class="label">Phone / WhatsApp:</span><span class="value">${safePhone}</span></div>
      </div>

      <p style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 4px;">Floral Specifications:</p>
      <p style="font-size: 13px; background: #F9FAFB; padding: 12px; border-radius: 8px; border: 1px solid #E5E7EB; line-height: 1.6; color: #4B5563; margin-top: 0;">
        ${safeRequirements}
      </p>

      <div class="notice">
        <strong>Important Lead Time Note:</strong> All custom wedding garlands and temple malas are handcrafted with freshly imported flowers and delivered via FedEx or Southwest cold-chain priority dispatch. Please allow at least 1 week advance notice for bespoke designs.
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #374151; margin-top: 24px;">
        Need immediate assistance? Feel free to call or WhatsApp us at <strong>+1 (909) 379-3678</strong> or email <strong>indianflowersorder@gmail.com</strong> quoting reference <strong>${safeInquiryId}</strong>.
      </p>
    </div>
    <div class="footer">
      The Indian Flowers LLC &bull; 14922 Bobcat Lane, Fontana, CA 92336, USA<br>
      Nationwide Priority Overnight Delivery via FedEx and Southwest &bull; All Prices in USD ($)
    </div>
  </div>
</body>
</html>
`;

  // Send to Customer
  const customerResult = await sendEmailViaMsg91({
    to: [{ name: customerName, email: customerEmail }],
    subject,
    htmlContent,
    type: 'CUSTOM_ORDER_CONFIRMATION',
    metadata: { inquiryId, occasion, eventDate },
    variables: {
      customer_name: customerName,
      inquiry_id: inquiryId,
      occasion,
      event_date: eventDate,
      city_state: cityState,
      phone: customerPhone,
    },
  });

  // Also notify Store Admin
  const config = await getEffectiveEmailConfig();
  await sendEmailViaMsg91({
    to: [{ name: 'Indian Flowers Admin', email: config.adminEmail }],
    subject: `[NEW INQUIRY ${safeInquiryId}] ${safeOccasion} - ${safeCustomerName}`,
    type: 'CUSTOM_ORDER_ADMIN_ALERT',
    metadata: { inquiryId, occasion, eventDate },
    htmlContent: `
      <h2>New Custom Floral Inquiry</h2>
      <p><strong>Inquiry ID:</strong> ${safeInquiryId}</p>
      <p><strong>Name:</strong> ${safeCustomerName}</p>
      <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>City/State:</strong> ${safeCityState}</p>
      <p><strong>Event Date:</strong> ${safeEventDate}</p>
      <p><strong>Occasion:</strong> ${safeOccasion}</p>
      <p><strong>Budget:</strong> ${safeBudget || 'N/A'}</p>
      <p><strong>Requirements:</strong><br>${safeRequirements.replace(/\n/g, '<br>')}</p>
    `,
  });

  return customerResult;
}

/**
 * Format and send an automated Contact Form Confirmation email
 */
export async function sendContactFormConfirmationEmail({
  name,
  email,
  phone,
  subject,
  message,
  eventDate,
  referenceId,
}: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  eventDate?: string;
  referenceId: string;
}) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);
  const safeEventDate = escapeHtml(eventDate);
  const safeRefId = escapeHtml(referenceId);

  const emailSubject = `We Received Your Message [${safeRefId}] - Indian-Flowers.com`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF6F0; color: #111827; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; }
    .header { background: #0B3B24; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .body { padding: 24px; font-size: 13.5px; line-height: 1.6; color: #374151; }
    .details { background: #FAF9F6; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 13px; }
    .footer { text-align: center; padding: 16px; font-size: 11px; color: #9CA3AF; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>The Indian Flowers</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>Thank you for contacting Indian-Flowers.com. We have received your inquiry (Reference: <strong>${safeRefId}</strong>) regarding <em>${safeSubject}</em>.</p>
      <div class="details">
        <p><strong>Your Message:</strong></p>
        <p style="white-space: pre-line; color: #4B5563;">${safeMessage}</p>
        ${safeEventDate ? `<p><strong>Target Event Date:</strong> ${safeEventDate}</p>` : ''}
      </div>
      <p>A member of our team will get back to you within 24 hours.</p>
      <p>Urgent inquiries: Please call or text us at <strong>+1 (909) 379-3678</strong>.</p>
    </div>
    <div class="footer">
      The Indian Flowers LLC &bull; Fontana, CA 92336, USA
    </div>
  </div>
</body>
</html>
`;

  // Send to Customer
  const customerResult = await sendEmailViaMsg91({
    to: [{ name, email }],
    subject: emailSubject,
    htmlContent,
    type: 'CONTACT_CONFIRMATION',
    metadata: { referenceId, userSubject: subject, eventDate },
  });

  // Also notify Store Admin
  const config = await getEffectiveEmailConfig();
  await sendEmailViaMsg91({
    to: [{ name: 'Indian Flowers Admin', email: config.adminEmail }],
    subject: `[CONTACT INQUIRY ${safeRefId}] ${safeSubject} - ${safeName}`,
    type: 'CONTACT_ADMIN_ALERT',
    metadata: { referenceId, userSubject: subject, eventDate },
    htmlContent: `
      <h2>New Contact Form Inquiry</h2>
      <p><strong>Reference:</strong> ${safeRefId}</p>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      ${safeEventDate ? `<p><strong>Target Event Date:</strong> ${safeEventDate}</p>` : ''}
      <p><strong>Message:</strong><br>${safeMessage.replace(/\n/g, '<br>')}</p>
    `,
  });

  return customerResult;
}

/**
 * Send a direct manual reply from Admin Dashboard to an inquiry
 */
export async function sendManualReplyEmail({
  to,
  recipientName,
  subject,
  messageBody,
  inquiryReference,
}: {
  to: string;
  recipientName: string;
  subject: string;
  messageBody: string;
  inquiryReference?: string;
}): Promise<Msg91EmailResult> {
  const config = await getEffectiveEmailConfig();
  const safeRecipientName = escapeHtml(recipientName);
  const safeMessageBody = escapeHtml(messageBody);

  const formattedSubject = inquiryReference && !subject.includes(inquiryReference)
    ? `Re: [${escapeHtml(inquiryReference)}] ${subject}`
    : subject;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${formattedSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF6F0; color: #111827; margin: 0; padding: 20px; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0B3B24; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .body { padding: 28px 24px; font-size: 14px; line-height: 1.65; color: #1F2937; }
    .message-content { white-space: pre-wrap; font-size: 14px; color: #374151; margin: 20px 0; padding: 16px; background: #F9FAFB; border-left: 4px solid #0B3B24; border-radius: 8px; }
    .signature { margin-top: 24px; font-size: 13px; color: #4B5563; white-space: pre-line; border-top: 1px solid #E5E7EB; padding-top: 16px; }
    .footer { text-align: center; padding: 18px; font-size: 11px; color: #9CA3AF; border-top: 1px solid #F3F4F6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>The Indian Flowers</h1>
    </div>
    <div class="body">
      <p style="margin-top: 0;">Dear <strong>${safeRecipientName || 'Valued Customer'}</strong>,</p>
      <div class="message-content">${safeMessageBody}</div>
      <div class="signature">${config.replySignature}</div>
    </div>
    <div class="footer">
      The Indian Flowers LLC &bull; 14922 Bobcat Lane, Fontana, CA 92336 &bull; (909) 379-3678<br>
      Fresh Indian Flowers & Handcrafted Temple / Wedding Garlands Delivered Nationwide
    </div>
  </div>
</body>
</html>
`;

  return sendEmailViaMsg91({
    to: [{ name: recipientName, email: to }],
    subject: formattedSubject,
    htmlContent,
    type: 'MANUAL_REPLY',
    metadata: { inquiryReference },
  });
}

/**
 * Send a Test Email directly from the Admin Mail Configuration panel
 */
export async function sendTestEmail(targetEmail: string): Promise<Msg91EmailResult> {
  const config = await getEffectiveEmailConfig();
  const isBrevo = config.provider === 'brevo';
  const providerLabel = isBrevo ? 'Brevo (Sendinblue)' : config.provider === 'smtp' ? 'Custom SMTP' : 'MSG91';
  const senderEmail = isBrevo ? (config.brevoFromEmail || config.fromEmail) : config.fromEmail;
  const senderName = isBrevo ? (config.brevoFromName || config.fromName) : config.fromName;
  const subject = `${providerLabel} Email Integration Test - The Indian Flowers`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { background: #0B3B24; padding: 24px; text-align: center; color: #ffffff; }
    .body { padding: 24px; font-size: 13.5px; line-height: 1.6; }
    .success-box { background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 14px; margin: 16px 0; color: #065F46; }
    .meta { font-family: monospace; font-size: 12px; background: #F1F5F9; padding: 12px; border-radius: 8px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0; font-size: 20px;">The Indian Flowers</h2>
      <p style="margin: 4px 0 0; font-size: 12px; color: #8FE7B8;">Email Service Diagnostic Test</p>
    </div>
    <div class="body">
      <div class="success-box">
        <strong>✓ Email Dispatch Successful!</strong><br>
        Your ${providerLabel} credentials in The Indian Flowers Admin Panel are connected and working properly.
      </div>
      <div class="meta">
        <strong>Gateway:</strong> ${providerLabel}<br>
        <strong>Sender:</strong> ${escapeHtml(senderName)} &lt;${escapeHtml(senderEmail)}&gt;<br>
        ${isBrevo ? `<strong>Endpoint:</strong> https://api.brevo.com/v3/smtp/email<br>` : `<strong>Domain:</strong> ${escapeHtml(config.domain)}<br>`}
        <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
        <strong>Destination:</strong> ${escapeHtml(targetEmail)}
      </div>
    </div>
  </div>
</body>
</html>
`;

  return sendEmailViaMsg91({
    to: [{ name: 'Store Administrator', email: targetEmail }],
    subject,
    htmlContent,
    type: 'TEST_EMAIL',
    metadata: { testDispatch: true, gateway: config.provider },
  });
}

/**
 * Universal alias for transactional email dispatching
 */
export const sendTransactionalEmail = sendEmailViaMsg91;
