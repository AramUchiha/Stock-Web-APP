export function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeTicker(value: string | undefined) {
  const ticker = value?.trim().toUpperCase().replace(/[^A-Z.]/g, "");
  return ticker || undefined;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPrice(value: number | null | undefined, currency = "USD") {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatCompact(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatSignedPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSignedPrice(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

const htmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: "\""
};

export function cleanText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&([a-z]+);/gi, (_, entity: string) => htmlEntities[entity.toLowerCase()] ?? " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

export type StockMove = {
  direction: "up" | "down";
  percent: string;
  phrase: string;
};

export function extractStockMove(value: string) {
  const moveMatch = value.match(/\b(up|gained|rose|jumped|rallied|down|fallen|fell|dropped|declined|slid)\s+(\d+(?:\.\d+)?)%/i);

  if (!moveMatch) {
    return null;
  }

  const verb = moveMatch[1].toLowerCase();
  const direction: StockMove["direction"] = ["down", "fallen", "fell", "dropped", "declined", "slid"].includes(verb)
    ? "down"
    : "up";

  return {
    direction,
    percent: `${moveMatch[2]}%`,
    phrase: moveMatch[0]
  };
}
