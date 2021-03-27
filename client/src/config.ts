// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'frk260ea9g'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dev-r-c1y0ps.us.auth0.com',            // Auth0 domain
  clientId: 'ysut68ElQGs5NSy94yJl4NOt93zz6y3I',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
