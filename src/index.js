import { Router } from 'itty-router';
import { customAlphabet } from 'nanoid';
import Toucan from 'toucan-js';

const SLUG_LEAGTH = 6;

const router = new Router();
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', SLUG_LEAGTH);

function urlValidate (longUrl) {
  const isUrlRegEx = /^(http|https):(\/)+[^ "]+\.[^ "]+$/i;
  const isExitmoeRegEx = /^(http|https):(\/)+(.*\.)?(exit\.moe)(:[0-9]{1,5})?(\/.*)?$/i;
  urlInvalid = !isUrlRegEx.test(longUrl);
  urlExitmoe = isExitmoeRegEx.test(longUrl);
  if(urlInvalid || urlExitmoe) return false;
  else return true;
};

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

router.post('/shorten', async (req, sentry) => {
  let slug = nanoid();
  let length = SLUG_LEAGTH;
  const reqBody = await req.json();
  sentry.setRequestBody(reqBody);
  if (reqBody?.url === undefined)
    return new Response(JSON.stringify({ message: 'Missing url' }), { headers, status: 400 });
  if (urlValidate(reqBody.url) === false)
    return new Response(JSON.stringify({ message: 'Invalid url' }), { headers, status: 400 });
  if (reqBody.url.length >= 2048)
    return new Response(JSON.stringify({ message: 'Url too long' }), { headers, status: 400 });

  while(await SURL.get(slug)){
    length++;
    slug = nanoid(length);
  }

  await SURL.put(slug, reqBody.url, { expirationTtl: 60 * 60 * 24 * 30  }); // 30 days
  const shortenedUrl = `${new URL(req.url).origin}/${slug}`;
  const resBody = {
    slug,
    message: 'URL shortened successfully',
    shortenedUrl,
  };
  return new Response(JSON.stringify(resBody), {
    headers,
    status: 200,
  });
});

router.get('/:slug', async req => {
  const originalUrl = await SURL.get(req.params.slug);
  if(!originalUrl){
    return new Response('URL not found', { status: 404 });
  }
  return new Response(null, {
    headers: { 'Location': originalUrl },
    status: 301,
  });
});

router.options('*', async req => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      },
      status: 200,
  });
});

router.all('*', async req => {
  return new Response('404 Not found', { status: 404 });
});

addEventListener('fetch', event => {
  const sentry = new Toucan({
    dsn: SENTRY_DSN,
    context: event,
    allowedHeaders: /(.*)/,
    allowedSearchParams: /(.*)/,
  });
  sentry.setUser({ ip_address: event.request.headers.get('CF-Connecting-IP') });

  event.respondWith(
    router.handle(event.request, sentry)
      .catch(error => {
        sentry.captureException(error);
        return new Response('Internal server error', { status: 500 });
      })
  );
})
