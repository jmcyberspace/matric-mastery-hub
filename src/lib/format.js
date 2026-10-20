export const SUBJECTS = [
  { id: 'maths', name: 'Mathematics', short: 'Maths', mark: '∑', tone: 'coral', description: 'Find the pattern. Build the proof.' },
  { id: 'physics', name: 'Physical Sciences', short: 'Physics', mark: '↗', tone: 'blue', description: 'Make sense of the world around you.' },
  { id: 'life-sci', name: 'Life Sciences', short: 'Life Sciences', mark: '◉', tone: 'green', description: 'Explore how living systems work.' },
  { id: 'english', name: 'English FAL', short: 'English', mark: 'Aa', tone: 'purple', description: 'Read closely. Express yourself clearly.' },
];
export const subjectById = id => SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
export const percentage = (score, total) => total > 0 ? Math.round(score / total * 100) : null;
export const date = value => value ? new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Johannesburg' }).format(new Date(value)) : '—';
export const dateTime = value => value ? new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' }).format(new Date(value)) : '—';
export const duration = seconds => Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0') + ':' + (Math.floor(Math.max(0, seconds)) % 60).toString().padStart(2, '0');
export const average = values => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
export function subjectResults(results, id) {
  const matching = results.filter(r => r.subject === id);
  return { count: matching.length, average: average(matching.map(r => percentage(r.score, r.total))) };
}
export function download(filename, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export const csv = rows => '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
