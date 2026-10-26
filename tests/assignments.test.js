import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { modules } from '../site/js/catalog.js';
import { parseAssignments, assignmentMarkup, loadAssignment } from '../site/js/lessons/assignments.js';

test('every registered lesson ends with a point-form wrap-up and has one assignment row', () => {
  const assignments = parseAssignments(readFileSync(new URL('../site/assignments.csv', import.meta.url), 'utf8'));
  const keys = [];
  for (const module of modules) for (const lesson of module.lessons) {
    const key = `${module.id}/${lesson.id}`;
    keys.push(key);
    const slides = JSON.parse(readFileSync(new URL(`../site/lessons/${key}/slides.json`, import.meta.url), 'utf8'));
    const last = slides.at(-1);
    assert.equal(last.kind, 'wrapup', `${key} needs a wrap-up`);
    assert.ok(last.bullets.length >= 3 && last.bullets.length <= 5, `${key} needs a concise summary`);
    assert.ok(last.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
    assert.ok(assignments.has(key), `${key} needs an assignment CSV row`);
    assert.equal(slides.filter(slide => slide.kind === 'wrapup').length, 1);
  }
  assert.deepEqual([...assignments.keys()].sort(), keys.sort());
});

test('CSV accepts spreadsheet quoting, blank links, CRLF and a byte-order mark', () => {
  const result = parseAssignments('\uFEFF"lesson","assessment_url"\r\n"cse1110/intro","https://github.com/Teacher/assignment-2026-fall"\r\ncse1110/next,\r\n');
  assert.equal(result.get('cse1110/intro'), 'https://github.com/Teacher/assignment-2026-fall');
  assert.equal(result.get('cse1110/next'), null);
  assert.doesNotMatch(assignmentMarkup({status:'configured'}), /<a\b/);
  assert.match(assignmentMarkup({status:'configured'}), /Assignment link coming soon/);
  assert.match(assignmentMarkup({status:'unavailable'}), /Ask your teacher/);
});

test('assignment links target the configured repository without creating or submitting a fork', () => {
  const url = 'https://github.com/Teacher/assignment-2027-winter';
  const html = assignmentMarkup({url,status:'configured'});
  assert.ok(html.includes(`href="${url}"`));
  assert.match(html, /Start your assignment/);
  assert.match(html, /submit the link to your fork/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /href="[^"]*\/fork/);
});

test('CSV rejects duplicate rows, invalid headers and unsafe or non-repository links', () => {
  assert.throws(() => parseAssignments('lesson,assessment_url\ncse1110/intro,\ncse1110/intro,\n'), /Duplicate/);
  assert.throws(() => parseAssignments('lesson,url\n'), /columns/);
  assert.throws(() => parseAssignments('lesson,assessment_url\n"cse1110/intro,'), /Unclosed/);
  for (const url of ['javascript:alert(1)', 'https://example.com/Teacher/repo', 'http://github.com/Teacher/repo', 'https://github.com/Teacher/repo/fork', 'https://user:pass@github.com/Teacher/repo', 'https://github.com/Teacher/repo?x=1']) {
    assert.throws(() => assignmentMarkup({url,status:'configured'}), undefined, url);
  }
});

test('semester mappings are fetched fresh and fetch failures remain recoverable', async t => {
  let call;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    call = {url, options};
    return {ok: true, text: async () => 'lesson,assessment_url\ncse1110/intro,https://github.com/Teacher/new-semester\n'};
  });
  const signal = new AbortController().signal;
  assert.deepEqual(await loadAssignment('cse1110/intro', {signal}), {url:'https://github.com/Teacher/new-semester',status:'configured'});
  assert.ok(call.url.pathname.endsWith('/site/assignments.csv'));
  assert.equal(call.options.cache, 'no-store');
  assert.equal(call.options.signal, signal);
  globalThis.fetch.mock.mockImplementation(async () => ({ok:false}));
  await assert.rejects(loadAssignment('cse1110/intro'), /could not be loaded/);
});
