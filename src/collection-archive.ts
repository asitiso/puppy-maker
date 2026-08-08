export type CollectionArchiveInput = {
  memories: number;
  discoveries: number;
  stories: number;
  talents: number;
  titles: number;
  seasonStamps: number;
};

export type CollectionCategoryId = keyof CollectionArchiveInput;

export type CollectionArchiveCategory = {
  id: CollectionCategoryId;
  label: string;
  current: number;
  total: number;
};

const categoryDefinitions: Array<{ id: CollectionCategoryId; label: string; total: number }> = [
  { id:'memories', label:'기억', total:13 },
  { id:'discoveries', label:'발견물', total:6 },
  { id:'stories', label:'이야기', total:5 },
  { id:'talents', label:'고급 재능', total:8 },
  { id:'titles', label:'칭호', total:6 },
  { id:'seasonStamps', label:'계절 인장', total:4 },
];

function clampCount(value: number, total: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(total, Math.floor(value)));
}

export function collectionArchive(input: CollectionArchiveInput) {
  const categories: CollectionArchiveCategory[] = categoryDefinitions.map(definition => ({
    ...definition,
    current: clampCount(input[definition.id], definition.total),
  }));
  const current = categories.reduce((sum, item) => sum + item.current, 0);
  const total = categories.reduce((sum, item) => sum + item.total, 0);
  return {
    categories,
    current,
    total,
    percent: total === 0 ? 0 : Math.round((current / total) * 100),
  };
}
