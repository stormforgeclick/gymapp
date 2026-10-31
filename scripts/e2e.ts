/// <reference types="node" />
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { ensureE2eUser } from "./e2e-user";

/**
 * End-to-end checks on an Android emulator or device with a release build of
 * the app installed (`npx expo run:android --variant release`).
 *
 *   npm run e2e              everything
 *   npm run e2e -- smoke     only the named checks (smoke, routine-crud, reorder)
 *
 * Maestro drives the screens. It has no press-and-hold-then-drag gesture, so
 * the drag is done with `adb shell input draganddrop` and the order is read
 * back from the accessibility tree (`uiautomator dump`).
 */

const IS_WINDOWS = process.platform === "win32";

const maestroBin = (() => {
  if (process.env.MAESTRO_BIN) return process.env.MAESTRO_BIN;
  const installed = join(homedir(), "maestro", "bin", IS_WINDOWS ? "maestro.bat" : "maestro");
  return existsSync(installed) ? installed : "maestro";
})();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Env = Record<string, string>;

const maestro = (flow: string, env: Env) => {
  const args = ["test", ...Object.entries(env).flatMap(([k, v]) => ["-e", `${k}=${v}`]), flow];
  console.log(`\n> maestro ${flow}`);
  // `.bat` files need a shell on Windows; the values passed contain no quotes.
  const result = spawnSync(`"${maestroBin}"`, args.map((a) => `"${a}"`), {
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) throw new Error(`Maestro flow failed: ${flow}`);
};

const adb = (...args: string[]) =>
  execFileSync("adb", args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });

type Card = { name: string; position: number; x: number; y: number };

const ATTRIBUTE = (node: string, name: string) =>
  new RegExp(`${name}="([^"]*)"`).exec(node)?.[1] ?? "";

const decode = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/**
 * The routine's exercise cards, top to bottom. Each card's title is an
 * accessibility element ("Name, exercise 2 of 3" / "Name, ejercicio 2 de 3").
 */
const readCards = (): Card[] => {
  // Maestro's driver holds the device's accessibility connection while it runs.
  try {
    adb("shell", "am", "force-stop", "dev.mobile.maestro");
  } catch {}

  adb("shell", "uiautomator", "dump", "/sdcard/e2e-ui.xml");
  const xml = adb("exec-out", "cat", "/sdcard/e2e-ui.xml");

  return xml
    .split("<node ")
    .filter((node) => ATTRIBUTE(node, "resource-id") === "routine-exercise-title")
    .map((node) => {
      const label = decode(ATTRIBUTE(node, "content-desc"));
      const match = /^(.*), (?:ejercicio|exercise) (\d+) (?:de|of) (\d+)$/.exec(label);
      const bounds = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(ATTRIBUTE(node, "bounds"));
      if (!match || !bounds) throw new Error(`Unexpected card label: "${label}"`);
      const [left, top, right, bottom] = bounds.slice(1).map(Number);
      return {
        name: match[1],
        position: Number(match[2]),
        x: Math.round((left + right) / 2),
        y: Math.round((top + bottom) / 2),
      };
    })
    .sort((a, b) => a.y - b.y);
};

const names = (cards: Card[]) => cards.map((card) => card.name);

const expectOrder = (step: string, cards: Card[], expected: string[]) => {
  const actual = names(cards);
  if (actual.join("|") !== expected.join("|")) {
    throw new Error(
      `${step}: expected order [${expected.join(", ")}] but got [${actual.join(", ")}]`
    );
  }
  cards.forEach((card, index) => {
    if (card.position !== index + 1) {
      throw new Error(`${step}: "${card.name}" says it is #${card.position}, shown at #${index + 1}`);
    }
  });
  console.log(`  ok  ${step}: [${actual.join(", ")}]`);
};

/** Press-and-hold the first card, then drag it past the last one and drop it. */
const dragFirstToLast = (cards: Card[]) => {
  const [first, second] = cards;
  const pitch = second.y - first.y; // one card plus the gap between cards
  const toY = first.y + pitch * (cards.length - 1) + Math.round(pitch * 0.3);
  adb(
    "shell",
    "input",
    "draganddrop",
    String(first.x),
    String(first.y),
    String(first.x),
    String(toY),
    "900"
  );
};

const checks: Record<string, (env: Env) => Promise<void>> = {
  smoke: async (env) => maestro(".maestro/flows/smoke.yaml", env),

  "routine-crud": async (env) => maestro(".maestro/flows/routine-crud.yaml", env),

  reorder: async (env) => {
    maestro(".maestro/flows/reorder-setup.yaml", env);
    try {
      const initial = readCards();
      if (initial.length !== 3) {
        throw new Error(`Expected 3 exercise cards but found ${initial.length}`);
      }
      const [a, b, c] = names(initial);
      expectOrder("before dragging", initial, [a, b, c]);

      dragFirstToLast(readCards());
      await sleep(1500);
      expectOrder("after the first drag", readCards(), [b, c, a]);

      // Dragging again right away is what used to leave the list stuck.
      dragFirstToLast(readCards());
      await sleep(1500);
      expectOrder("after dragging again", readCards(), [c, a, b]);

      // The new order is saved in the background; give it a moment.
      await sleep(2500);
      maestro(".maestro/flows/reorder-reopen.yaml", env);
      expectOrder("after reopening the app", readCards(), [c, a, b]);
    } finally {
      maestro(".maestro/flows/reorder-cleanup.yaml", env);
    }
  },
};

async function main() {
  const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const selected = requested.length > 0 ? requested : Object.keys(checks);
  const unknown = selected.filter((name) => !checks[name]);
  if (unknown.length > 0) {
    throw new Error(`Unknown check: ${unknown.join(", ")}. Available: ${Object.keys(checks).join(", ")}`);
  }

  const devices = adb("devices")
    .split("\n")
    .slice(1)
    .filter((line) => /\tdevice$/.test(line.trim()));
  if (devices.length === 0) throw new Error("No Android device or emulator is connected (adb devices).");

  const credentials = await ensureE2eUser();
  const results: { name: string; error?: string }[] = [];

  for (const name of selected) {
    const env: Env = {
      E2E_EMAIL: credentials.email,
      E2E_PASSWORD: credentials.password,
      ROUTINE_NAME: `E2E ${Date.now()}`,
    };
    console.log(`\n=== ${name} ===`);
    try {
      await checks[name](env);
      results.push({ name });
    } catch (error) {
      results.push({ name, error: error instanceof Error ? error.message : String(error) });
    }
  }

  console.log("\n--- Summary ---");
  for (const { name, error } of results) {
    console.log(`${error ? "FAIL" : "PASS"}  ${name}${error ? `\n      ${error}` : ""}`);
  }
  if (results.some((result) => result.error)) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
