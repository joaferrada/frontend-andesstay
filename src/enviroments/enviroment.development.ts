// Desarrollo local (ng serve): las llamadas a /api las redirige proxy.conf.json al BFF en localhost:8080.
// El build de producción usa enviroment.ts (API Gateway); el reemplazo está en angular.json.
export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: 'b32eb050-21b6-433a-809b-00b4f21cb5e2',
      authority: 'https://login.microsoftonline.com/524de923-14d5-4e21-bbbf-525ca2e1ced7/',
      redirectUri: 'http://localhost:4200'
    }
  },
  apiConfig: {
    scopes: ['api://b32eb050-21b6-433a-809b-00b4f21cb5e2/access_as_user'],
    uri: ''
  }
};
