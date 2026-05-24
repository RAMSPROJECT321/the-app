type RelativeTimeUnit = "minute" | "hour" | "day";

const getRelativeFormatter = () => {
  if (
    typeof Intl === "undefined" ||
    typeof Intl.RelativeTimeFormat !== "function"
  ) {
    return null;
  }

  return new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });
};

const formatRelativeFallback = (value: number, unit: RelativeTimeUnit) => {
  const absolute = Math.abs(value);
  const label = absolute === 1 ? unit : `${unit}s`;

  if (value === 0) {
    return `this ${unit}`;
  }

  if (value > 0) {
    return `in ${absolute} ${label}`;
  }

  return `${absolute} ${label} ago`;
};

export const formatRelativeTime = (isoDate: string) => {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const deltaSeconds = Math.round((then - now) / 1000);
  const minutes = Math.round(deltaSeconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const formatter = getRelativeFormatter();

  if (Math.abs(minutes) < 60) {
    return formatter?.format(minutes, "minute") ?? formatRelativeFallback(minutes, "minute");
  }

  if (Math.abs(hours) < 24) {
    return formatter?.format(hours, "hour") ?? formatRelativeFallback(hours, "hour");
  }

  return formatter?.format(days, "day") ?? formatRelativeFallback(days, "day");
};

export const formatDateTime = (isoDate: string) => {
  const date = new Date(isoDate);

  if (
    typeof Intl === "undefined" ||
    typeof Intl.DateTimeFormat !== "function"
  ) {
    return date.toLocaleString();
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};
