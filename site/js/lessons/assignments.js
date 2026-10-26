// Stable lesson keys keep semester-specific repositories out of lesson content.
export function parseAssignments(csv) {
  csv = csv.replace(/^\uFEFF/, '');
  const rows = [], row = [];
  let value = '', quoted = false, closed = false;
  const field = () => { row.push(value); value = ''; closed = false; };
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (quoted) {
      if (char === '"' && csv[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else value += char;
    } else if (char === '"' && !value && !closed) quoted = true;
    else if (char === ',') field();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[i + 1] === '\n') i++;
      field(); if (row.some(cell => cell.trim())) rows.push([...row]); row.length = 0;
    } else if (closed && char.trim()) throw new Error('Unexpected text after a quoted CSV field');
    else if (!closed) value += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  field(); if (row.some(cell => cell.trim())) rows.push([...row]);
  const headers = rows.shift()?.map(cell => cell.replace(/^\uFEFF/, '').trim());
  if (headers?.join(',') !== 'lesson,assessment_url') throw new Error('Expected CSV columns: lesson,assessment_url');
  const assignments = new Map();
  for (const cells of rows) {
    if (cells.length !== 2) throw new Error('Each assignment row needs two columns');
    const [lesson, rawUrl] = cells.map(cell => cell.trim());
    if (!/^cse\d{4}\/[a-z0-9-]+$/.test(lesson)) throw new Error(`Invalid lesson key: ${lesson}`);
    if (assignments.has(lesson)) throw new Error(`Duplicate assignment: ${lesson}`);
    let url = null;
    if (rawUrl) {
      const target = new URL(rawUrl);
      if (target.protocol !== 'https:' || target.hostname !== 'github.com' || target.port || target.username || target.password || target.search || target.hash || !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(target.pathname)) {
        throw new Error(`Use a GitHub repository URL for ${lesson}`);
      }
      url = target.href;
    }
    assignments.set(lesson, url);
  }
  return assignments;
}

export async function loadAssignment(lesson, { signal } = {}) {
  const response = await fetch(new URL('../../assignments.csv', import.meta.url), { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Assignment links could not be loaded');
  const assignments = parseAssignments(await response.text());
  return { url: assignments.get(lesson) || null, status: assignments.has(lesson) ? 'configured' : 'missing' };
}

export function assignmentMarkup({ url, status }) {
  const safeUrl = url ? parseAssignments(`lesson,assessment_url\ncse0000/example,${url}\n`).get('cse0000/example') : null;
  return `<h3>Next: your assignment</h3>${safeUrl
    ? `<a class="assignment-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Start your assignment →</a><p>Fork the assignment repository on GitHub, then submit the link to your fork.</p>`
    : `<p>${status === 'unavailable' ? 'Assignment link unavailable. Ask your teacher for the repository.' : 'Assignment link coming soon. Your teacher will share the repository.'}</p>`}`;
}
