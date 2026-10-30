import { sendEmailViaMsg91, escapeHtml, Msg91EmailResult } from '@/lib/msg91';

interface SendPasswordResetEmailParams {
  toEmail: string;
  recipientName?: string;
  resetUrl: string;
  otpCode: string;
  accountType?: 'customer' | 'admin';
}

/**
 * Sends a password reset email with both a direct reset link and a 6-digit OTP code.
 * Dispatches through the configured email provider (MSG91 or SMTP) in EmailConfig.
 */
export async function sendPasswordResetEmail({
  toEmail,
  recipientName = 'Valued Customer',
  resetUrl,
  otpCode,
  accountType = 'customer',
}: SendPasswordResetEmailParams): Promise<Msg91EmailResult> {
  const safeName = escapeHtml(recipientName);
  const safeEmail = escapeHtml(toEmail);
  const safeOtp = escapeHtml(otpCode);
  const safeUrl = escapeHtml(resetUrl);

  const subject =
    accountType === 'admin'
      ? 'Security Notice: Reset Your Admin Password — The Indian Flowers'
      : 'Reset Your Password — The Indian Flowers';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6F0; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #E5E7EB;">
          <!-- Top Botanical Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0B3B24 0%, #134633 100%); padding: 35px 30px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      THE INDIAN FLOWERS
                    </div>
                    <div style="font-size: 11px; color: #8FE7B8; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; font-weight: 600;">
                      Fresh Indian Garlands &bull; USA Nationwide Delivery
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Body -->
          <tr>
            <td style="padding: 35px 30px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #0B3B24; margin: 0 0 16px 0; letter-spacing: -0.5px;">
                Password Reset Request
              </h1>

              <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 20px 0;">
                Hello <strong>${safeName}</strong>,
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 24px 0;">
                We received a request to reset the password for your account associated with <strong>${safeEmail}</strong>. You can reset your password immediately using the 6-digit verification code below or by clicking the direct button.
              </p>

              <!-- OTP Code Highlight Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                <tr>
                  <td align="center" style="background-color: #F4F8F4; border: 2px dashed #0B3B24; border-radius: 16px; padding: 22px 20px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1C563F; letter-spacing: 1.5px; margin-bottom: 6px;">
                      Your 6-Digit Verification Code
                    </div>
                    <div style="font-size: 34px; font-weight: 800; color: #0B3B24; letter-spacing: 8px; font-family: monospace;">
                      ${safeOtp}
                    </div>
                    <div style="font-size: 11px; color: #6B7280; margin-top: 6px;">
                      Valid for 30 minutes
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Direct Reset Link Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${safeUrl}" target="_blank" style="background: linear-gradient(135deg, #0B3B24 0%, #1C563F 100%); color: #ffffff; padding: 14px 34px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(11,59,36,0.25);">
                      Reset Your Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Advice -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 14px 16px; border-radius: 8px; margin: 25px 0;">
                <p style="font-size: 12px; line-height: 1.5; color: #92400E; margin: 0;">
                  <strong>Security Advisory:</strong> If you did not request this password reset, please ignore this email or contact support. Your password will remain unchanged and your account stays completely secure.
                </p>
              </div>

              <p style="font-size: 12px; color: #9CA3AF; line-height: 1.5; margin: 25px 0 0 0; border-top: 1px solid #F3F4F6; pt: 15px;">
                Direct URL: <a href="${safeUrl}" style="color: #0B3B24; word-break: break-all;">${safeUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 22px 30px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 11px; color: #6B7280; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #374151;">
                The Indian Flowers LLC &bull; US Nationwide Fresh Floral Delivery
              </p>
              <p style="margin: 0;">
                Questions? Contact our care team at <a href="mailto:indianflowersorder@gmail.com" style="color: #0B3B24; text-decoration: underline;">indianflowersorder@gmail.com</a> or call (909) 379-3678.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmailViaMsg91({
    to: [{ name: recipientName, email: toEmail }],
    subject,
    htmlContent,
    textContent: `Hello ${recipientName},\n\nWe received a request to reset your password. Use the verification code below or click the link to set a new password:\n\nVerification Code: ${otpCode}\n\nReset Link: ${resetUrl}\n\nThis code and link will expire in 30 minutes. If you did not request this, please ignore this email.\n\nWarm regards,\nThe Indian Flowers Team`,
    type: 'PASSWORD_RESET',
    metadata: {
      accountType,
      otpCode,
    },
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

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6F0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; color: #111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color: #0B3B24; padding: 30px; text-align: center; color: #ffffff;">
              <div style="font-size: 22px; font-weight: 800;">THE INDIAN FLOWERS</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0B3B24; margin: 0 0 15px 0;">
                Password Successfully Reset
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #374151;">
                Hello <strong>${safeName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #374151;">
                This email confirms that the password for your Indian Flowers account has been successfully changed.
              </p>
              <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
                <p style="font-size: 12px; color: #065F46; margin: 0; font-weight: 600;">
                  ✓ You can now sign in with your new password.
                </p>
              </div>
              <p style="font-size: 13px; line-height: 1.6; color: #4B5563;">
                If you did NOT perform this change, please contact our emergency security support immediately at <a href="mailto:indianflowersorder@gmail.com" style="color: #0B3B24; font-weight: bold;">indianflowersorder@gmail.com</a> or call (909) 379-3678.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmailViaMsg91({
    to: [{ name: recipientName, email: toEmail }],
    subject,
    htmlContent,
    textContent: `Hello ${recipientName},\n\nYour password for The Indian Flowers has been successfully reset. If you did not make this change, please contact customer support immediately at (909) 379-3678.`,
    type: 'PASSWORD_RESET',
  });
}
