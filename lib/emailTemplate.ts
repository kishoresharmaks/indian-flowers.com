/**
 * Unified Transactional Email Template Engine for Indian-Flowers.com
 * 
 * Generates table-based, cross-client HTML emails with embedded responsive styling,
 * dark and light mode compatibility, MSO Outlook conditionals, and the official brand logo.
 */

import { escapeHtml } from './msg91';
import { calculateExpectedShipmentDate } from './dateUtils';
export { calculateExpectedShipmentDate };

export const EMAIL_LOGO_URL = 'https://indian-flowers.com/the-indian-flowers-logo.png';
export const SUPPORT_EMAIL = 'indianflowers2020@gmail.com';
export const SUPPORT_WHATSAPP = '+1 (909) 834-1722';
export const SUPPORT_WHATSAPP_LINK = 'https://wa.me/19098341722';
export const SUPPORT_PHONE = '+1 (909) 379-3678';
export const COMPANY_ADDRESS = '14922 Bobcat Lane, Fontana, CA 92336, USA';

export interface EmailLayoutOptions {
  preheader?: string;
  headerBadge?: string;
  headerTitle?: string;
  contentHtml: string;
  contentText?: string;
  maxWidth?: number;
}

/**
 * Master Responsive Email Skeleton with Dual Light/Dark Mode and Outlook MSO Support
 */
export function renderEmailLayout(options: EmailLayoutOptions): { html: string; text: string } {
  const { preheader = '', headerBadge = '', headerTitle = 'The Indian Flowers', contentHtml, contentText = '', maxWidth = 600 } = options;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(headerTitle)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #FAF6F0; }
    
    /* Dark Mode Overrides */
    @media (prefers-color-scheme: dark) {
      body { background-color: #121815 !important; }
      .email-bg { background-color: #121815 !important; }
      .email-card { background-color: #1A2420 !important; border-color: #263830 !important; }
      .text-title { color: #FFFFFF !important; }
      .text-body { color: #D1D5DB !important; }
      .text-muted { color: #9CA3AF !important; }
      .card-inner { background-color: #212E29 !important; border-color: #2D3E37 !important; }
      .table-border { border-color: #2D3E37 !important; }
      .footer-text { color: #8C9993 !important; }
    }
    
    /* Outlook Web Dark Mode */
    [data-ogsc] body { background-color: #121815 !important; }
    [data-ogsc] .email-card { background-color: #1A2420 !important; }
    [data-ogsc] .text-title { color: #FFFFFF !important; }
    [data-ogsc] .text-body { color: #D1D5DB !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${preheader ? `
  <!-- Hidden Preheader snippet for inbox preview -->
  <div style="display: none; font-size: 1px; color: #FAF6F0; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader)}
  </div>
  ` : ''}

  <!-- Master Center Container -->
  <table role="presentation" class="email-bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF6F0; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!--[if (gte mso 9)|(IE)]>
        <table width="${maxWidth}" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
        <![endif]-->
        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: ${maxWidth}px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          
          <!-- Brand Header with Logo -->
          <tr>
            <td align="center" style="background-color: #0B3B24; padding: 28px 20px 24px; text-align: center;">
              <!-- Protected High-Contrast Logo Frame -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display: inline-block; background-color: #FAF6F0; border-radius: 12px; padding: 8px 16px; border: 1px solid rgba(255,255,255,0.25);">
                <tr>
                  <td align="center" style="line-height: 0;">
                    <a href="https://indian-flowers.com" target="_blank" style="text-decoration: none; display: block;">
                      <img src="${EMAIL_LOGO_URL}" alt="The Indian Flowers" width="220" height="64" border="0" style="display: block; width: 220px; height: auto; max-width: 100%; border: 0; outline: none; margin: 0 auto;" />
                    </a>
                  </td>
                </tr>
              </table>
              <div style="color: #8FE7B8; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 10px;">
                Fresh Indian Flowers &bull; Handcrafted Garlands &bull; USA Nationwide
              </div>
            </td>
          </tr>

          ${headerBadge ? `
          <!-- Category / Reference Eyebrow -->
          <tr>
            <td align="center" style="padding: 16px 24px 0;">
              <span style="display: inline-block; background-color: #EAF5EE; color: #0B3B24; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 20px; border: 1px solid #D1E7DD;">
                ${escapeHtml(headerBadge)}
              </span>
            </td>
          </tr>
          ` : ''}

          <!-- Email Content Body -->
          <tr>
            <td class="email-body" style="padding: 24px 28px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Omnichannel Assistance & Cold-Chain Notice Box -->
          <tr>
            <td style="padding: 0 28px 24px;">
              <table role="presentation" class="card-inner" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9FAF9; border: 1px solid #E5E7EB; border-radius: 14px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 700; color: #0B3B24; margin-bottom: 6px;">
                      🌿 Freshness Guaranteed &bull; Customer Care Concierge
                    </div>
                    <div style="font-size: 12px; line-height: 1.6; color: #4B5563;">
                      Have questions or require rush updates for your event? Reach our dedicated team directly:
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                      <tr>
                        <td style="padding-right: 14px;">
                          <a href="${SUPPORT_WHATSAPP_LINK}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 11.5px; font-weight: 700; text-decoration: none; padding: 6px 14px; border-radius: 8px;">
                            Chat on WhatsApp (${SUPPORT_WHATSAPP})
                          </a>
                        </td>
                        <td>
                          <a href="mailto:${SUPPORT_EMAIL}" style="display: inline-block; background-color: #0B3B24; color: #FFFFFF; font-size: 11.5px; font-weight: 700; text-decoration: none; padding: 6px 14px; border-radius: 8px;">
                            Email: ${SUPPORT_EMAIL}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Compliance & Fiduciary Footer -->
          <tr>
            <td align="center" style="background-color: #F8F9FA; border-top: 1px solid #E5E7EB; padding: 20px 24px; text-align: center;">
              <div class="footer-text" style="font-size: 11px; line-height: 1.6; color: #6B7280;">
                <strong>The Indian Flowers LLC</strong> &bull; ${COMPANY_ADDRESS}<br/>
                Phone: <a href="tel:+19093793678" style="color: #0B3B24; text-decoration: none; font-weight: 600;">${SUPPORT_PHONE}</a> &bull;
                WhatsApp: <a href="${SUPPORT_WHATSAPP_LINK}" style="color: #0B3B24; text-decoration: none; font-weight: 600;">${SUPPORT_WHATSAPP}</a><br/>
                All prices in US Dollars ($ USD) &bull; FedEx &amp; Southwest Cargo Priority Cold-Chain Delivery
              </div>
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text: contentText };
}

/**
 * 1. Order Confirmation & Digital Receipt Template
 */
export function renderOrderConfirmationEmail(options: {
  orderId: string;
  customerName: string;
  deliveryDate?: string;
  totalAmount: number;
  items?: Array<{ name: string; quantity: number; price: number; variant?: string }>;
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  shippingAddress?: string;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(options.customerName);
  const safeOrderId = escapeHtml(options.orderId);
  const safeDelivery = escapeHtml(options.deliveryDate || 'Guaranteed Fresh Delivery');
  const safeAddress = escapeHtml(options.shippingAddress || '');

  const itemsRows = (options.items || []).map((item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px; color: #111827;">
        <strong>${escapeHtml(item.name)}</strong>${item.variant ? `<br/><span style="font-size: 11.5px; color: #6B7280;">${escapeHtml(item.variant)}</span>` : ''}
      </td>
      <td align="center" style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px; color: #4B5563;">
        ${item.quantity}
      </td>
      <td align="right" style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px; font-weight: 600; color: #111827;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const contentHtml = `
    <h2 class="text-title" style="margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #0B3B24; letter-spacing: -0.02em;">
      Thank You For Your Order!
    </h2>
    <p class="text-body" style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px;">
      Dear <strong>${safeName}</strong>, your order <strong>#${safeOrderId}</strong> has been received and confirmed. Our garland artisans will harvest and handcraft your fresh florals specifically for your requested delivery schedule.
    </p>

    <!-- Key Delivery Highlight -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #EAF5EE; border-left: 4px solid #0B3B24; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
      <tr>
        <td style="font-size: 13px; color: #0B3B24;">
          <strong>Target Delivery Date:</strong> ${safeDelivery}
        </td>
      </tr>
    </table>

    ${options.items && options.items.length > 0 ? `
    <!-- Items Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px;">
      <thead>
        <tr style="border-bottom: 2px solid #E5E7EB;">
          <th align="left" style="font-size: 11.5px; text-transform: uppercase; color: #6B7280; padding-bottom: 8px;">Item</th>
          <th align="center" style="font-size: 11.5px; text-transform: uppercase; color: #6B7280; padding-bottom: 8px; width: 60px;">Qty</th>
          <th align="right" style="font-size: 11.5px; text-transform: uppercase; color: #6B7280; padding-bottom: 8px; width: 80px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
    ` : ''}

    <!-- Totals Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; font-size: 13px;">
      ${options.subtotal !== undefined ? `
      <tr>
        <td align="right" style="padding: 4px 0; color: #6B7280;">Subtotal:</td>
        <td align="right" style="padding: 4px 0; width: 90px; color: #111827; font-weight: 500;">$${options.subtotal.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${options.shippingFee !== undefined ? `
      <tr>
        <td align="right" style="padding: 4px 0; color: #6B7280;">Shipping &amp; Handling:</td>
        <td align="right" style="padding: 4px 0; width: 90px; color: #111827; font-weight: 500;">$${options.shippingFee.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${options.tax !== undefined && options.tax > 0 ? `
      <tr>
        <td align="right" style="padding: 4px 0; color: #6B7280;">Estimated Sales Tax:</td>
        <td align="right" style="padding: 4px 0; width: 90px; color: #111827; font-weight: 500;">$${options.tax.toFixed(2)}</td>
      </tr>
      ` : ''}
      <tr style="border-top: 2px solid #0B3B24;">
        <td align="right" style="padding: 8px 0; font-size: 15px; font-weight: 700; color: #0B3B24;">Total Paid (USD):</td>
        <td align="right" style="padding: 8px 0; width: 90px; font-size: 16px; font-weight: 800; color: #0B3B24;">$${options.totalAmount.toFixed(2)}</td>
      </tr>
    </table>

    ${safeAddress ? `
    <div style="font-size: 12.5px; line-height: 1.5; color: #4B5563; padding: 12px 14px; background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 16px;">
      <strong>Shipping Address:</strong><br/>
      ${safeAddress}
    </div>
    ` : ''}
  `;

  const text = `Dear ${options.customerName},\n\nThank you for ordering with Indian-Flowers.com! Your payment has been received and order #${options.orderId} is confirmed.\n\nTarget Delivery Date: ${options.deliveryDate || 'Guaranteed Fresh Delivery'}\nTotal Amount: $${options.totalAmount.toFixed(2)}\n\nSupport Email: ${SUPPORT_EMAIL}\nWhatsApp: ${SUPPORT_WHATSAPP}\nPhone: ${SUPPORT_PHONE}\n\nWarm regards,\nThe Indian Flowers Team`;

  const layout = renderEmailLayout({
    preheader: `Your order #${options.orderId} is confirmed for ${options.deliveryDate || 'fresh delivery'}.`,
    headerBadge: `Order #${options.orderId}`,
    headerTitle: `Order Confirmation #${options.orderId} - Indian-Flowers.com`,
    contentHtml,
    contentText: text,
  });

  return {
    subject: `Order Confirmation #${options.orderId} - Indian-Flowers.com`,
    html: layout.html,
    text: layout.text,
  };
}

/**
 * 2. Custom Floral / Garland Inquiry Confirmation Template
 */
export function renderCustomInquiryConfirmationEmail(options: {
  customerName: string;
  customerPhone: string;
  cityState: string;
  eventDate: string;
  occasion: string;
  requirements: string;
  budget?: string;
  inquiryId: string;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(options.customerName);
  const safeOccasion = escapeHtml(options.occasion);
  const safeEventDate = escapeHtml(options.eventDate);
  const safeCityState = escapeHtml(options.cityState);
  const safeBudget = escapeHtml(options.budget || 'Not specified');
  const safePhone = escapeHtml(options.customerPhone);
  const safeRequirements = escapeHtml(options.requirements);
  const safeInquiryId = escapeHtml(options.inquiryId);

  const contentHtml = `
    <h2 class="text-title" style="margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #0B3B24; letter-spacing: -0.02em;">
      Custom Floral Request Received
    </h2>
    <p class="text-body" style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px;">
      Dear <strong>${safeName}</strong>, thank you for submitting your custom garland and fresh floral inquiry. Our master floral coordinator will review your celebration requirements and contact you within 24 hours.
    </p>

    <!-- Inquiry Details Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF9F6; border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px;">
      <tr>
        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Inquiry Reference:</td>
        <td align="right" style="padding: 6px 0; color: #0B3B24; font-weight: 700;">${safeInquiryId}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Occasion / Ceremony:</td>
        <td align="right" style="padding: 6px 0; color: #111827; font-weight: 600;">${safeOccasion}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Event Date:</td>
        <td align="right" style="padding: 6px 0; color: #111827; font-weight: 600;">${safeEventDate}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Delivery Destination:</td>
        <td align="right" style="padding: 6px 0; color: #111827; font-weight: 600;">${safeCityState}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Contact Phone:</td>
        <td align="right" style="padding: 6px 0; color: #111827; font-weight: 600;">${safePhone}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6B7280; font-weight: 500;">Budget Estimate:</td>
        <td align="right" style="padding: 6px 0; color: #111827; font-weight: 600;">${safeBudget}</td>
      </tr>
    </table>

    <div style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 6px;">Floral Specifications:</div>
    <div style="font-size: 13px; line-height: 1.6; color: #4B5563; background-color: #F9FAFB; padding: 12px 14px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
      ${safeRequirements}
    </div>

    <!-- Cold-chain Lead Time Reminder -->
    <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400E;">
      <strong>Cold-Chain Lead Time Notice:</strong> All custom wedding garlands and temple malas are handcrafted with freshly imported flowers and delivered via FedEx or Southwest Cargo cold-chain priority dispatch. Please allow at least 1 week advance notice for bespoke designs.
    </div>
  `;

  const text = `Dear ${options.customerName},\n\nThank you for submitting your custom floral inquiry [${options.inquiryId}] for ${options.occasion}.\n\nEvent Date: ${options.eventDate}\nDestination: ${options.cityState}\nPhone: ${options.customerPhone}\nBudget: ${options.budget || 'N/A'}\n\nFloral Specifications:\n${options.requirements}\n\nOur team will review your specifications and contact you within 24 hours.\n\nSupport Email: ${SUPPORT_EMAIL}\nWhatsApp: ${SUPPORT_WHATSAPP}\nPhone: ${SUPPORT_PHONE}`;

  const layout = renderEmailLayout({
    preheader: `We have received your custom floral request [${options.inquiryId}] for ${options.occasion}.`,
    headerBadge: `Inquiry #${options.inquiryId}`,
    headerTitle: `Your Custom Floral Request Received [${options.inquiryId}] - Indian-Flowers.com`,
    contentHtml,
    contentText: text,
  });

  return {
    subject: `Your Custom Floral Request Received [${options.inquiryId}] - Indian-Flowers.com`,
    html: layout.html,
    text: layout.text,
  };
}

/**
 * 3. Contact Form Submission Confirmation Template
 */
export function renderContactFormConfirmationEmail(options: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  referenceId: string;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(options.name);
  const safeSubject = escapeHtml(options.subject);
  const safeMessage = escapeHtml(options.message);
  const safeRefId = escapeHtml(options.referenceId);

  const contentHtml = `
    <h2 class="text-title" style="margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #0B3B24; letter-spacing: -0.02em;">
      We Have Received Your Message
    </h2>
    <p class="text-body" style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px;">
      Dear <strong>${safeName}</strong>, thank you for reaching out to The Indian Flowers. Our floral support concierge has logged your inquiry under reference <strong>#${safeRefId}</strong> and will get back to you within 2 to 4 business hours.
    </p>

    <!-- Message Summary Box -->
    <div style="background-color: #FAF9F6; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6B7280; margin-bottom: 4px;">Subject:</div>
      <div style="font-size: 14px; font-weight: 700; color: #0B3B24; margin-bottom: 12px;">${safeSubject}</div>
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6B7280; margin-bottom: 4px;">Your Message:</div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151;">${safeMessage}</div>
    </div>
  `;

  const text = `Dear ${options.name},\n\nThank you for reaching out to The Indian Flowers. Your inquiry [${options.referenceId}] regarding "${options.subject}" has been received. Our team will get back to you within 2 to 4 hours.\n\nSupport Email: ${SUPPORT_EMAIL}\nWhatsApp: ${SUPPORT_WHATSAPP}\nPhone: ${SUPPORT_PHONE}`;

  const layout = renderEmailLayout({
    preheader: `Thank you for contacting The Indian Flowers. Reference #${options.referenceId}.`,
    headerBadge: `Inquiry #${options.referenceId}`,
    headerTitle: `We Received Your Message [${options.referenceId}] - Indian-Flowers.com`,
    contentHtml,
    contentText: text,
  });

  return {
    subject: `We Received Your Message [${options.referenceId}] - Indian-Flowers.com`,
    html: layout.html,
    text: layout.text,
  };
}

/**
 * 4. Password Reset & Account Security Template
 */
export function renderPasswordResetEmail(options: {
  recipientName: string;
  resetUrl: string;
  otpCode: string;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(options.recipientName);
  const safeUrl = escapeHtml(options.resetUrl);
  const safeOtp = escapeHtml(options.otpCode);

  const contentHtml = `
    <h2 class="text-title" style="margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #0B3B24; letter-spacing: -0.02em;">
      Password Reset Request
    </h2>
    <p class="text-body" style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 20px;">
      Hello <strong>${safeName}</strong>, we received a request to reset your password for your Indian-Flowers.com customer account.
    </p>

    <!-- OTP Code Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF9F6; border: 2px dashed #0B3B24; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
      <tr>
        <td align="center">
          <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.1em; margin-bottom: 6px;">
            Your 6-Digit Verification Code
          </div>
          <div style="font-size: 32px; font-weight: 800; color: #0B3B24; letter-spacing: 6px; font-family: monospace;">
            ${safeOtp}
          </div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 6px;">
            Valid for the next 15 minutes
          </div>
        </td>
      </tr>
    </table>

    <!-- Direct Action Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${safeUrl}" target="_blank" style="display: inline-block; background-color: #0B3B24; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 2px 8px rgba(11,59,36,0.25);">
            Reset Your Password
          </a>
        </td>
      </tr>
    </table>

    <div style="font-size: 12px; line-height: 1.5; color: #6B7280; text-align: center;">
      If you did not request this password reset, you can safely ignore this email. Your account remains completely secure.
    </div>
  `;

  const text = `Hello ${options.recipientName},\n\nWe received a request to reset your password for Indian-Flowers.com.\n\nYour 6-digit verification code: ${options.otpCode}\n\nOr click the link below:\n${options.resetUrl}\n\nThis code expires in 15 minutes. If you did not request this, please ignore this email.`;

  const layout = renderEmailLayout({
    preheader: `Your password reset code is ${options.otpCode}. Valid for 15 minutes.`,
    headerBadge: 'Security Verification',
    headerTitle: 'Reset Your Password - Indian-Flowers.com',
    contentHtml,
    contentText: text,
  });

  return {
    subject: 'Reset Your Password - Indian-Flowers.com',
    html: layout.html,
    text: layout.text,
  };
}

/**
 * 5. Admin Customer Support Manual Reply Template
 */
export function renderManualReplyEmail(options: {
  recipientName: string;
  messageBody: string;
  inquiryReference?: string;
  subject: string;
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(options.recipientName);
  const safeBody = escapeHtml(options.messageBody).replace(/\n/g, '<br/>');
  const safeRef = escapeHtml(options.inquiryReference || '');

  const contentHtml = `
    <h2 class="text-title" style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #0B3B24; letter-spacing: -0.02em;">
      Response from Floral Concierge
    </h2>
    <p class="text-body" style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px;">
      Dear <strong>${safeName}</strong>,
    </p>

    <!-- Support Reply Body -->
    <div style="font-size: 14px; line-height: 1.7; color: #1F2937; background-color: #FAF9F6; border-left: 4px solid #0B3B24; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
      ${safeBody}
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #4B5563; margin: 0 0 12px;">
      Feel free to reply directly to this email or reach us on WhatsApp at <strong>${SUPPORT_WHATSAPP}</strong> if you need any additional customization.
    </p>
  `;

  const text = `Dear ${options.recipientName},\n\n${options.messageBody}\n\nWarm regards,\nThe Indian Flowers Team\nSupport Email: ${SUPPORT_EMAIL}\nWhatsApp: ${SUPPORT_WHATSAPP}\nPhone: ${SUPPORT_PHONE}`;

  const finalSubject = options.inquiryReference
    ? `Re: [${options.inquiryReference}] ${options.subject}`
    : options.subject;

  const layout = renderEmailLayout({
    preheader: `Update from The Indian Flowers regarding ${options.subject}`,
    headerBadge: safeRef ? `Ref #${safeRef}` : 'Customer Care',
    headerTitle: finalSubject,
    contentHtml,
    contentText: text,
  });

  return {
    subject: finalSubject,
    html: layout.html,
    text: layout.text,
  };
}

export interface AdminOrderAlertItem {
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  description?: string;
}

export interface AdminOrderAlertOptions {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  orderDate?: string | Date;
  deliveryDate?: string;
  deliveryMethod?: string;
  shippingAddress?: string;
  items: AdminOrderAlertItem[];
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
}

/**
 * 6. Admin Storefront Order Alert Template with 11-Column Tabular Matrix
 */
export function renderAdminOrderAlertEmail(options: AdminOrderAlertOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const safeCustomerName = escapeHtml(options.customerName || 'Customer');
  const safeOrderId = escapeHtml(options.orderId);
  const safeCustomerPhone = escapeHtml(options.customerPhone || 'N/A');
  const safeCustomerEmail = escapeHtml(options.customerEmail || '');
  const safeDeliveryMethod = escapeHtml(options.deliveryMethod || 'FedEx Priority Overnight');
  const safeDeliveryDate = escapeHtml(options.deliveryDate || 'Guaranteed Fresh Delivery');
  const safeAddress = escapeHtml(options.shippingAddress || 'Customer shipping address not provided');
  const safePaymentMethod = escapeHtml(options.paymentMethod || 'CreditCard');
  const safePaymentStatus = escapeHtml(options.paymentStatus || 'Paid');

  // Format Order Date
  let safeOrderDate: string;
  if (options.orderDate instanceof Date) {
    safeOrderDate = options.orderDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } else if (typeof options.orderDate === 'string' && options.orderDate.trim()) {
    const parsed = new Date(options.orderDate);
    safeOrderDate = !isNaN(parsed.getTime())
      ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : options.orderDate;
  } else {
    safeOrderDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Calculate Expected Shipment Date
  const expectedShipmentDate = calculateExpectedShipmentDate(options.deliveryDate, options.deliveryMethod);
  const safeShipmentDate = escapeHtml(expectedShipmentDate);

  const itemsList = options.items && options.items.length > 0 ? options.items : [
    { name: 'Fresh Floral Order', quantity: 1, price: options.totalAmount, variant: '', description: '' },
  ];

  // Build the 11-Column Table Rows
  const tableRowsHtml = itemsList
    .map((item, idx) => {
      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
      const itemTotal = (Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2);
      const itemDesc = item.variant || item.description || 'Fresh Handcrafted';

      return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 8px; color: #111827; font-weight: 600; white-space: nowrap; border: 1px solid #E5E7EB;">
            ${safeCustomerName}
          </td>
          <td align="center" style="padding: 10px 8px; color: #111827; font-weight: 700; border: 1px solid #E5E7EB;">
            ${item.quantity}
          </td>
          <td style="padding: 10px 8px; color: #111827; font-weight: 600; min-width: 130px; border: 1px solid #E5E7EB;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding: 10px 8px; color: #4B5563; font-size: 11.5px; min-width: 120px; border: 1px solid #E5E7EB;">
            ${escapeHtml(itemDesc)}
          </td>
          <td style="padding: 10px 8px; color: #374151; white-space: nowrap; border: 1px solid #E5E7EB;">
            ${safeDeliveryMethod}
          </td>
          <td style="padding: 10px 8px; color: #374151; white-space: nowrap; border: 1px solid #E5E7EB;">
            ${safeOrderDate}
          </td>
          <td style="padding: 10px 8px; background-color: #F0FDF4; color: #0B3B24; font-weight: 700; border: 1px solid #BBF7D0; white-space: nowrap;">
            ${safeDeliveryDate}
          </td>
          <td style="padding: 10px 8px; background-color: #FEF3C7; color: #92400E; font-weight: 700; border: 1px solid #FDE68A; white-space: nowrap;">
            ${safeShipmentDate}
          </td>
          <td style="padding: 10px 8px; background-color: #F0FDF4; border: 1px solid #BBF7D0; white-space: nowrap;">
            <strong style="color: #0B3B24;">${safeCustomerPhone}</strong><br/>
            <span style="font-size: 11px; color: #4B5563;">${safeCustomerEmail}</span>
          </td>
          <td style="padding: 10px 8px; background-color: #F0FDF4; color: #0B3B24; font-weight: 700; border: 1px solid #BBF7D0; white-space: nowrap;">
            #${safeOrderId}
          </td>
          <td align="right" style="padding: 10px 8px; color: #0B3B24; font-weight: 700; white-space: nowrap; border: 1px solid #E5E7EB;">
            $${itemTotal}
          </td>
        </tr>
      `;
    })
    .join('');

  const contentHtml = `
    <!-- Admin Header Banner -->
    <div style="background-color: #EAF5EE; border-left: 4px solid #0B3B24; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0B3B24; letter-spacing: 0.08em;">
              New Order Received &bull; Storefront Alert
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 4px;">
              Order #${safeOrderId} &mdash; $${options.totalAmount.toFixed(2)} USD
            </div>
            <div style="font-size: 12.5px; color: #4B5563; margin-top: 2px;">
              Customer: <strong>${safeCustomerName}</strong> (${safeCustomerPhone}) &bull; Paid via ${safePaymentMethod} (${safePaymentStatus})
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 11-Column Tabular Matrix with Horizontal Scroll Wrapper -->
    <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 24px; border: 1px solid #E5E7EB; border-radius: 10px; background-color: #FFFFFF;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; min-width: 860px; border-collapse: collapse; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 12px;">
        <thead>
          <tr style="background-color: #0B3B24; color: #FFFFFF;">
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Customer Name</th>
            <th align="center" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">QuantityOrdered</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; min-width: 130px;">Item Name</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; min-width: 120px;">Item Desc</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Delivery Method</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Order Date</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #072919; color: #8FE7B8; border-bottom: 2px solid #041B10; white-space: nowrap;">CF.Delivery Date</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Expected Shipment Date</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #072919; color: #8FE7B8; border-bottom: 2px solid #041B10; white-space: nowrap;">CF.Contact</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #072919; color: #8FE7B8; border-bottom: 2px solid #041B10; white-space: nowrap;">CF.Order Number</th>
            <th align="right" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Item Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Order Financial & Delivery Metadata -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="top" style="width: 55%; padding-right: 14px;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.05em; margin-bottom: 6px;">
            Destination &amp; Fulfillment Address
          </div>
          <div style="font-size: 13px; line-height: 1.6; color: #1F2937; background-color: #FAF9F6; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 14px;">
            <strong>${safeCustomerName}</strong><br/>
            ${safeAddress}<br/>
            Phone: <strong>${safeCustomerPhone}</strong><br/>
            Email: ${safeCustomerEmail}
          </div>
        </td>
        <td valign="top" style="width: 45%; padding-left: 14px;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.05em; margin-bottom: 6px;">
            Financial Summary
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; background-color: #FAF9F6; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 14px;">
            ${options.subtotal !== undefined ? `
            <tr>
              <td style="padding: 3px 0; color: #6B7280;">Subtotal:</td>
              <td align="right" style="padding: 3px 0; font-weight: 600; color: #111827;">$${options.subtotal.toFixed(2)}</td>
            </tr>` : ''}
            ${options.shippingFee !== undefined ? `
            <tr>
              <td style="padding: 3px 0; color: #6B7280;">Shipping (${safeDeliveryMethod}):</td>
              <td align="right" style="padding: 3px 0; font-weight: 600; color: #111827;">$${options.shippingFee.toFixed(2)}</td>
            </tr>` : ''}
            ${options.tax !== undefined && options.tax > 0 ? `
            <tr>
              <td style="padding: 3px 0; color: #6B7280;">Sales Tax:</td>
              <td align="right" style="padding: 3px 0; font-weight: 600; color: #111827;">$${options.tax.toFixed(2)}</td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #E5E7EB;">
              <td style="padding: 6px 0 0; font-weight: 700; color: #0B3B24;">Total (USD):</td>
              <td align="right" style="padding: 6px 0 0; font-size: 15px; font-weight: 800; color: #0B3B24;">$${options.totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Admin CTA Button -->
    <div style="text-align: center; margin: 24px 0 10px;">
      <a href="https://indian-flowers.com/admin/dashboard" target="_blank" style="display: inline-block; background-color: #0B3B24; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; letter-spacing: 0.02em;">
        Manage Order in Admin Dashboard &rarr;
      </a>
    </div>
  `;

  const text = `[NEW ORDER] #${options.orderId} - ${options.customerName} ($${options.totalAmount.toFixed(2)})\n\nCustomer: ${options.customerName}\nPhone: ${options.customerPhone || 'N/A'}\nEmail: ${options.customerEmail || 'N/A'}\nRequested Delivery: ${options.deliveryDate || 'N/A'}\nExpected Shipment: ${expectedShipmentDate}\nTotal Paid: $${options.totalAmount.toFixed(2)} USD\n\nShipping Address:\n${options.shippingAddress || 'N/A'}\n\nManage in Admin: https://indian-flowers.com/admin/dashboard`;

  const subject = `[NEW ORDER #${safeOrderId}] ${safeCustomerName} - $${options.totalAmount.toFixed(2)} (Delivery: ${safeDeliveryDate})`;

  const layout = renderEmailLayout({
    preheader: `New order #${options.orderId} received from ${options.customerName} ($${options.totalAmount.toFixed(2)} USD). Delivery: ${options.deliveryDate || 'Fresh Delivery'}`,
    headerBadge: `Store Alert &bull; #${options.orderId}`,
    headerTitle: subject,
    maxWidth: 920,
    contentHtml,
    contentText: text,
  });

  return {
    subject,
    html: layout.html,
    text: layout.text,
  };
}

export interface AdminCustomOrderAlertOptions {
  inquiryId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  productTitle?: string;
  variantName?: string;
  quantity?: number;
  occasion?: string;
  eventDate?: string;
  deliveryDate?: string;
  cityState?: string;
  address?: string;
  requirements?: string;
  budget?: string;
  createdAt?: string | Date;
}

/**
 * 7. Admin Custom Order Inquiry Alert Template with 11-Column Tabular Matrix
 */
export function renderAdminCustomOrderAlertEmail(options: AdminCustomOrderAlertOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const safeCustomerName = escapeHtml(options.customerName || 'Customer');
  const safeInquiryId = escapeHtml(options.inquiryId);
  const safeCustomerPhone = escapeHtml(options.customerPhone || 'N/A');
  const safeCustomerEmail = escapeHtml(options.customerEmail || '');
  const safeItemName = escapeHtml(options.productTitle || options.occasion || 'Custom Floral / Garland Request');
  const safeItemDesc = escapeHtml(
    `${options.variantName ? options.variantName + ' | ' : ''}${options.requirements || 'Bespoke handcrafting specifications'}`
  );
  const safeDeliveryMethod = escapeHtml(
    options.cityState ? `Cold-Chain: ${options.cityState}` : 'Cold-Chain Overnight / Cargo'
  );
  const targetDateStr = options.deliveryDate || options.eventDate || '';
  const safeDeliveryDate = escapeHtml(targetDateStr || 'TBD with Customer');
  const expectedShipmentDate = calculateExpectedShipmentDate(targetDateStr, safeDeliveryMethod);
  const safeShipmentDate = escapeHtml(expectedShipmentDate);
  const safeQuantity = options.quantity || 1;
  const safeBudget = escapeHtml(options.budget || 'Custom Quote');

  let safeOrderDate: string;
  if (options.createdAt instanceof Date) {
    safeOrderDate = options.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } else if (typeof options.createdAt === 'string' && options.createdAt.trim()) {
    const parsed = new Date(options.createdAt);
    safeOrderDate = !isNaN(parsed.getTime())
      ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : options.createdAt;
  } else {
    safeOrderDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const tableRowHtml = `
    <tr style="background-color: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 10px 8px; color: #111827; font-weight: 600; white-space: nowrap; border: 1px solid #E5E7EB;">
        ${safeCustomerName}
      </td>
      <td align="center" style="padding: 10px 8px; color: #111827; font-weight: 700; border: 1px solid #E5E7EB;">
        ${safeQuantity}
      </td>
      <td style="padding: 10px 8px; color: #111827; font-weight: 600; min-width: 130px; border: 1px solid #E5E7EB;">
        ${safeItemName}
      </td>
      <td style="padding: 10px 8px; color: #4B5563; font-size: 11.5px; min-width: 130px; border: 1px solid #E5E7EB;">
        ${safeItemDesc}
      </td>
      <td style="padding: 10px 8px; color: #374151; white-space: nowrap; border: 1px solid #E5E7EB;">
        ${safeDeliveryMethod}
      </td>
      <td style="padding: 10px 8px; color: #374151; white-space: nowrap; border: 1px solid #E5E7EB;">
        ${safeOrderDate}
      </td>
      <td style="padding: 10px 8px; background-color: #F0FDF4; color: #0B3B24; font-weight: 700; border: 1px solid #BBF7D0; white-space: nowrap;">
        ${safeDeliveryDate}
      </td>
      <td style="padding: 10px 8px; background-color: #FEF3C7; color: #92400E; font-weight: 700; border: 1px solid #FDE68A; white-space: nowrap;">
        ${safeShipmentDate}
      </td>
      <td style="padding: 10px 8px; background-color: #F0FDF4; border: 1px solid #BBF7D0; white-space: nowrap;">
        <strong style="color: #0B3B24;">${safeCustomerPhone}</strong><br/>
        <span style="font-size: 11px; color: #4B5563;">${safeCustomerEmail}</span>
      </td>
      <td style="padding: 10px 8px; background-color: #F0FDF4; color: #0B3B24; font-weight: 700; border: 1px solid #BBF7D0; white-space: nowrap;">
        #${safeInquiryId}
      </td>
      <td align="right" style="padding: 10px 8px; color: #0B3B24; font-weight: 700; white-space: nowrap; border: 1px solid #E5E7EB;">
        ${safeBudget}
      </td>
    </tr>
  `;

  const contentHtml = `
    <!-- Custom Inquiry Header Banner -->
    <div style="background-color: #EAF5EE; border-left: 4px solid #0B3B24; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0B3B24; letter-spacing: 0.08em;">
              New Custom Floral Inquiry &bull; Action Required
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 4px;">
              Inquiry #${safeInquiryId} &mdash; ${safeCustomerName}
            </div>
            <div style="font-size: 12.5px; color: #4B5563; margin-top: 2px;">
              Occasion: <strong>${escapeHtml(options.occasion || 'Special Celebration')}</strong> &bull; Event Date: <strong>${safeDeliveryDate}</strong>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- 11-Column Tabular Matrix with Horizontal Scroll Wrapper -->
    <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 24px; border: 1px solid #E5E7EB; border-radius: 10px; background-color: #FFFFFF;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; min-width: 860px; border-collapse: collapse; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 12px;">
        <thead>
          <tr style="background-color: #0B3B24; color: #FFFFFF;">
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Customer Name</th>
            <th align="center" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">QuantityOrdered</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; min-width: 130px;">Item Name</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; min-width: 120px;">Item Desc</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Delivery Method</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Order Date</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #072919; color: #8FE7B8; border-bottom: 2px solid #041B10; white-space: nowrap;">CF.Delivery Date</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Expected Shipment Date</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #072919; color: #8FE7B8; border-bottom: 2px solid #041B10; white-space: nowrap;">CF.Contact</th>
            <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #072919; color: #8FE7B8; border-bottom: 2px solid #041B10; white-space: nowrap;">CF.Order Number</th>
            <th align="right" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #072919; white-space: nowrap;">Item Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowHtml}
        </tbody>
      </table>
    </div>

    <!-- Requirements Detail Box -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.05em; margin-bottom: 6px;">
        Detailed Floral Requirements
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #1F2937; background-color: #FAF9F6; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 14px;">
        ${escapeHtml(options.requirements || 'No additional specifications provided.').replace(/\n/g, '<br/>')}
      </div>
    </div>

    <!-- Admin CTA Button -->
    <div style="text-align: center; margin: 24px 0 10px;">
      <a href="https://indian-flowers.com/admin/dashboard" target="_blank" style="display: inline-block; background-color: #0B3B24; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; letter-spacing: 0.02em;">
        Review &amp; Quote Inquiry in Admin Dashboard &rarr;
      </a>
    </div>
  `;

  const text = `[NEW CUSTOM INQUIRY] #${options.inquiryId} - ${options.customerName}\n\nCustomer: ${options.customerName}\nPhone: ${options.customerPhone}\nEmail: ${options.customerEmail}\nOccasion: ${options.occasion || 'N/A'}\nEvent Date: ${targetDateStr || 'N/A'}\nExpected Shipment: ${expectedShipmentDate}\nDestination: ${options.cityState || options.address || 'N/A'}\nBudget: ${options.budget || 'Custom Quote'}\n\nRequirements:\n${options.requirements || 'N/A'}\n\nManage in Admin: https://indian-flowers.com/admin/dashboard`;

  const subject = `[NEW CUSTOM INQUIRY #${safeInquiryId}] ${safeCustomerName} - ${escapeHtml(options.occasion || 'Floral Request')} (Date: ${safeDeliveryDate})`;

  const layout = renderEmailLayout({
    preheader: `New custom floral inquiry #${options.inquiryId} from ${options.customerName} for ${options.occasion || 'celebration'}. Event date: ${targetDateStr || 'TBD'}`,
    headerBadge: `Custom Inquiry &bull; #${options.inquiryId}`,
    headerTitle: subject,
    maxWidth: 920,
    contentHtml,
    contentText: text,
  });

  return {
    subject,
    html: layout.html,
    text: layout.text,
  };
}
