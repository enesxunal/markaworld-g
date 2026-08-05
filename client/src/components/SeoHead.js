import { useEffect } from 'react';
import { absoluteUrl, DEFAULT_OG, SITE_NAME } from '../seo/siteConfig';

const ATTR = 'data-seo-managed';

function upsertMeta({ name, property, content }) {
  if (!content) return null;
  const selector = name
    ? `meta[${ATTR}][name="${name}"]`
    : `meta[${ATTR}][property="${property}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    // Prefer adopting an existing static tag once, then mark it managed
    const fallback = name
      ? document.head.querySelector(`meta[name="${name}"]:not([${ATTR}])`)
      : document.head.querySelector(`meta[property="${property}"]:not([${ATTR}])`);
    el = fallback || document.createElement('meta');
    if (!fallback) document.head.appendChild(el);
    el.setAttribute(ATTR, 'true');
    if (name) el.setAttribute('name', name);
    if (property) el.setAttribute('property', property);
  }
  el.setAttribute('content', content);
  return el;
}

function upsertLink(rel, href) {
  if (!href) return null;
  let el = document.head.querySelector(`link[${ATTR}][rel="${rel}"]`);
  if (!el) {
    const fallback = document.head.querySelector(`link[rel="${rel}"]:not([${ATTR}])`);
    el = fallback || document.createElement('link');
    if (!fallback) document.head.appendChild(el);
    el.setAttribute(ATTR, 'true');
    el.setAttribute('rel', rel);
  }
  el.setAttribute('href', href);
  return el;
}

function upsertJsonLd(data) {
  const id = 'seo-json-ld';
  let el = document.getElementById(id);
  if (!data) {
    if (el) el.remove();
    return null;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    el.setAttribute(ATTR, 'true');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
  return el;
}

/**
 * Client-side SEO head manager for CRA SPA routes.
 * Upserts title/meta/link/JSON-LD without leaving duplicate tags.
 */
function SeoHead({
  title,
  description,
  canonicalPath,
  robots = 'index, follow',
  ogTitle,
  ogDescription,
  ogUrl,
  ogImage,
  ogType = DEFAULT_OG.type,
  jsonLd = null,
  noCanonical = false,
}) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const resolvedTitle = title || SITE_NAME;
    const resolvedDescription = description || '';
    const canonical =
      !noCanonical && canonicalPath != null
        ? absoluteUrl(canonicalPath)
        : null;
    const resolvedOgUrl = ogUrl || canonical;
    const resolvedOgTitle = ogTitle || resolvedTitle;
    const resolvedOgDescription = ogDescription || resolvedDescription;

    document.title = resolvedTitle;

    upsertMeta({ name: 'description', content: resolvedDescription });
    upsertMeta({ name: 'robots', content: robots });
    upsertMeta({ property: 'og:type', content: ogType });
    upsertMeta({ property: 'og:site_name', content: DEFAULT_OG.siteName });
    upsertMeta({ property: 'og:locale', content: DEFAULT_OG.locale });
    upsertMeta({ property: 'og:title', content: resolvedOgTitle });
    upsertMeta({ property: 'og:description', content: resolvedOgDescription });
    if (resolvedOgUrl) upsertMeta({ property: 'og:url', content: resolvedOgUrl });
    if (ogImage) {
      upsertMeta({ property: 'og:image', content: ogImage });
    }
    upsertMeta({ name: 'twitter:card', content: ogImage ? 'summary_large_image' : 'summary' });
    upsertMeta({ name: 'twitter:title', content: resolvedOgTitle });
    upsertMeta({ name: 'twitter:description', content: resolvedOgDescription });
    if (ogImage) {
      upsertMeta({ name: 'twitter:image', content: ogImage });
    }

    if (canonical) {
      upsertLink('canonical', canonical);
    }

    upsertJsonLd(jsonLd);

    return () => {
      // Remove page-specific JSON-LD so private/public routes do not leak schema
      upsertJsonLd(null);
    };
    // jsonLd serialized to avoid referential churn from inline objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    description,
    canonicalPath,
    robots,
    ogTitle,
    ogDescription,
    ogUrl,
    ogImage,
    ogType,
    jsonLdKey,
    noCanonical,
  ]);

  return null;
}

export default SeoHead;
export { upsertMeta, upsertLink, upsertJsonLd };
