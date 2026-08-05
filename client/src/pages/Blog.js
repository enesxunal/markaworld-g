import React, { useMemo, useState } from 'react';
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import BlogLayout from '../components/blog/BlogLayout';
import BlogCard from '../components/blog/BlogCard';
import SeoHead from '../components/SeoHead';
import { BRAND } from '../styles/brand';
import {
  BLOG_CATEGORIES,
  getAllPublishedPosts,
  getPostsByCategory,
} from '../content/blogPosts';
import { SEO_PAGES, absoluteUrl } from '../seo/siteConfig';

function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('kategori') || '';
  const [activeCategory, setActiveCategory] = useState(
    BLOG_CATEGORIES.some((c) => c.id === categoryFromUrl) ? categoryFromUrl : ''
  );

  const seo = SEO_PAGES.blog;
  const posts = useMemo(() => getPostsByCategory(activeCategory || null), [activeCategory]);
  const allCount = getAllPublishedPosts().length;

  const handleCategory = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId) {
      setSearchParams({ kategori: categoryId });
    } else {
      setSearchParams({});
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Marka World Blog',
    description: seo.description,
    url: absoluteUrl('/blog'),
    publisher: {
      '@type': 'Organization',
      name: 'Marka World',
      url: absoluteUrl('/'),
    },
  };

  return (
    <BlogLayout>
      <SeoHead
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.path}
        robots={seo.robots}
        ogType="website"
        jsonLd={jsonLd}
      />

      <Box sx={{ mb: { xs: 3, md: 4 }, maxWidth: 720 }}>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: BRAND.black,
            mb: 1.5,
          }}
        >
          Blog
        </Typography>
        <Typography sx={{ color: BRAND.warmGray, fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7 }}>
          Tokat’ta mağazadan alışveriş, kadın–erkek–çocuk giyim ve taksitli ödeme planı hakkında pratik yazılar.
          Amacımız vitrin metni değil; ziyaret ve bütçe kararınıza yardımcı olmak.
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 3 }}
        component="nav"
        aria-label="Blog kategorileri"
      >
        <Chip
          clickable
          label={`Tümü (${allCount})`}
          onClick={() => handleCategory('')}
          sx={{
            fontWeight: 600,
            bgcolor: !activeCategory ? BRAND.black : BRAND.white,
            color: !activeCategory ? BRAND.white : BRAND.black,
            border: `1px solid ${!activeCategory ? BRAND.black : BRAND.border}`,
            '&:hover': { bgcolor: !activeCategory ? BRAND.dark : BRAND.accentLight },
          }}
        />
        {BLOG_CATEGORIES.map((cat) => {
          const selected = activeCategory === cat.id;
          return (
            <Chip
              key={cat.id}
              clickable
              label={cat.label}
              onClick={() => handleCategory(cat.id)}
              sx={{
                fontWeight: 600,
                bgcolor: selected ? BRAND.black : BRAND.white,
                color: selected ? BRAND.white : BRAND.black,
                border: `1px solid ${selected ? BRAND.black : BRAND.border}`,
                '&:hover': { bgcolor: selected ? BRAND.dark : BRAND.accentLight },
              }}
            />
          );
        })}
      </Stack>

      {posts.length === 0 ? (
        <Box
          sx={{
            bgcolor: BRAND.white,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: BRAND.warmGray, mb: 2, lineHeight: 1.7 }}>
            Bu kategoride henüz yayınlanmış yazı yok. Diğer kategorilere göz atabilir veya tüm yazıları
            görüntüleyebilirsiniz.
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleCategory('')}
            sx={{ bgcolor: BRAND.black, '&:hover': { bgcolor: BRAND.dark } }}
          >
            Tüm yazıları göster
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.slug}>
              <BlogCard post={post} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 5 }}>
        <Typography
          component={RouterLink}
          to="/"
          sx={{ color: BRAND.warmGray, textDecoration: 'none', '&:hover': { color: BRAND.black } }}
        >
          ← Anasayfaya dön
        </Typography>
      </Box>
    </BlogLayout>
  );
}

export default Blog;
