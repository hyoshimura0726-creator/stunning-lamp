import { google } from "googleapis";

export default function handler(req: any, res: any) {
  const { redirectUri } = req.query;
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set" });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri as string
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent select_account',
    state: redirectUri as string,
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly'
    ]
  });

  res.json({ url });
}
