export const number = (value: number) => new Intl.NumberFormat('en-ET').format(value);
export const money = (value: number) => `${number(value)} ETB`;
export function date(value: string | null, time = false): string {
  if (!value) return 'Not synchronized';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unavailable';
  return (
    new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
      timeZone: 'Africa/Addis_Ababa',
    }).format(parsed) + (time ? ' EAT' : '')
  );
}
export const lag = (minutes: number | null) =>
  minutes === null
    ? 'Unknown'
    : minutes < 60
      ? `${minutes} min`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
        : `${Math.floor(minutes / 1440)} days`;
export function csvCell(value: unknown) {
  const raw = String(value ?? '');
  const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function csv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadCsv(content: string, name: string) {
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
