import esCommon from "./locales/es/common.json";
import enCommon from "./locales/en/common.json";

export type Locale = "es" | "en";

export const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: "es", label: "Español", flag: "MX" },
  { id: "en", label: "English", flag: "US" },
];

export const DEFAULT_LOCALE: Locale = "es";

export interface TranslationBundle {
  common: typeof esCommon;
}

const bundles: Record<Locale, TranslationBundle> = {
  es: { common: esCommon },
  en: { common: enCommon },
};

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

type DotNestedKeys<T> = T extends object
  ? {
      [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}`;
    }[Exclude<keyof T, symbol>]
  : "";

export type TranslationKey = DotNestedKeys<TranslationBundle>;

let currentLocale: Locale = DEFAULT_LOCALE;

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: unknown = bundles[currentLocale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  if (!params) return value;

  return Object.entries(params).reduce<string>(
    (result, [paramKey, paramValue]) =>
      result.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue)),
    value,
  );
}

export function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
