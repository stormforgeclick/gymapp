import { posix } from "node:path";

export type DocsInput = {
  /** Markdown files by repository-relative path (forward slashes), with their text. */
  files: Record<string, string>;
  /** Whether a repository-relative file or folder exists. */
  exists: (path: string) => boolean;
  /** Names of the scripts in package.json. */
  scripts: string[];
  /** Paths the documentation may name even though they are not in the repository. */
  allowMissing: string[];
};

export type Problem = { file: string; message: string };

const INDEX = "docs/README.md";
const PATH_ROOTS = /^(?:src|scripts|supabase|docs|\.github)\/[^\s*<>{}|…]*$/;
const ELLIPSIS = /\.\.\.|…/;
const NPM_SCRIPT = /\bnpm\s+(?:run(?:-script)?\s+([A-Za-z0-9:_-]+)|(test|start|stop|restart)\b)/g;
const LINK = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const CODE_SPAN = /`([^`\n]+)`/g;

/** The anchor GitHub gives a heading: lower case, no punctuation, spaces as hyphens. */
export function githubSlug(heading: string): string {
  return heading
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

/** The text with fenced code blocks blanked out, so links and headings inside them don't count. */
function withoutFences(markdown: string): string {
  let fenced = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced;
        return "";
      }
      return fenced ? "" : line;
    })
    .join("\n");
}

/** Anchors a document offers, numbering repeated headings the way GitHub does. */
function anchorsOf(markdown: string): Set<string> {
  const seen = new Map<string, number>();
  const anchors = new Set<string>();

  for (const line of withoutFences(markdown).split("\n")) {
    const match = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const slug = githubSlug(match[1]);
    const count = seen.get(slug) ?? 0;
    seen.set(slug, count + 1);
    anchors.add(count === 0 ? slug : `${slug}-${count}`);
  }
  return anchors;
}

type Link = { path: string; anchor: string | undefined };

/** Relative links of a document, resolved from the repository root. */
function linksOf(file: string, markdown: string): Link[] {
  const text = withoutFences(markdown).replace(CODE_SPAN, "");
  const links: Link[] = [];

  for (const match of text.matchAll(LINK)) {
    const target = match[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;

    const [rawPath, rawAnchor] = target.split("#");
    const decoded = decodeURI(rawPath);
    const path = decoded
      ? posix.normalize(decoded.startsWith("/") ? decoded.slice(1) : posix.join(posix.dirname(file), decoded))
      : file;
    links.push({ path: path.replace(/\/$/, ""), anchor: rawAnchor ? decodeURIComponent(rawAnchor).toLowerCase() : undefined });
  }
  return links;
}

/**
 * An `exists` for a list of tracked files: true for each file and for every folder
 * that holds one. It answers the way a fresh checkout would, unlike the disk of a
 * machine that also has ignored folders and generated files.
 */
export function existsIn(files: string[]): (path: string) => boolean {
  const known = new Set<string>();
  for (const file of files) {
    known.add(file);
    const parts = file.split("/");
    for (let i = 1; i < parts.length; i++) known.add(parts.slice(0, i).join("/"));
  }
  return (path) => known.has(path);
}

/** Finds links, npm scripts and repository paths in the documentation that no longer exist. */
export function checkDocs({ files, exists, scripts, allowMissing }: DocsInput): Problem[] {
  const problems: Problem[] = [];

  for (const [file, markdown] of Object.entries(files)) {
    const report = (message: string) => problems.push({ file, message });

    for (const { path, anchor } of linksOf(file, markdown)) {
      if (!exists(path)) {
        report(`link to missing file ${path}`);
      } else if (anchor && path in files && !anchorsOf(files[path]).has(anchor)) {
        report(`link to missing anchor "#${anchor}" in ${path}`);
      }
    }

    const reported = new Set<string>();
    for (const match of markdown.matchAll(NPM_SCRIPT)) {
      const script = match[1] ?? match[2];
      if (!scripts.includes(script) && !reported.has(script)) {
        reported.add(script);
        report(`unknown npm script "${script}"`);
      }
    }

    for (const match of withoutFences(markdown).matchAll(CODE_SPAN)) {
      const code = match[1];
      if (!PATH_ROOTS.test(code) || ELLIPSIS.test(code) || allowMissing.includes(code)) continue;
      if (!exists(code.replace(/\/$/, ""))) report(`path in code does not exist: ${code}`);
    }
  }

  const index = files[INDEX];
  if (index !== undefined) {
    const linked = new Set(linksOf(INDEX, index).map((link) => link.path));
    for (const file of Object.keys(files)) {
      if (file.startsWith("docs/") && file !== INDEX && !linked.has(file)) {
        problems.push({ file: INDEX, message: `index does not link ${file}` });
      }
    }
  }

  return problems;
}
