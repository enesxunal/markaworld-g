/** Public blog category filters — labels match Phase 5 brief. */

export const BLOG_CATEGORIES = [
  {
    id: 'tokat-alisveris-rehberi',
    label: 'Tokat Alışveriş Rehberi',
  },
  {
    id: 'kadin-giyim',
    label: 'Kadın Giyim',
  },
  {
    id: 'erkek-giyim',
    label: 'Erkek Giyim',
  },
  {
    id: 'cocuk-giyim',
    label: 'Çocuk Giyim',
  },
  {
    id: 'taksit-ve-butce',
    label: 'Taksit ve Bütçe',
  },
  {
    id: 'alisveris-rehberi',
    label: 'Alışveriş Rehberi',
  },
];

export function getCategoryLabel(categoryId) {
  return BLOG_CATEGORIES.find((c) => c.id === categoryId)?.label || categoryId;
}
