const SPREADSHEET_ID_REGEX = /\/d\/([a-zA-Z0-9-_]+)/;

export function parseSpreadsheetId(input) {
  if (!input) return '';

  const trimmed = input.trim();

  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(SPREADSHEET_ID_REGEX);
    if (match?.[1]) return match[1];

    const spreadsheetId = url.searchParams.get('spreadsheetId');
    if (spreadsheetId) return spreadsheetId;
  } catch {
    return '';
  }

  return '';
}
