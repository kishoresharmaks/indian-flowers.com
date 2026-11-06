import { sendEmailViaMsg91, escapeHtml, Msg91EmailResult } from '@/lib/msg91';
import { renderPasswordResetEmail, renderEmailLayout, SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/emailTemplate';

interface SendPasswordResetEmailParams {
  toEmail: string;
  recipientName?: string;
  resetUrl: string;
  otpCode: string;
  accountType?: 'customer' | 'admin';
}

/**
 * Sends a password reset email with both a direct reset link and a 6-digit OTP code.
 * Dispatches through the configured email provider (MSG91, Brevo, or SMTP) using the official brand template.
 */
export async function sendPasswordResetEmail({
  toEmail,
  recipientName = 'Valued Customer',
  resetUrl,
  otpCode,
  accountType = 'customer',
}: SendPasswordResetEmailParams): Promise<Msg91EmailResult> {
  const rendered = renderPasswordResetEmail({
    recipientName,
    resetUrl,
    otpCode,
  });

  const subject =
    accountType === 'admin'
      ? 'Security Notice: Reset Your Admin Password — The Indian Flowers'
      : rendered.subject;

  return sendEmailViaMsg91({
    to: [{ name: recipientName, email: toEmail }],
    subject,
    htmlContent: rendered.html,
    textContent: rendered.text,
    type: 'PASSWORD_RESET',
  });
}

/**
 * Sends a confirmation email after a password has been successfully reset.
 */
export async function sendPasswordResetSuccessEmail({
  toEmail,
  recipientName = 'Valued Customer',
}: {
  toEmail: string;
  recipientName?: string;
}): Promise<Msg91EmailResult> {
  const safeName = escapeHtml(recipientName);
  const subject = 'Your Password Has Been Successfully Reset — The Indian Flowers';

  const contentHtml = `
    <h2 class="text-title" style="margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #0B3B24; letter-spacing: -0.02em;">
      Password Successfully Changed
    </h2>
    <p class="text-body" style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 16px;">
      Hello <strong>${safeName}</strong>,
    </p>
    <p class="text-body" style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px;">
      This email confirms that the password for your Indian Flowers account has been successfully updated. You can now securely sign in to your customer dashboard with your new credentials.
    </p>
    <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
      <p style="font-size: 12.5px; color: #065F46; margin: 0; font-weight: 600;">
        ✓ Account Security Status: Verified &amp; Protected
      </p>
    </div>
    <div style="font-size: 12px; line-height: 1.5; color: #6B7280;">
      If you did NOT perform this change, please contact our emergency security support immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color: #0B3B24; font-weight: 700;">${SUPPORT_EMAIL}</a> or call ${SUPPORT_PHONE}.
    </div>
  `;

  const text = `Hello ${recipientName},\n\nYour password for The Indian Flowers has been successfully reset. If you did not make this change, please contact customer support immediately at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE}.`;

  const layout = renderEmailLayout({
    preheader: 'Your Indian Flowers account password has been successfully reset.',
    headerBadge: 'Security Update',
    headerTitle: subject,
    contentHtml,
    contentText: text,
  });

  return sendEmailViaMsg91({
    to: [{ name: recipientName, email: toEmail }],
    subject,
    htmlContent: layout.html,
    textContent: layout.text,
    type: 'PASSWORD_RESET',
  });
}
