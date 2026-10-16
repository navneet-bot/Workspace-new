export function validateEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.JJ_FROM_EMAIL;
  const gmailClientId = process.env.GOOGLE_CLIENT_ID;
  const gmailClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  let isValid = true;

  if (!apiKey) {
    console.warn("⚠️ [Email Config Warning] RESEND_API_KEY is missing. Gmail OAuth will be used if connected.");
  } else if (!apiKey.startsWith("re_")) {
    console.warn("⚠️ [Email Config Warning] RESEND_API_KEY does not start with 're_'. It may be invalid.");
  }

  if (!fromEmail) {
    console.warn("⚠️ [Email Config Warning] EMAIL_FROM is missing or empty. Gmail sender will be used if connected.");
  } else if (!fromEmail.includes("@")) {
    console.error(`❌ [Email Config Error] EMAIL_FROM ('${fromEmail}') is not a valid email address.`);
    isValid = false;
  }

  if (gmailClientId && gmailClientSecret) {
    console.log("✅ [Email Config] Google OAuth credentials configured.");
  } else {
    console.warn("⚠️ [Email Config Warning] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing.");
  }

  return {
    isConfigured: isValid,
    apiKey,
    fromEmail: fromEmail || "",
  };
}

export function validateGmailConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const isValid = !!(clientId && clientSecret && redirectUri);

  if (!isValid) {
    console.warn("⚠️ [Gmail Config] Google OAuth credentials incomplete. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.");
  }

  return {
    isConfigured: isValid,
    clientId: clientId || "",
    clientSecret: clientSecret || "",
    redirectUri: redirectUri || "",
  };
}
