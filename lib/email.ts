import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}
const FROM = () => process.env.EMAIL_FROM ?? 'Orbit <noreply@orbitbyoaklin.com>';
const BASE_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendManagerDashboardInvite(
  email: string,
  name: string,
): Promise<void> {
  const resend = getResend();
  const dashboardUrl = `${BASE_URL()}/`;
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: 'Your Orbit dashboard is ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2E1C;">
        <div style="background: #1A4D23; padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">ORBIT</h1>
          <p style="color: #a5c8a8; margin: 4px 0 0; font-size: 13px;">by Oaklin</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1A4D23; margin-top: 0;">Welcome to Orbit, ${name}</h2>
          <p>Your team diagnostic has been set up. Once your team's survey is complete, you'll be able to access your results dashboard.</p>
          <p>Use the credentials emailed separately to log in and complete your manager survey.</p>
          <a href="${dashboardUrl}"
             style="display: inline-block; background: #1A4D23; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 16px 0;">
            Access Orbit &rarr;
          </a>
          <p style="color: #666; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
            This invitation was sent by Oaklin. If you weren't expecting this email, please contact your Oaklin team.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendMemberInvite(
  email: string,
  name: string,
  surveyUrl: string,
): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: 'You\'ve been invited to complete the Orbit team survey',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2E1C;">
        <div style="background: #1A4D23; padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">ORBIT</h1>
          <p style="color: #a5c8a8; margin: 4px 0 0; font-size: 13px;">by Oaklin</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1A4D23; margin-top: 0;">Hi ${name},</h2>
          <p>Your organisation is using Orbit to assess team performance. We'd like to hear your perspective.</p>
          <p>The survey takes approximately 10&ndash;15 minutes. Your responses are anonymised and will only be shown as aggregated data.</p>
          <a href="${surveyUrl}"
             style="display: inline-block; background: #1A4D23; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 16px 0;">
            Begin survey &rarr;
          </a>
          <p style="color: #666; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
            Your personal details are stored separately from your responses. Only aggregate data is shared with your team's leadership.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendPasswordEmail(
  email: string,
  name: string,
  temporaryPassword: string,
): Promise<void> {
  const resend = getResend();
  const loginUrl = `${BASE_URL()}/`;
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: 'Your Orbit login credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2E1C;">
        <div style="background: #1A4D23; padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">ORBIT</h1>
          <p style="color: #a5c8a8; margin: 4px 0 0; font-size: 13px;">by Oaklin</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1A4D23; margin-top: 0;">Your login credentials, ${name}</h2>
          <p>Here are your temporary login details for Orbit:</p>
          <div style="background: #F7F7F7; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Temporary password:</strong> <code style="background: #e8f5e9; padding: 2px 6px; border-radius: 3px;">${temporaryPassword}</code></p>
          </div>
          <p>Please log in and change your password when prompted.</p>
          <a href="${loginUrl}"
             style="display: inline-block; background: #1A4D23; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 16px 0;">
            Log in to Orbit &rarr;
          </a>
          <p style="color: #666; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
            Keep these credentials secure. If you didn't request this, contact your Oaklin team immediately.
          </p>
        </div>
      </div>
    `,
  });
}
