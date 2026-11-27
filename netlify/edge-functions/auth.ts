const encoder = new TextEncoder();
const SESSION_COOKIE = 'anuario_session';
const SESSION_SECONDS = 60 * 60 * 8;

function response(body: string, status = 200, headers: HeadersInit = {}) {
  const h = new Headers(headers);
  h.set('content-type', 'text/html; charset=utf-8');
  h.set('cache-control', 'private, no-store, max-age=0');
  h.set('x-content-type-options', 'nosniff');
  h.set('x-frame-options', 'DENY');
  h.set('referrer-policy', 'no-referrer');
  h.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(body, { status, headers: h });
}

function loginPage(error = '') {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Acceso · Anuario Turístico</title><style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:linear-gradient(130deg,#10263d 0 54%,#16455a 54% 100%);color:#10263d;font:500 15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;display:grid;place-items:center;padding:22px}.card{width:min(100%,410px);background:#f4f4f1;border-top:5px solid #f2b544;padding:32px;box-shadow:0 20px 55px #07192955;border-radius:2px}.kicker{font-size:10px;font-weight:800;letter-spacing:.18em;color:#51677c}h1{font-size:27px;line-height:1.1;letter-spacing:-.04em;margin:12px 0 7px}p{font-size:13px;color:#52677e;margin:0 0 22px}label{display:block;font-size:11px;font-weight:800;margin:14px 0 5px}input{width:100%;padding:11px;border:1px solid #aebbc6;border-radius:2px;background:white;font:inherit}input:focus{outline:3px solid #f2b54466;border-color:#a27008}button{margin-top:20px;width:100%;border:0;background:#10263d;color:#fff;padding:12px;font:800 12px system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}button:hover{background:#1b4e63}.error{color:#9b3026;background:#f8e7e4;border-left:3px solid #d55748;padding:9px 10px;font-size:12px;margin:0 0 12px}.foot{font-size:10px;color:#687a89;margin-top:18px}</style></head><body><main class="card"><span class="kicker">CATAMARCA · 2026</span><h1>Anuario Estadístico<br>de Turismo</h1><p>Ingresá tus credenciales para consultar el panel institucional.</p>${error ? `<div class="error" role="alert">${error}</div>` : ''}<form method="post" action="/login"><label for="username">Usuario</label><input id="username" name="username" autocomplete="username" required autofocus><label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Ingresar al anuario</button></form><div class="foot">Dirección de Calidad Turística · Secretaría de Gestión Turística</div></main></body></html>`;
}

function constantTimeEqual(a: string, b: string) {
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < length; i++) mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return mismatch === 0;
}

function base64url(bytes: ArrayBuffer) {
  const values = new Uint8Array(bytes);
  let binary = '';
  for (const value of values) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sign(message: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

function getCookie(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return '';
  try { return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)); }
  catch { return ''; }
}

async function sessionIsValid(request: Request, username: string, secret: string) {
  const token = getCookie(request);
  const [expiryText, suppliedSignature, extra] = token.split('.');
  if (!expiryText || !suppliedSignature || extra !== undefined || !/^\d+$/.test(expiryText)) return false;
  const expiry = Number(expiryText);
  const now = Math.floor(Date.now() / 1000);
  if (expiry <= now || expiry > now + SESSION_SECONDS + 60) return false;
  const expected = await sign(`${username}:${expiryText}`, secret);
  return constantTimeEqual(suppliedSignature, expected);
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  const username = Netlify.env.get('ADMIN_USER');
  const password = Netlify.env.get('ADMIN_PASSWORD');
  const secret = Netlify.env.get('AUTH_SECRET');
  if (!username || !password || !secret) return response('Acceso no disponible. Configure las variables privadas del sitio.', 503);

  if (url.pathname === '/login' && request.method === 'GET') {
    if (await sessionIsValid(request, username, secret)) return new Response(null, { status: 303, headers: { location: '/' } });
    return response(loginPage());
  }

  if (url.pathname === '/login' && request.method === 'POST') {
    let form: FormData;
    try { form = await request.formData(); } catch { return response(loginPage('No se pudo procesar el formulario.'), 400); }
    const submittedUser = String(form.get('username') || '');
    const submittedPassword = String(form.get('password') || '');
    const userOkay = constantTimeEqual(submittedUser, username);
    const passwordOkay = constantTimeEqual(submittedPassword, password);
    if (!userOkay || !passwordOkay) return response(loginPage('Usuario o contraseña incorrectos.'), 401);
    const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const signature = await sign(`${username}:${expires}`, secret);
    const headers = new Headers({ location: '/' });
    headers.append('set-cookie', `${SESSION_COOKIE}=${expires}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`);
    headers.set('cache-control', 'private, no-store, max-age=0');
    return new Response(null, { status: 303, headers });
  }

  if (url.pathname === '/logout') {
    const headers = new Headers({ location: '/login' });
    headers.append('set-cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
    headers.set('cache-control', 'private, no-store, max-age=0');
    return new Response(null, { status: 303, headers });
  }

  if (!await sessionIsValid(request, username, secret)) return new Response(null, { status: 303, headers: { location: '/login', 'cache-control': 'private, no-store' } });

  const origin = await context.next();
  const headers = new Headers(origin.headers);
  headers.set('cache-control', 'private, no-store, max-age=0');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
  return new Response(origin.body, { status: origin.status, statusText: origin.statusText, headers });
};

export const config = { path: '/*' };
