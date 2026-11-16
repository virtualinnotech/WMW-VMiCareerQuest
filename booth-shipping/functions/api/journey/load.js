import { json, badRequest } from '../../_lib.js';
import { cleanCode, ensureJourneys } from '../../_journey.js';

// "Continue my journey": the saved progress for a code.
export async function onRequestGet(context) {
  const { request, env } = context;
  const code = cleanCode(new URL(request.url).searchParams.get('code'));
  if (!code) return badRequest('That code has 8 letters and numbers, like K7PQ-2MXD.');
  await ensureJourneys(env.DB);
  const row = await env.DB
    .prepare('SELECT code, first_name, last_initial, last_name, school, data, updated_at FROM journeys WHERE code = ?')
    .bind(code)
    .first();
  if (!row) return badRequest("We couldn't find that code. Check the letters and numbers and try again.", 404);
  let data = {};
  try {
    data = JSON.parse(row.data);
  } catch {
    // An unreadable save starts empty rather than blocking the student.
  }
  const response = json({ ok: true, code: row.code, firstName: row.first_name, lastInitial: row.last_initial, lastName: row.last_name, school: row.school, data, updatedAt: row.updated_at });
  response.headers.set('cache-control', 'no-store');
  return response;
}
