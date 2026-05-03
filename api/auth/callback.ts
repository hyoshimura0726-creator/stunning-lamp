import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  const { code, state } = req.query; 
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      state as string
    );
    
    const { tokens } = await oauth2Client.getToken(code as string);
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    res.send(`<html><body><p>Authentication failed: ${error.message}</p></body></html>`);
  }
}
