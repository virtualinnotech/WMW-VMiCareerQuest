import { json, badRequest } from '../../_lib.js';
import { cleanCode, ensureJourneys, deleteOldJourneys, readJson } from '../../_journey.js';

// The admin page's Students tab. With no search it lists every student (newest
// played first, up to LIMIT) and the page filters them as you type. With ?q=
// every word typed has to match the first name, last name, last initial, school
// or code, so "maria central" finds Maria at Grand Rapids Central -- used when
// there are more students than one list holds.
const LIMIT = 10000;

export async function onRequestGet(context) {
  const { request, env } = context;
  if (request.headers.get('x-admin-key') !== env.ADMIN_KEY) return badRequest('Unauthorized.', 401);
  await ensureJourneys(env.DB);
  await deleteOldJourneys(env.DB);
  const words = (new URL(request.url).searchParams.get('q') || '').trim().split(/\s+/).filter(Boolean).slice(0, 4);
  const where = words.map(() => '(first_name LIKE ? OR last_name LIKE ? OR school LIKE ? OR code LIKE ? OR last_initial = ?)').join(' AND ');
  const args = words.flatMap((w) => {
    const like = '%' + w.replace(/[%_]/g, '') + '%';
    return [like, like, like, like.replace(/-/g, '').toUpperCase(), w.toUpperCase()];
  });
  const { results } = await env.DB
    .prepare(`SELECT code, first_name, last_initial, last_name, school, percent, created_at, updated_at FROM journeys ${where ? 'WHERE ' + where : ''} ORDER BY updated_at DESC LIMIT ${LIMIT}`)
    .bind(...args)
    .all();
  const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM journeys').first();
  return json({ ok: true, total: total?.n ?? 0, limit: LIMIT, journeys: results });
}

// Deletes students and their progress for good: { codes: ['MZ4RZFDP', ...] }.
// A student still playing sees "This code is no longer on the server".
export async function onRequestPost(context) {
  const { request, env } = context;
  if (request.headers.get('x-admin-key') !== env.ADMIN_KEY) return badRequest('Unauthorized.', 401);
  const { body, error } = await readJson(request);
  if (error) return error;
  const codes = [...new Set((Array.isArray(body?.codes) ? body.codes : []).map(cleanCode).filter(Boolean))];
  if (!codes.length) return badRequest('Choose at least one student.');
  if (codes.length > 1000) return badRequest('Delete at most 1,000 students at a time.');
  await ensureJourneys(env.DB);
  // D1 takes at most 100 values per statement.
  const statements = [];
  for (let i = 0; i < codes.length; i += 90) {
    const part = codes.slice(i, i + 90);
    statements.push(env.DB.prepare(`DELETE FROM journeys WHERE code IN (${part.map(() => '?').join(',')})`).bind(...part));
  }
  const results = await env.DB.batch(statements);
  return json({ ok: true, deleted: results.reduce((n, r) => n + (r.meta?.changes || 0), 0) });
}
