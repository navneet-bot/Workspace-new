import { google } from "googleapis";
import prisma from "@/lib/db";

export async function getGmailCredentials(userEmail: string) {
  const tokenRow = await prisma.gmailToken.findUnique({ where: { userEmail } });
  if (!tokenRow) {
    throw new Error(`No Gmail account connected for ${userEmail}`);
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oauth2.setCredentials({
    refresh_token: tokenRow.refreshToken,
    access_token: tokenRow.accessToken || undefined,
    expiry_date: tokenRow.tokenExpiry ? tokenRow.tokenExpiry.getTime() : undefined,
  });

  if (!oauth2.credentials.access_token) {
    const { credentials } = await oauth2.refreshAccessToken();
    oauth2.setCredentials(credentials);
    await prisma.gmailToken.update({
      where: { userEmail },
      data: {
        accessToken: credentials.access_token,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      },
    });
  }

  return oauth2;
}

function buildMessage(to: string, subject: string, html: string): string {
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html).toString("base64"),
  ];
  const raw = headers.join("\r\n");
  return Buffer.from(raw).toString("base64url");
}

export async function sendViaGmail(to: string, subject: string, html: string) {
  const firstToken = await prisma.gmailToken.findFirst({ orderBy: { connectedAt: "desc" } });
  if (!firstToken) {
    throw new Error("No Gmail account connected. Please connect a Google account in Settings.");
  }

  const auth = await getGmailCredentials(firstToken.userEmail);
  const gmail = google.gmail({ version: "v1", auth });

  const raw = buildMessage(to, subject, html);
  const { data } = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return { success: true, id: data.id };
}
