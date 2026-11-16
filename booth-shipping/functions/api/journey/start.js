import { json, badRequest } from '../../_lib.js';
import { newCode, cleanStudent, cleanData, cleanPercent, ensureJourneys, deleteOldJourneys, readJson } from '../../_journey.js';

// "Start my journey": saves the student's name and school and hands back a
// new code.
export async function onRequestPost(context) {
  const { request, env } = context;
  const { body, error } = await readJson(request);
  if (error) return error;
  const student = cleanStudent(body);
  if (student.error) return badRequest(student.error);
  const data = cleanData(body.data || {});
  if (data === null) return badRequest('Progress is too large to save.', 413);

  await ensureJourneys(env.DB);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const result = await env.DB
      .prepare(
        `INSERT OR IGNORE INTO journeys (code, first_name, last_initial, last_name, school, data, percent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .bind(code, student.firstName, student.lastInitial, student.lastName, student.school, data, cleanPercent(body.percent))
      .run();
    if (result.meta.changes) {
      if (Math.random() < 0.02) context.waitUntil(deleteOldJourneys(env.DB));
      return json({ ok: true, code, ...student });
    }
  }
  return badRequest('Could not create a code. Try again.', 503);
}
