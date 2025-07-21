const { GoogleAuth } = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

const auth = new GoogleAuth({
  keyFile: './wcbsm-fica-registrations-0a885ff6c3c2.json',
  scopes: SCOPES
});

let cachedClient;
let cachedToken;

async function getAccessToken() {
  if (!cachedClient) {
    cachedClient = await auth.getClient();
  }

  const tokenResponse = await cachedClient.getAccessToken();
  cachedToken = tokenResponse.token;

  return cachedToken;
}

module.exports = {
	getAccessToken
};
