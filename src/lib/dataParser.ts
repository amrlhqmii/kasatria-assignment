import Papa from "papaparse";
import type { Person } from "../types/person";

type CsvRow = Record<string, string | undefined>;

function parseNetWorth(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, "");
  const amount = Number(cleaned);

  if (!cleaned || !Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid Net Worth: ${value}`);
  }

  return amount;
}

export function parsePeopleCsv(csvText: string): Person[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(
      `CSV parsing failed: ${result.errors[0].message}`
    );
  }

  const requiredColumns = [
    "Name",
    "Photo",
    "Age",
    "Country",
    "Interest",
    "Net Worth",
  ];

  const headers = result.meta.fields ?? [];

  for (const column of requiredColumns) {
    if (!headers.includes(column)) {
      throw new Error(`Missing CSV column: ${column}`);
    }
  }

  return result.data.map((row, index) => {
    const ageText = (row.Age ?? "").trim();
    const age = Number(ageText);

    if (!ageText || !Number.isInteger(age) || age < 0) {
      throw new Error(`Invalid age at row ${index + 2}`);
    }

    return {
      id: `person-${index + 1}`,
      name: (row.Name ?? "").trim(),
      photo: (row.Photo ?? "").trim(),
      age,
      country: (row.Country ?? "").trim(),
      interest: (row.Interest ?? "").trim(),
      netWorth: parseNetWorth(row["Net Worth"] ?? ""),
    };
  });
}

export function getNetWorthColor(netWorth: number): string {
  if (netWorth > 200_000) return "#21865b";
  if (netWorth >= 100_000) return "#bb7624";
  return "#a83232";
}

export function formatNetWorth(netWorth: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(netWorth);
}
