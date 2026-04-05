export function normalizeId(value) {
  return value?._id || value?.id || String(value || "");
}

export function formatDate(value) {
  if (!value) {
    return "just now";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function excerpt(value, length = 140) {
  if (!value) {
    return "No note body yet.";
  }

  return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

export function buildNoteQuery(filters, includeVisibility = false) {
  const query = {};

  if (filters.search.trim()) {
    query.search = filters.search.trim();
  }

  if (filters.mood) {
    query.mood = filters.mood;
  }

  if (filters.sort) {
    query.sort = filters.sort;
  }

  if (includeVisibility && filters.visibility) {
    query.visibility = filters.visibility;
  }

  return query;
}
