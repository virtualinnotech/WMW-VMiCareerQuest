import { badRequest } from './_lib.js';

// Student journeys: a student's progress saved under a short code, so they can
// continue on any computer. Only the student's first and last name, school
// and mission progress are stored (the last name tells apart two students with
// the same first name at one school), and journeys nobody has played for 60
// days are deleted.

// No 0/O, 1/I/L or U, so a code read off paper can't be misread.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const MAX_DATA_BYTES = 200 * 1024;

export function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}

// "k7pq-2mxd", "K7PQ 2MXD" and "K7PQ2MXD" are the same code.
export function cleanCode(value) {
  const code = String(value || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  return code.length === 8 && [...code].every((c) => ALPHABET.includes(c)) ? code : null;
}

const tidy = (value) => String(value || '').trim().replace(/\s+/g, ' ');

export function cleanStudent(body) {
  const firstName = tidy(body?.firstName);
  // A game still open from before the last name was asked sends only the
  // initial; it is kept with an empty last name.
  const lastName = tidy(body?.lastName);
  const lastInitial = (lastName || tidy(body?.lastInitial)).slice(0, 1).toUpperCase();
  const school = tidy(body?.school);
  if (!/^\p{L}[\p{L} .'-]{0,29}$/u.test(firstName)) return { error: 'Type your first name (letters only).' };
  if (lastName ? !/^\p{L}[\p{L} .'-]{0,39}$/u.test(lastName) : !/^\p{L}$/u.test(lastInitial)) return { error: 'Type your last name (letters only).' };
  if (school.length < 2 || school.length > 80) return { error: 'Type the name of your school.' };
  return { firstName, lastName, lastInitial, school };
}

// The progress a game sends: a JSON object, kept small.
export function cleanData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const text = JSON.stringify(data);
  return text.length <= MAX_DATA_BYTES ? text : null;
}

export function cleanPercent(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

// Tables made before the last name was asked get the column (empty for their
// students); newer tables already have it.
async function addLastName(db) {
  const has = async () => (await db.prepare('PRAGMA table_info(journeys)').all()).results.some((c) => c.name === 'last_name');
  if (await has()) return;
  try {
    await db.prepare("ALTER TABLE journeys ADD COLUMN last_name TEXT NOT NULL DEFAULT ''").run();
  } catch (e) {
    if (!(await has())) throw e; // unless another request added it first
  }
}

let ready = null;
// The table is created by the Worker itself the first time it is needed.
export function ensureJourneys(db) {
  ready ??= db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS journeys (
      code TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_initial TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      school TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      percent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS journeys_updated ON journeys (updated_at)'),
  ])
    .then(() => addLastName(db))
    .catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}

export function deleteOldJourneys(db) {
  return db.prepare("DELETE FROM journeys WHERE updated_at < datetime('now', '-60 days')").run();
}

export async function readJson(request) {
  if (Number(request.headers.get('content-length') || 0) > MAX_DATA_BYTES + 4096) return { error: badRequest('Too much data.', 413) };
  try {
    return { body: await request.json() };
  } catch {
    return { error: badRequest('Invalid JSON body.') };
  }
}
