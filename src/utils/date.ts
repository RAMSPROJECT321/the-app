const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export const formatRelativeTime = (isoDate: string) => {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const deltaSeconds = Math.round((then - now) / 1000);
  const minutes = Math.round(deltaSeconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(minutes) < 60) {
    return relativeFormatter.format(minutes, "minute");
  }

  if (Math.abs(hours) < 24) {
    return relativeFormatter.format(hours, "hour");
  }

  return relativeFormatter.format(days, "day");
};

export const formatDateTime = (isoDate: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
