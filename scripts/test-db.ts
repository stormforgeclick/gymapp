/// <reference types="node" />
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Runs the SQL tests in supabase/tests against the local Supabase database
 * (`npx supabase start`, then `npx supabase db reset` for a clean one).
 *
 *   npm run test:db                  every test
 *   npm run test:db -- split_privacy only the tests whose name contains this
 *
 * Each test is `_helpers.sql` + the test file, sent to psql in one session. A
 * test builds its own data and ends with `raise exception 'ROLLBACK_TEST: ...'`
 * so nothing is saved: that error means every check passed, any other error is
 * a failure (see _helpers.sql).
 */

const TESTS_DIR = join(__dirname, "..", "supabase", "tests");
const DB_CONTAINER = "supabase_db_gymapp";
const PASS_MARKER = "ROLLBACK_TEST";

const filters = process.argv.slice(2);

const files = readdirSync(TESTS_DIR)
  .filter((file) => file.endsWith(".sql") && !file.startsWith("_"))
  .filter((file) => filters.length === 0 || filters.some((f) => file.includes(f)))
  .sort();

if (files.length === 0) {
  console.error(`No tests match ${filters.join(", ")}`);
  process.exit(1);
}

const helpers = readFileSync(join(TESTS_DIR, "_helpers.sql"), "utf8");

const run = (sql: string) =>
  spawnSync(
    "docker",
    ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
    { input: sql, encoding: "utf8" }
  );

let failed = 0;

for (const file of files) {
  const result = run(`${helpers}\n${readFileSync(join(TESTS_DIR, file), "utf8")}`);
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const passed = output.includes(`ERROR:  ${PASS_MARKER}`);

  console.log(`${passed ? "PASS" : "FAIL"}  ${file}`);
  if (!passed) {
    failed++;
    console.log(output.trim().replace(/^/gm, "      "));
  }
}

console.log(`\n${files.length - failed}/${files.length} passed`);
process.exit(failed === 0 ? 0 : 1);
