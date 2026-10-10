import http from 'node:http';
import { handleSendAuthEmail, handleActionPage, handleSendPasswordReset } from './authEmails.js';
import { handleBanDevice } from './banDevice.js';
import { handleDeleteAccount } from './deleteAccount.js';

export function startHttpServer(auth, db, { host, port }) {
  return http.createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ ok: true }));
    } else if (request.url === '/delete-account' && request.method === 'POST') {
      void handleDeleteAccount(auth, db, request, response);
    } else if (request.url?.startsWith('/auth/action') && request.method === 'GET') {
      void handleActionPage(request, response);
    } else if (request.url === '/send-auth-email' && request.method === 'POST') {
      void handleSendAuthEmail(auth, request, response);
    } else if (request.url === '/send-password-reset' && request.method === 'POST') {
      void handleSendPasswordReset(auth, request, response);
    } else if (request.url === '/admin/ban-device' && request.method === 'POST') {
      void handleBanDevice(auth, db, request, response);
    } else if (request.url === '/admin/unban-device' && request.method === 'POST') {
      void handleBanDevice(auth, db, request, response, { unban: true });
    } else {
      response.writeHead(404);
      response.end();
    }
  }).listen(port, host, () => console.log(`Health check http://${host}:${port}/health`));
}
