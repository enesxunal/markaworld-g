/**
 * @jest-environment jsdom
 */
/* eslint-disable testing-library/no-node-access -- SEO/DOM assertions for head + headings */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import Blog from '../pages/Blog';
import BlogDetail from '../pages/BlogDetail';
import {
  DRAFT_CONTENT_CALENDAR,
  PUBLISHED_BLOG_POSTS,
  getAllPublishedPosts,
  getPostBySlug,
} from '../content/blogPosts';
import { absoluteUrl, buildBlogPostingJsonLd, PUBLIC_INDEXABLE_PATHS } from '../seo/siteConfig';

function getMeta(name) {
  return document.head.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function getCanonical() {
  return document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
}

function getJsonLd() {
  const el = document.head.querySelector('script[type="application/ld+json"]');
  return el ? JSON.parse(el.textContent) : null;
}

function renderBlogRoutes(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('blog content inventory', () => {
  test('yalnız 8 yayınlanmış yazı vardır', () => {
    expect(PUBLISHED_BLOG_POSTS).toHaveLength(8);
    expect(getAllPublishedPosts()).toHaveLength(8);
    expect(DRAFT_CONTENT_CALENDAR).toHaveLength(20);
  });

  test('her yayın slug benzersiz ve alanlar dolu', () => {
    const slugs = PUBLISHED_BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(8);
    PUBLISHED_BLOG_POSTS.forEach((post) => {
      expect(post.title).toBeTruthy();
      expect(post.description).toBeTruthy();
      expect(post.category).toBeTruthy();
      expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.author).toBe('Marka World İçerik Ekibi');
      expect(post.content?.length).toBeGreaterThan(3);
      expect(post.relatedPosts?.length).toBeGreaterThanOrEqual(2);
      expect(post.heroImage).toBeUndefined();
    });
  });

  test('relatedPosts gerçek yayın slug’larına işaret eder', () => {
    const published = new Set(PUBLISHED_BLOG_POSTS.map((p) => p.slug));
    PUBLISHED_BLOG_POSTS.forEach((post) => {
      post.relatedPosts.forEach((slug) => {
        expect(published.has(slug)).toBe(true);
        expect(slug).not.toBe(post.slug);
      });
    });
  });
});

describe('blog routes', () => {
  beforeEach(() => {
    document.title = '';
    document.head.innerHTML = '';
  });

  test('/blog tek H1 ve index metadata üretir', async () => {
    renderBlogRoutes('/blog');
    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(/^Blog$/);
    await waitFor(() => expect(getMeta('robots')).toBe('index, follow'));
    expect(getCanonical()).toBe(absoluteUrl('/blog'));
  });

  test.each(PUBLISHED_BLOG_POSTS.map((p) => [p.slug, p.title]))(
    'slug %s render olur, tek H1 ve BlogPosting JSON-LD',
    async (slug, title) => {
      renderBlogRoutes(`/blog/${slug}`);
      const h1 = screen.getAllByRole('heading', { level: 1 });
      expect(h1).toHaveLength(1);
      expect(h1[0]).toHaveTextContent(title);

      await waitFor(() => expect(getCanonical()).toBe(absoluteUrl(`/blog/${slug}`)));
      expect(getMeta('robots')).toBe('index, follow');

      const jsonLd = getJsonLd();
      expect(jsonLd['@graph']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ '@type': 'BlogPosting', headline: title }),
          expect.objectContaining({ '@type': 'BreadcrumbList' }),
        ])
      );
      const posting = jsonLd['@graph'].find((n) => n['@type'] === 'BlogPosting');
      expect(posting.image).toBeUndefined();
      expect(posting.dateModified).toBeUndefined();
      expect(posting.aggregateRating).toBeUndefined();
    }
  );

  test('bilinmeyen slug noindex ve anlamlı 404', async () => {
    renderBlogRoutes('/blog/bu-yazi-yok');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Yazı bulunamadı/i);
    expect(screen.getByRole('link', { name: /Bloga dön/i })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: /^Anasayfa$/i })).toHaveAttribute('href', '/');
    await waitFor(() => expect(getMeta('robots')).toBe('noindex, follow'));
    expect(getCanonical()).toBeUndefined();
  });

  test('FAQ olan yazıda FAQPage schema ve görünür SSS eşleşir', async () => {
    const withFaq = PUBLISHED_BLOG_POSTS.find((p) => p.faq?.length);
    expect(withFaq).toBeTruthy();
    renderBlogRoutes(`/blog/${withFaq.slug}`);
    expect(screen.getByRole('heading', { name: /Sık sorulan sorular/i })).toBeInTheDocument();
    withFaq.faq.forEach((item) => {
      expect(screen.getByRole('heading', { name: item.question })).toBeInTheDocument();
    });
    await waitFor(() => {
      const jsonLd = getJsonLd();
      const faq = jsonLd['@graph'].find((n) => n['@type'] === 'FAQPage');
      expect(faq.mainEntity).toHaveLength(withFaq.faq.length);
    });
  });
});

describe('buildBlogPostingJsonLd', () => {
  test('geçerli BlogPosting + Breadcrumb üretir', () => {
    const post = getPostBySlug('marka-world-tokat-magaza-rehberi');
    const data = buildBlogPostingJsonLd(post);
    expect(data['@context']).toBe('https://schema.org');
    const posting = data['@graph'].find((n) => n['@type'] === 'BlogPosting');
    expect(posting.mainEntityOfPage['@id']).toBe(
      absoluteUrl('/blog/marka-world-tokat-magaza-rehberi')
    );
  });
});

describe('sitemap blog URLs', () => {
  const publicDir = path.join(__dirname, '../../public');

  test('sitemap 8 blog yazısı + /blog içerir, private URL yoktur', () => {
    const xml = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
    expect(xml).toMatch(/<\?xml version="1\.0"/);
    expect(xml).toContain('<loc>https://www.markaworld.com.tr/blog</loc>');
    PUBLISHED_BLOG_POSTS.forEach((post) => {
      expect(xml).toContain(`<loc>https://www.markaworld.com.tr/blog/${post.slug}</loc>`);
    });
    expect(xml).not.toMatch(/\/admin/);
    expect(xml).not.toMatch(/\/customer-login/);
    expect(xml).not.toMatch(/\/register/);
    expect(xml).not.toMatch(/\?kategori=/);
  });

  test('PUBLIC_INDEXABLE_PATHS blog içerir', () => {
    expect(PUBLIC_INDEXABLE_PATHS).toEqual(
      expect.arrayContaining(['/', '/blog', '/privacy-policy', '/terms', '/kvkk'])
    );
  });
});

describe('blog list empty category', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  test('yazısız kategori boş durum gösterir', async () => {
    render(
      <MemoryRouter initialEntries={['/blog?kategori=alisveris-rehberi']}>
        <Routes>
          <Route path="/blog" element={<Blog />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog');
    expect(await screen.findByText(/Bu kategoride henüz yayınlanmış yazı yok/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tüm yazıları göster/i })).toBeInTheDocument();
  });
});
