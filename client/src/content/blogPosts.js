import { BLOG_CATEGORIES, getCategoryLabel } from './blogCategories';
import { DRAFT_CONTENT_CALENDAR } from './blogDraftCalendar';

import postTaksitli from './blog/tokatta-taksitli-alisveris-nasil-yapilir';
import postMagazaSecimi from './blog/tokatta-giyim-magazasi-secerken-nelere-dikkat-edilmeli';
import postKadinSezon from './blog/tokatta-kadin-giyim-sezonluk-rehber';
import postErkekBeden from './blog/tokatta-erkek-giyim-beden-kalip-secimi';
import postCocuk from './blog/tokatta-cocuk-giyim-alirken-nelere-dikkat-edilmeli';
import postButce from './blog/taksitli-alisveriste-butce-plani';
import postPanel from './blog/musteri-panelinden-odeme-takibi';
import postMagazaRehberi from './blog/marka-world-tokat-magaza-rehberi';
import postZaraStyle from './blog/zara-stilini-sevenler-icin-tokatta-giyim-alternatifleri';
import postMangoStyle from './blog/mango-stilini-sevenler-icin-tokatta-kadin-giyim';
import postBershkaStyle from './blog/bershka-stilini-sevenler-icin-tokatta-genc-giyim';
import postPullBearStyle from './blog/pull-and-bear-stilini-sevenler-icin-tokatta-gunluk-giyim';
import postStradivariusStyle from './blog/stradivarius-stilini-sevenler-icin-tokatta-kadin-giyim';
import postHmStyle from './blog/hm-stilini-sevenler-icin-tokatta-temel-giyim';

/** Published posts only — drafts live in DRAFT_CONTENT_CALENDAR. */
export const PUBLISHED_BLOG_POSTS = [
  postTaksitli,
  postMagazaSecimi,
  postKadinSezon,
  postErkekBeden,
  postCocuk,
  postButce,
  postPanel,
  postMagazaRehberi,
  postZaraStyle,
  postMangoStyle,
  postBershkaStyle,
  postPullBearStyle,
  postStradivariusStyle,
  postHmStyle,
];

const bySlug = Object.fromEntries(PUBLISHED_BLOG_POSTS.map((p) => [p.slug, p]));

export function getAllPublishedPosts() {
  return [...PUBLISHED_BLOG_POSTS].sort((a, b) => {
    if (a.publishedAt === b.publishedAt) return a.title.localeCompare(b.title, 'tr');
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });
}

export function getPostBySlug(slug) {
  return bySlug[slug] || null;
}

export function getPostsByCategory(categoryId) {
  if (!categoryId) return getAllPublishedPosts();
  return getAllPublishedPosts().filter((p) => p.category === categoryId);
}

export function getRelatedPosts(post, limit = 3) {
  if (!post?.relatedPosts?.length) return [];
  return post.relatedPosts
    .map((slug) => bySlug[slug])
    .filter(Boolean)
    .slice(0, limit);
}

export function getTocFromContent(content = []) {
  return content
    .filter((block) => block.type === 'h2' && block.id)
    .map((block) => ({ id: block.id, text: block.text }));
}

export function formatBlogDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getPostPath(slug) {
  return `/blog/${slug}`;
}

export {
  BLOG_CATEGORIES,
  getCategoryLabel,
  DRAFT_CONTENT_CALENDAR,
};
