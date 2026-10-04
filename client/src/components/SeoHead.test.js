/**
 * @jest-environment jsdom
 */
/* eslint-disable testing-library/no-node-access -- SEO tests assert document.head meta/link/script tags */
import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SeoHead from './SeoHead';
import {
  SEO_PAGES,
  buildHomeJsonLd,
  absoluteUrl,
  PUBLIC_INDEXABLE_PATHS,
  SITE_ORIGIN,
} from '../seo/siteConfig';
import fs from 'fs';
import path from 'path';

function getMeta(name) {
  return document.head.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function getProperty(property) {
  return document.head.querySelector(`meta[property="${property}"]`)?.getAttribute('content');
}

function getCanonical() {
  return document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
}

describe('SeoHead', () => {
  beforeEach(() => {
    document.title = '';
    document.head.innerHTML = '';
  });

  test('anasayfa title, description, canonical, robots ve tek JSON-LD üretir', async () => {
    const seo = SEO_PAGES.home;
    const jsonLd = buildHomeJsonLd();

    render(
      <SeoHead
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.path}
        robots={seo.robots}
        jsonLd={jsonLd}
      />
    );

    await waitFor(() => {
      expect(document.title).toBe(seo.title);
    });

    expect(getMeta('description')).toBe(seo.description);
    expect(getMeta('robots')).toBe('index, follow');
    expect(getCanonical()).toBe(`${SITE_ORIGIN}/`);
    expect(getProperty('og:title')).toBe(seo.title);
    expect(getProperty('og:locale')).toBe('tr_TR');

    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(1);
    const parsed = JSON.parse(scripts[0].textContent);
    expect(parsed['@graph']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ '@type': 'WebSite', name: 'Marka World' }),
        expect.objectContaining({ '@type': 'ClothingStore', telephone: '+903565027899' }),
      ])
    );
  });

  test('aynı meta name için duplicate üretmez', async () => {
    const seo = SEO_PAGES.home;
    const { rerender } = render(
      <SeoHead title={seo.title} description={seo.description} canonicalPath="/" robots="index, follow" />
    );

    await waitFor(() => expect(document.title).toBe(seo.title));

    rerender(
      <SeoHead
        title="Güncel Title"
        description="Güncel description"
        canonicalPath="/"
        robots="index, follow"
      />
    );

    await waitFor(() => expect(document.title).toBe('Güncel Title'));
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(getMeta('description')).toBe('Güncel description');
  });

  test('private route noindex üretir ve unmount JSON-LD temizler', async () => {
    const seo = SEO_PAGES.adminLogin;
    const { unmount } = render(
      <SeoHead
        title={seo.title}
        description={seo.description}
        robots={seo.robots}
        noCanonical
        jsonLd={buildHomeJsonLd()}
      />
    );

    await waitFor(() => expect(getMeta('robots')).toBe('noindex, nofollow'));
    expect(getCanonical()).toBeUndefined();
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(1);

    unmount();
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(0);
  });

  test('404 noindex üretir', async () => {
    const seo = SEO_PAGES.notFound;
    render(
      <SeoHead title={seo.title} description={seo.description} robots={seo.robots} noCanonical />
    );
    await waitFor(() => expect(getMeta('robots')).toBe('noindex, follow'));
  });
});

describe('siteConfig', () => {
  test('absoluteUrl www canonical formatında üretir', () => {
    expect(absoluteUrl('/')).toBe('https://www.markaworld.com.tr/');
    expect(absoluteUrl('/kvkk')).toBe('https://www.markaworld.com.tr/kvkk');
  });

  test('public indexable paths yalnız gerçek public sayfalar', () => {
    expect(PUBLIC_INDEXABLE_PATHS).toEqual(['/', '/blog', '/privacy-policy', '/terms', '/kvkk']);
    expect(PUBLIC_INDEXABLE_PATHS).not.toEqual(expect.arrayContaining(['/admin', '/customer', '/register']));
  });

  test('ClothingStore JSON-LD doğrulanmamış alanları içermez', () => {
    const store = buildHomeJsonLd()['@graph'].find((n) => n['@type'] === 'ClothingStore');
    expect(store.aggregateRating).toBeUndefined();
    expect(store.review).toBeUndefined();
    expect(store.priceRange).toBeUndefined();
    expect(store.openingHoursSpecification).toBeUndefined();
  });
});

describe('robots.txt ve sitemap.xml', () => {
  const publicDir = path.join(__dirname, '../../public');

  test('robots.txt Allow, Sitemap ve private Disallow içerir', () => {
    const robots = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');
    expect(robots).toMatch(/User-agent:\s*\*/);
    expect(robots).toMatch(/Allow:\s*\//);
    expect(robots).toContain('Sitemap: https://www.markaworld.com.tr/sitemap.xml');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /customer/');
  });

  test('sitemap geçerli XML ve yalnız public URL içerir', () => {
    const xml = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    expect(xml).toMatch(/<\?xml version="1\.0"/);
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>https://www.markaworld.com.tr/</loc>');
    expect(xml).toContain('<loc>https://www.markaworld.com.tr/blog</loc>');
    expect(xml).toContain('<loc>https://www.markaworld.com.tr/privacy-policy</loc>');
    expect(xml).toContain('<loc>https://www.markaworld.com.tr/terms</loc>');
    expect(xml).toContain('<loc>https://www.markaworld.com.tr/kvkk</loc>');
    expect(xml).not.toMatch(/\/admin/);
    expect(xml).not.toMatch(/\/customer/);
    expect(xml).not.toMatch(/\/register/);
    expect(xml).not.toMatch(/\/login/);
  });
});

describe('route smoke (SEO sınıflandırma)', () => {
  test('NotFound route mount olur', async () => {
    const NotFound = require('../pages/NotFound').default;
    render(
      <MemoryRouter initialEntries={['/bilinmeyen-seo-test']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Sayfa bulunamadı/i);
    await waitFor(() => expect(getMeta('robots')).toBe('noindex, follow'));
  });
});
