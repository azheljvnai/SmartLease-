import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

/** Sends via EmailJS; no-ops when env vars are missing. */
export async function sendEmail(params: EmailParams): Promise<void> {
  if (!isEmailConfigured()) return;

  await emailjs.send(
    SERVICE_ID!,
    TEMPLATE_ID!,
    {
      to_email: params.to_email,
      to_name: params.to_name,
      subject: params.subject,
      message: params.message,
    },
    { publicKey: PUBLIC_KEY! },
  );
}
