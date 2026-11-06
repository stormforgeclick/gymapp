import { spawnSync } from "node:child_process";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

const isIgnored = (path: string) =>
  spawnSync("git", ["check-ignore", "--quiet", path], { cwd: ROOT }).status === 0;

/**
 * The repository is public. These hold real data or credentials, so git must
 * never offer them to be committed: a backup of the production database has the
 * accounts of real people, the full catalog seed is not ours to publish, and the
 * .env files have keys. The paths don't need to exist for git to answer.
 */
describe("files that must never be committed", () => {
  it.each([
    "backups/2026-11-06-datos.sql",
    "supabase/seed.full.sql",
    ".env",
    ".env.local",
    ".env.production",
    ".maestro/.env.e2e",
  ])("%s is ignored by git", (path) => {
    expect(isIgnored(path)).toBe(true);
  });

  it("still lets the example environment file in", () => {
    expect(isIgnored(".env.example")).toBe(false);
  });
});
