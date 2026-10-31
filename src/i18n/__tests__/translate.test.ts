import { en } from "../en";
import { es } from "../es";
import { resolveLanguage, translate } from "../translate";

const dictionary = {
  common: { cancel: "Cancelar" },
  greeting: "Hola {name}",
  unknownParam: "Hola {name} {missing}",
  items: { one: "{count} ejercicio", other: "{count} ejercicios" },
} as never;

describe("translate", () => {
  it("returns a plain string as it is", () => {
    expect(translate(dictionary, "common.cancel")).toBe("Cancelar");
  });

  it("fills in the params", () => {
    expect(translate(dictionary, "greeting", { name: "Ana" })).toBe("Hola Ana");
  });

  it("fills in numeric params", () => {
    expect(translate(dictionary, "greeting", { name: 3 })).toBe("Hola 3");
  });

  it("leaves a placeholder that has no param as it is", () => {
    expect(translate(dictionary, "unknownParam", { name: "Ana" })).toBe(
      "Hola Ana {missing}"
    );
  });

  it("picks the singular form when count is 1", () => {
    expect(translate(dictionary, "items", { count: 1 })).toBe("1 ejercicio");
  });

  it.each([0, 2, 11])("picks the plural form when count is %i", (count) => {
    expect(translate(dictionary, "items", { count })).toBe(`${count} ejercicios`);
  });
});

describe("resolveLanguage", () => {
  it("uses the language the user picked", () => {
    expect(resolveLanguage("en", "es")).toBe("en");
    expect(resolveLanguage("es", "en")).toBe("es");
  });

  it("follows the phone in English when the user follows the system", () => {
    expect(resolveLanguage("system", "en")).toBe("en");
  });

  it.each(["es", "fr", "pt", null, undefined])(
    "falls back to Spanish for the system language %p",
    (device) => {
      expect(resolveLanguage("system", device)).toBe("es");
    }
  );
});

describe("dictionaries", () => {
  const placeholders = (text: string) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

  const flatten = (node: unknown, path = ""): Record<string, string> => {
    if (typeof node === "string") return { [path]: node };
    return Object.entries(node as Record<string, unknown>).reduce(
      (all, [key, value]) => ({
        ...all,
        ...flatten(value, path ? `${path}.${key}` : key),
      }),
      {}
    );
  };

  const spanish = flatten(es);
  const english = flatten(en);

  it("has the same entries in both languages", () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(spanish).sort());
  });

  it("uses the same placeholders in both languages", () => {
    const mismatched = Object.keys(spanish).filter(
      (key) =>
        JSON.stringify(placeholders(spanish[key])) !==
        JSON.stringify(placeholders(english[key]))
    );

    expect(mismatched).toEqual([]);
  });
});
