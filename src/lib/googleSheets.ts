const SHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

export async function fetchSheetData(
  accessToken: string,
  signal?: AbortSignal,
): Promise<string[][]> {
  if (!SHEET_ID) throw new Error("The Google Sheet ID has not been configured.");
  // shortcut: this assignment has 200 profiles; expand the layouts before raising the range.
  const range = encodeURIComponent("People!A1:F201");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${SHEET_ID}/values/${range}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your Google session is no longer valid. Sign out and sign in again.");
    }
    if (response.status === 403) {
      throw new Error("Google denied access to the Sheet. Check that Google Sheets API is enabled, the Sheet is shared with your account or anyone with the link, and read-only Sheets permission was granted.");
    }
    throw new Error(
      `Google Sheets request failed: ${response.status}`
    );
  }

  const data = await response.json();
  const values: unknown = data.values ?? [];
  if (!Array.isArray(values) || !values.every((row: unknown) => Array.isArray(row) && row.every((cell: unknown) => typeof cell === "string"))) {
    throw new Error("Google Sheets returned an unexpected data format.");
  }
  return values;
}
