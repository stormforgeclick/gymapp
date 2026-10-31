import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, posix } from "node:path";

import { checkDocs, existsIn, githubSlug, type DocsInput } from "../docs-check";

const ROOT = join(__dirname, "..", "..");

/** Builds a checker input where the given files exist and everything else doesn't. */
const input = (files: Record<string, string>, overrides: Partial<DocsInput> = {}): DocsInput => ({
  files,
  exists: (path) => path in files || Object.keys(files).some((file) => file.startsWith(path)),
  scripts: ["test", "start", "test:db"],
  allowMissing: [],
  ...overrides,
});

const messages = (files: Record<string, string>, overrides: Partial<DocsInput> = {}) =>
  checkDocs(input(files, overrides)).map((problem) => `${problem.file}: ${problem.message}`);

describe("githubSlug", () => {
  it.each([
    ["Primer día", "primer-día"],
    ["¿Qué es Gymbro?", "qué-es-gymbro"],
    ["`npm test` y más", "npm-test-y-más"],
    ["Cambiar el esquema (TDD)", "cambiar-el-esquema-tdd"],
    ["  Con espacios  ", "con-espacios"],
  ])("turns %p into %p", (heading, slug) => {
    expect(githubSlug(heading)).toBe(slug);
  });
});

describe("checkDocs", () => {
  it("accepts documents whose links, scripts and paths exist", () => {
    const files = {
      "docs/README.md": "# Índice\n\n- [Empezar](empezar.md)\n- [Atajo](empezar.md#primer-día)\n",
      "docs/empezar.md": "# Empezar\n\n## Primer día\n\nCorre `npm test` y mira `src/lib/text.ts`.\n",
      "src/lib/text.ts": "",
    };

    expect(messages(files)).toEqual([]);
  });

  it("reports a link to a file that does not exist", () => {
    const files = { "docs/README.md": "# Índice\n\n[Falta](nada.md)\n" };

    expect(messages(files)).toEqual(["docs/README.md: link to missing file docs/nada.md"]);
  });

  it("resolves links relative to the file that contains them", () => {
    const files = {
      "docs/README.md": "# Índice\n\n[Contribuir](../CONTRIBUTING.md)\n",
      "CONTRIBUTING.md": "# Contribuir\n",
    };

    expect(messages(files)).toEqual([]);
  });

  it("reports an anchor that is not a heading of the target", () => {
    const files = {
      "docs/README.md": "# Índice\n\n[Roto](empezar.md#no-existe)\n",
      "docs/empezar.md": "# Empezar\n",
    };

    expect(messages(files)).toEqual(['docs/README.md: link to missing anchor "#no-existe" in docs/empezar.md']);
  });

  it("checks anchors that point inside the same file", () => {
    const files = { "docs/README.md": "# Índice\n\n[Arriba](#índice) y [roto](#otro)\n" };

    expect(messages(files)).toEqual(['docs/README.md: link to missing anchor "#otro" in docs/README.md']);
  });

  it("numbers repeated headings the way GitHub does", () => {
    const files = {
      "docs/README.md": "# Índice\n\n[Segundo](#paso-1) y [tercero](#paso-2)\n\n## Paso\n\n## Paso\n",
    };

    expect(messages(files)).toEqual(['docs/README.md: link to missing anchor "#paso-2" in docs/README.md']);
  });

  it("ignores external links", () => {
    const files = { "docs/README.md": "# Índice\n\n[Expo](https://docs.expo.dev) [Correo](mailto:a@b.co)\n" };

    expect(messages(files)).toEqual([]);
  });

  it("ignores links and headings written inside code blocks", () => {
    const files = {
      "docs/README.md": "# Índice\n\n```md\n# No es un título\n[roto](nada.md)\n```\n",
    };

    expect(messages(files)).toEqual([]);
  });

  it("reports an npm script that does not exist", () => {
    const files = { "docs/README.md": "# Índice\n\nCorre `npm run inventado` o:\n\n```\nnpm run test:db\nnpm test\nnpm run falso -- --flag\n```\n" };

    expect(messages(files)).toEqual([
      'docs/README.md: unknown npm script "inventado"',
      'docs/README.md: unknown npm script "falso"',
    ]);
  });

  it("does not treat other npm commands as scripts", () => {
    const files = { "docs/README.md": "# Índice\n\n```\nnpm ci\nnpm install --save-dev x\nnpm run-nothing\n```\n" };

    expect(messages(files)).toEqual([]);
  });

  it("reports a repository path in code that does not exist", () => {
    const files = { "docs/README.md": "# Índice\n\nMira `src/no/existe.ts` y `docs/`.\n" };

    expect(messages(files)).toEqual(["docs/README.md: path in code does not exist: src/no/existe.ts"]);
  });

  it("lets listed paths be missing and skips patterns", () => {
    const files = {
      "docs/README.md": "# Índice\n\n`supabase/seed.full.sql` y `supabase/migrations/*.sql` y `src/<algo>/x.ts`\n",
    };

    expect(messages(files, { allowMissing: ["supabase/seed.full.sql"] })).toEqual([]);
  });

  it("skips placeholders written with an ellipsis", () => {
    const files = { "docs/README.md": "# Índice\n\nRutas en `src/app/…` y `src/app/...` y `docs/…`.\n" };

    expect(messages(files)).toEqual([]);
  });

  it("does not look for paths inside fenced blocks", () => {
    const files = { "docs/README.md": "# Índice\n\n```\nsrc/no/existe.ts\n```\n" };

    expect(messages(files)).toEqual([]);
  });

  it("requires the docs index to link every other document", () => {
    const files = {
      "docs/README.md": "# Índice\n\n- [Empezar](empezar.md)\n",
      "docs/empezar.md": "# Empezar\n",
      "docs/pruebas.md": "# Pruebas\n",
    };

    expect(messages(files)).toEqual(["docs/README.md: index does not link docs/pruebas.md"]);
  });
});

describe("existsIn", () => {
  const exists = existsIn(["docs/README.md", "src/lib/text.ts"]);

  it("finds a tracked file", () => {
    expect(exists("src/lib/text.ts")).toBe(true);
  });

  it("finds a folder that holds a tracked file", () => {
    expect(exists("src/lib")).toBe(true);
    expect(exists("src")).toBe(true);
  });

  it("does not find what is not tracked", () => {
    expect(exists("supabase/.temp")).toBe(false);
    expect(exists("src/li")).toBe(false);
  });
});

describe("the repository documentation", () => {
  const REQUIRED = [
    "docs/README.md",
    "docs/empezar.md",
    "docs/arquitectura.md",
    "docs/base-de-datos.md",
    "docs/pruebas.md",
    "docs/problemas-conocidos.md",
    "CONTRIBUTING.md",
    ".env.example",
  ];

  // What a fresh checkout has: the files git tracks. Anything else (ignored folders,
  // generated files) exists on a developer's machine but not in the CI, so the docs
  // must not depend on it.
  const tracked = (() => {
    try {
      return execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
        .split("\n")
        .filter(Boolean);
    } catch {
      return null; // Not a git checkout (a downloaded archive): fall back to the disk.
    }
  })();
  const exists = tracked ? existsIn(tracked) : (path: string) => existsSync(join(ROOT, path));

  const markdownOnDisk = (dir: string): string[] =>
    readdirSync(join(ROOT, dir)).flatMap((name) => {
      const path = posix.join(dir, name);
      return statSync(join(ROOT, path)).isDirectory() ? markdownOnDisk(path) : name.endsWith(".md") ? [path] : [];
    });
  const isDoc = (path: string) =>
    path === "README.md" || path === "CONTRIBUTING.md" || (path.startsWith("docs/") && path.endsWith(".md"));
  const docPaths = tracked ? tracked.filter(isDoc) : ["README.md", "CONTRIBUTING.md", ...markdownOnDisk("docs")];

  it.each(REQUIRED)("has %s", (path) => {
    expect(exists(path)).toBe(true);
  });

  it("has no broken links, unknown scripts or missing paths", () => {
    const files = Object.fromEntries(docPaths.map((path) => [path, readFileSync(join(ROOT, path), "utf8")]));
    const scripts = Object.keys(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts);

    const problems = checkDocs({
      files,
      exists,
      scripts,
      // Named on purpose but ignored by git (see .gitignore): the full catalog seed a
      // developer keeps locally, and the folder the Supabase CLI creates when it links.
      allowMissing: ["supabase/seed.full.sql", "supabase/.temp/"],
    });

    expect(problems.map((problem) => `${problem.file}: ${problem.message}`)).toEqual([]);
  });
});
