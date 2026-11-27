export function rankSpeciesMatches(items, query) {
  const search = query.trimStart().toLowerCase();
  if (!search) return items;

  const exactName = search.trimEnd();
  const exact = [];
  const prefix = [];
  const contains = [];
  for (const item of items) {
    const name = item.name.toLowerCase();
    if (name === exactName) exact.push(item);
    else if (name.startsWith(search)) prefix.push(item);
    else if (name.includes(search)) contains.push(item);
  }
  return [...exact, ...prefix, ...contains];
}
