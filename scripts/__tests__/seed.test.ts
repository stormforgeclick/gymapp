import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * supabase/seed.sql is committed to a public repository, so it may only hold a
 * small slice of the exercise catalog: no user data, and none of the import
 * source (`exercises`) beyond the id and name its foreign key needs.
 */

const SEED_PATH = join(__dirname, "..", "..", "supabase", "seed.sql");

const CATALOG_TABLES = [
  "categories",
  "equipment",
  "muscle_groups",
  "targets",
  "exercise_names",
  "exercises",
  "exercise_secondary_muscles",
  "gymbro_exercises",
];

type Insert = { table: string; columns: string[]; rows: number };

/** Splits the file into statements, ignoring `;` and `--` inside strings and comments. */
function statements(sql: string): string[] {
  const result: string[] = [];
  let current = "";
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if (inString) {
      current += char;
      if (char === "'") {
        if (sql[i + 1] === "'") current += sql[++i];
        else inString = false;
      }
    } else if (char === "'") {
      inString = true;
      current += char;
    } else if (char === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
    } else if (char === ";") {
      if (current.trim()) result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

/** Number of `( ... )` tuples after VALUES, not counting parentheses inside strings. */
function countRows(values: string): number {
  let rows = 0;
  let depth = 0;
  let inString = false;

  for (let i = 0; i < values.length; i++) {
    const char = values[i];
    if (inString) {
      if (char === "'") {
        if (values[i + 1] === "'") i++;
        else inString = false;
      }
    } else if (char === "'") {
      inString = true;
    } else if (char === "(") {
      if (depth === 0) rows++;
      depth++;
    } else if (char === ")") {
      depth--;
    }
  }
  return rows;
}

const seed = readFileSync(SEED_PATH, "utf8");
const all = statements(seed);
const inserts: Insert[] = [];
const others: string[] = [];

for (const statement of all) {
  const match = /^INSERT INTO "public"\."(\w+)" \(([^)]*)\) VALUES\s*([\s\S]*)$/.exec(statement);
  if (match) {
    inserts.push({
      table: match[1],
      columns: match[2].split(",").map((column) => column.trim().replace(/"/g, "")),
      rows: countRows(match[3]),
    });
  } else {
    others.push(statement);
  }
}

const rowsOf = (table: string) =>
  inserts.filter((insert) => insert.table === table).reduce((sum, insert) => sum + insert.rows, 0);

describe("supabase/seed.sql", () => {
  it("stays small enough to live in the repository", () => {
    expect(statSync(SEED_PATH).size).toBeLessThan(1024 * 1024);
  });

  it("only sets session options besides the inserts", () => {
    expect(others.filter((statement) => !/^SET\s/i.test(statement))).toEqual([]);
  });

  it("inserts only into the catalog tables of public", () => {
    const tables = new Set(inserts.map((insert) => insert.table));

    expect([...tables].filter((table) => !CATALOG_TABLES.includes(table))).toEqual([]);
  });

  it("does not contain schemas that hold user data", () => {
    expect(seed).not.toMatch(/"auth"|"storage"|\bauth\.|\bstorage\./);
  });

  it("keeps only the id and name of the import source", () => {
    const columns = inserts
      .filter((insert) => insert.table === "exercises")
      .map((insert) => insert.columns.join(","));

    expect([...new Set(columns)]).toEqual(["id,name"]);
  });

  it("holds a small slice of the exercises", () => {
    const exercises = rowsOf("gymbro_exercises");

    expect(exercises).toBeGreaterThanOrEqual(10);
    expect(exercises).toBeLessThanOrEqual(100);
  });

  it("gives every exercise its name and its import source row", () => {
    const exercises = rowsOf("gymbro_exercises");

    expect(rowsOf("exercise_names")).toBe(exercises);
    expect(rowsOf("exercises")).toBe(exercises);
  });

  it("includes every row of the small lookup tables", () => {
    for (const table of ["categories", "equipment", "muscle_groups", "targets"]) {
      expect(rowsOf(table)).toBeGreaterThan(0);
    }
  });
});
