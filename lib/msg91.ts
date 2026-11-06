/**
 * MSG91 & Unified Transactional Email Service
 * Handles transactional emails, automated confirmations, customer replies,
 * test dispatches, and sent logging into MongoDB EmailLog collection.
 */

import connectToDatabase from '@/lib/db';
import EmailLog, { IEmailLog } from '@/models/EmailLog';
import EmailConfig, { IEmailConfig } from '@/models/EmailConfig';
import {
  renderCustomInquiryConfirmationEmail,
  renderContactFormConfirmationEmail,
  renderManualReplyEmail,
  renderEmailLayout,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP,
} from './emailTemplate';

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
  smtpFromEmail?: string;
  smtpFromName?: string;
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
    provider: (dbConfig?.provider || process.env.EMAIL_PROVIDER || process.env.MAIL_PROVIDER || 'msg91') as any,
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
    smtpFromEmail: dbConfig?.smtpFromEmail,
    smtpFromName: dbConfig?.smtpFromName,
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

  // If user provided an SMTP key (xsmtpsib-...) instead of a REST API key (xkeysib-...)
  if (config.brevoApiKey.trim().startsWith('xsmtpsib-')) {
    const errMsg = 'Invalid Brevo Key: You entered an SMTP Key (xsmtpsib-...) instead of a REST API Key (xkeysib-...). In Brevo dashboard, navigate to SMTP & API > API Keys tab (NOT the SMTP tab) to generate a REST API key, or switch to the Custom SMTP tab.';
    console.error(`[Brevo] ${errMsg}`);
    return {
      success: false,
      message: errMsg,
      data: { code: 'smtp_key_used_as_api_key' },
    };
  }
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
 * Send email via Custom SMTP (e.g. Brevo SMTP Relay, Google Workspace, AWS SES, or Custom Server)
 */
export async function sendEmailViaSmtp(options: SendEmailOptions): Promise<Msg91EmailResult> {
  const config = await getEffectiveEmailConfig();
  const recipient = options.to[0] || { email: '', name: '' };
  const recipientEmail = recipient.email;
  const recipientName = recipient.name;

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    console.warn(
      `[SMTP] Host, Username, or Password not configured. Simulating email send to ${options.to.map((r) => r.email).join(', ')} with subject: "${options.subject}"`
    );

    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${config.smtpFromName || config.fromName} <${config.smtpFromEmail || config.smtpUser || config.fromEmail}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'SIMULATED',
      provider: 'SMTP',
      errorMessage: 'Simulated dispatch (SMTP credentials incomplete in Admin/Environment)',
      htmlBody: options.htmlContent,
      metadata: options.metadata || {},
    });

    return {
      success: true,
      simulated: true,
      logId,
      message: 'Email simulated (SMTP credentials incomplete)',
    };
  }

  try {
    const nodemailerModule: any = await import('nodemailer');
    const createTransport = nodemailerModule.createTransport || nodemailerModule.default?.createTransport;
    if (typeof createTransport !== 'function') {
      throw new Error('Failed to resolve createTransport from nodemailer module');
    }

    const port = Number(config.smtpPort) || 587;
    const isSecure = config.smtpSecure !== undefined ? config.smtpSecure : port === 465;

    const transporter = createTransport({
      host: config.smtpHost,
      port,
      secure: isSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const senderEmail = (
      options.from?.email ||
      config.smtpFromEmail ||
      config.brevoFromEmail ||
      config.adminEmail ||
      config.fromEmail ||
      config.smtpUser
    ).trim();

    const senderName = (
      options.from?.name ||
      config.smtpFromName ||
      config.brevoFromName ||
      config.fromName ||
      'The Indian Flowers'
    ).trim();

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: options.to.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', '),
      subject: options.subject,
      html: options.htmlContent,
      text: options.textContent,
      replyTo: config.adminEmail || 'indianflowersorder@gmail.com',
    });

    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${senderName} <${senderEmail}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'SENT',
      provider: 'SMTP',
      htmlBody: options.htmlContent,
      metadata: {
        messageId: info.messageId,
        response: info.response,
        ...(options.metadata || {}),
      },
    });

    return {
      success: true,
      logId,
      message: `Email dispatched successfully via SMTP (${config.smtpHost})`,
      data: info,
    };
  } catch (error: any) {
    console.error('[SMTP] Email send failed:', error);

    const logId = await recordEmailLog({
      to: recipientEmail,
      recipientName,
      from: `${config.fromName} <${config.fromEmail}>`,
      subject: options.subject,
      type: options.type || 'OTHER',
      status: 'FAILED',
      provider: 'SMTP',
      errorMessage: error.message || 'SMTP dispatch error',
      htmlBody: options.htmlContent,
      metadata: options.metadata || {},
    });

    return {
      success: false,
      logId,
      message: error.message || 'SMTP transmission failure',
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

  // Route to Custom SMTP if configured
  if (config.provider === 'smtp') {
    return sendEmailViaSmtp(options);
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
  const rendered = renderCustomInquiryConfirmationEmail({
    customerName,
    customerPhone,
    cityState,
    eventDate,
    occasion,
    requirements,
    budget,
    inquiryId,
  });

  const subject = rendered.subject;
  const htmlContent = rendered.html;
  const textContent = rendered.text;

  // Send to Customer
  const customerResult = await sendEmailViaMsg91({
    to: [{ name: customerName, email: customerEmail }],
    subject,
    htmlContent,
    textContent,
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

  // Also notify Store Admin for Custom Floral Inquiry
  const safeInquiryId = escapeHtml(inquiryId);
  const safeCustomerName = escapeHtml(customerName);
  const safeCustomerEmail = escapeHtml(customerEmail);
  const safeCustomerPhone = escapeHtml(customerPhone);
  const safeCityState = escapeHtml(cityState);
  const safeEventDate = escapeHtml(eventDate);
  const safeOccasion = escapeHtml(occasion);
  const safeRequirements = escapeHtml(requirements);
  const safeBudget = budget ? escapeHtml(budget) : '';

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
      <p><strong>Email:</strong> ${safeCustomerEmail}</p>
      <p><strong>Phone:</strong> ${safeCustomerPhone}</p>
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
  const rendered = renderContactFormConfirmationEmail({
    name,
    email,
    phone,
    subject,
    message,
    referenceId,
  });

  const emailSubject = rendered.subject;
  const htmlContent = rendered.html;
  const textContent = rendered.text;

  // Send to Customer
  const customerResult = await sendEmailViaMsg91({
    to: [{ name, email }],
    subject: emailSubject,
    htmlContent,
    textContent,
    type: 'CONTACT_CONFIRMATION',
    metadata: { referenceId, userSubject: subject, eventDate },
  });

  // Also notify Store Admin for Contact Inquiry
  const safeRefId = escapeHtml(referenceId);
  const safeSubject = escapeHtml(subject);
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeEventDate = eventDate ? escapeHtml(eventDate) : '';
  const safeMessage = escapeHtml(message);

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
  const rendered = renderManualReplyEmail({
    recipientName,
    messageBody: config.replySignature
      ? `${messageBody}\n\n${config.replySignature}`
      : messageBody,
    inquiryReference,
    subject,
  });

  return sendEmailViaMsg91({
    to: [{ name: recipientName, email: to }],
    subject: rendered.subject,
    htmlContent: rendered.html,
    textContent: rendered.text,
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
  const isSmtp = config.provider === 'smtp';
  const providerLabel = isBrevo ? 'Brevo (Sendinblue)' : isSmtp ? 'Custom SMTP' : 'MSG91';
  const senderEmail = isBrevo
    ? (config.brevoFromEmail || config.fromEmail)
    : isSmtp
    ? (config.smtpFromEmail || config.brevoFromEmail || config.smtpUser || config.fromEmail)
    : config.fromEmail;
  const senderName = isBrevo ? (config.brevoFromName || config.fromName) : isSmtp ? (config.smtpFromName || config.fromName) : config.fromName;
  const subject = `${providerLabel} Email Integration Test - The Indian Flowers`;

  const contentHtml = `
    <h2 class="text-title" style="margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #0B3B24; letter-spacing: -0.02em;">
      Email Service Diagnostic Test
    </h2>
    <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; color: #065F46; font-size: 13.5px; line-height: 1.5;">
      <strong>✓ Email Dispatch Successful!</strong><br>
      Your ${providerLabel} credentials in The Indian Flowers Admin Panel are connected and active.
    </div>

    <!-- Diagnostic Metadata Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF9F6; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px; font-family: monospace; font-size: 12px; color: #374151; margin-bottom: 16px;">
      <tr><td style="padding: 4px 0;"><strong>Gateway:</strong> ${providerLabel}</td></tr>
      <tr><td style="padding: 4px 0;"><strong>Sender:</strong> ${escapeHtml(senderName)} &lt;${escapeHtml(senderEmail)}&gt;</td></tr>
      <tr><td style="padding: 4px 0;">${isBrevo ? '<strong>Endpoint:</strong> https://api.brevo.com/v3/smtp/email' : isSmtp ? `<strong>Host:</strong> ${escapeHtml(config.smtpHost || '')}:${config.smtpPort || 587}` : `<strong>Domain:</strong> ${escapeHtml(config.domain)}`}</td></tr>
      <tr><td style="padding: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</td></tr>
      <tr><td style="padding: 4px 0;"><strong>Destination:</strong> ${escapeHtml(targetEmail)}</td></tr>
    </table>
  `;

  const layout = renderEmailLayout({
    preheader: `Email test successful via ${providerLabel}.`,
    headerBadge: 'System Diagnostic',
    headerTitle: subject,
    contentHtml,
    contentText: `Email Dispatch Successful!\nGateway: ${providerLabel}\nSender: ${senderName} <${senderEmail}>\nTimestamp: ${new Date().toISOString()}`,
  });

  return sendEmailViaMsg91({
    to: [{ name: 'Store Administrator', email: targetEmail }],
    subject,
    htmlContent: layout.html,
    textContent: layout.text,
    type: 'TEST_EMAIL',
    metadata: { testDispatch: true, gateway: config.provider },
  });
}

/**
 * Universal alias for transactional email dispatching
 */
export const sendTransactionalEmail = sendEmailViaMsg91;
