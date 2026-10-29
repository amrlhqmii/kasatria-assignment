import { useEffect, useState } from "react";
import Papa from "papaparse";
import { parsePeopleCsv } from "../lib/dataParser";
import { fetchSheetData } from "../lib/googleSheets";
import type { Person } from "../types/person";

interface PeopleDataState {
  people: Person[];
  loading: boolean;
  error: string | null;
}

export function usePeopleData(accessToken: string | null, refreshKey: number): PeopleDataState {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();

    async function loadPeople() {
      try {
        setLoading(true);
        setError(null);
        setPeople([]);
        const rows = await fetchSheetData(accessToken, controller.signal);
        if (rows.length === 0) throw new Error("The People tab is empty. Import the supplied CSV, including its header row.");
        const parsed = parsePeopleCsv(Papa.unparse(rows));

        if (!controller.signal.aborted) {
          setPeople(parsed);
          setError(null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "An unexpected error occurred"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPeople();

    return () => controller.abort();
  }, [accessToken, refreshKey]);

  return accessToken ? { people, loading, error } : { people: [], loading: false, error: null };
}
