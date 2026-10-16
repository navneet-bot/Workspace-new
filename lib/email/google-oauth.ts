import { google } from "googleapis";
import crypto from "crypto";

const STATE_SECRET = process.env.OAUTH_STATE_SECRET || "dev-insecure-change-me";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
];

function getClientId() {
  return process.env.GOOGLE_CLIENT_ID || "";
}

function getClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET || "";
}

function getRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback";
}

function _sign(payload: string): string {
  return crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("hex");
}

function createState(userEmail: string): string {
  const payload = JSON.stringify({ u: userEmail, ts: Math.floor(Date.now() / 1000) });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = _sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

function verifyState(state: string, maxAgeSeconds = 600): string {
  const parts = state.split(".");
  if (parts.length !== 2) throw new Error("Malformed state");
  const [payloadB64, sig] = parts;
  const expectedSig = _sign(payloadB64);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    throw new Error("State signature mismatch");
  }
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  if (Math.floor(Date.now() / 1000) - payload.ts > maxAgeSeconds) {
    throw new Error("State expired");
  }
  return payload.u;
}

function getOAuth2Client(redirectUri?: string) {
  const uri = redirectUri || getRedirectUri();
  return new google.auth.OAuth2(getClientId(), getClientSecret(), uri);
}

export function getAuthUrl(userEmail: string, redirectUri?: string) {
  const oauth2 = getOAuth2Client(redirectUri);
  const state = createState(userEmail);
  const authorizationUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    include_granted_scopes: true,
    prompt: "consent",
    state,
  });
  return { authorizationUrl, state };
}

export async function fetchTokens(code: string, redirectUri?: string) {
  const oauth2 = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}



export async function getUserEmail(accessToken: string): Promise<string> {
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ access_token: accessToken });
  const oauth2api = google.oauth2({ version: "v2", auth: oauth2 });
  const { data } = await oauth2api.userinfo.get();
  return data.email || "";
}

export { verifyState, createState };
