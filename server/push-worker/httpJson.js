export function readJson(request) {
  return new Promise((resolve, reject) => {
    const state = { body: '' };
    request.on('data', chunk => {
      state.body += chunk;
      if (state.body.length > 10_000) reject(new Error('Gövde çok büyük'));
    });
    request.on('end', () => {
      try {
        resolve(state.body ? JSON.parse(state.body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

export function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}
