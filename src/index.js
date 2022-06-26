import { Router } from 'itty-router';
import { customAlphabet } from 'nanoid';

const SLUG_LEAGTH = 6;

const router = new Router();
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', SLUG_LEAGTH);

router.post('/shorten', async req => {
  let slug = nanoid();
  let length = SLUG_LEAGTH;
  const reqBody = await req.json();
  if(undefined === reqBody?.url){
    return new Response('Missing url', { status: 400 });
  }
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
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://exit.moe',
    },
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

addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})
