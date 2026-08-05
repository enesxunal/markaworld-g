import React, { useMemo } from 'react';
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BlogLayout from '../components/blog/BlogLayout';
import BlogCard from '../components/blog/BlogCard';
import BlogContent, { BlogFaq, BlogTrustBox } from '../components/blog/BlogContent';
import SeoHead from '../components/SeoHead';
import { BRAND } from '../styles/brand';
import {
  formatBlogDate,
  getCategoryLabel,
  getPostBySlug,
  getPostPath,
  getRelatedPosts,
  getTocFromContent,
} from '../content/blogPosts';
import {
  BUSINESS,
  SEO_PAGES,
  absoluteUrl,
  buildBlogPostingJsonLd,
} from '../seo/siteConfig';

function BlogDetail() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  const related = useMemo(() => (post ? getRelatedPosts(post, 3) : []), [post]);
  const toc = useMemo(() => (post ? getTocFromContent(post.content) : []), [post]);

  if (!post) {
    const seo = SEO_PAGES.blogNotFound;
    return (
      <BlogLayout maxWidth="sm">
        <SeoHead
          title={seo.title}
          description={seo.description}
          robots={seo.robots}
          noCanonical
        />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography
            component="h1"
            sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 700, mb: 2 }}
          >
            Yazı bulunamadı
          </Typography>
          <Typography sx={{ color: BRAND.warmGray, mb: 3, lineHeight: 1.7 }}>
            Aradığınız blog yazısı yayında değil veya bağlantı hatalı olabilir.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink}
              to="/blog"
              variant="contained"
              sx={{ bgcolor: BRAND.black, '&:hover': { bgcolor: BRAND.dark } }}
            >
              Bloga dön
            </Button>
            <Button
              component={RouterLink}
              to="/"
              variant="outlined"
              sx={{ borderColor: BRAND.black, color: BRAND.black }}
            >
              Anasayfa
            </Button>
          </Stack>
        </Box>
      </BlogLayout>
    );
  }

  const path = getPostPath(post.slug);
  const jsonLd = buildBlogPostingJsonLd(post);
  const showCustomerLoginCta = post.slug === 'musteri-panelinden-odeme-takibi'
    || post.slug === 'taksitli-alisveriste-butce-plani'
    || post.slug === 'marka-world-tokat-magaza-rehberi'
    || post.slug === 'tokatta-taksitli-alisveris-nasil-yapilir';

  return (
    <BlogLayout maxWidth="md">
      <SeoHead
        title={`${post.title} | Marka World`}
        description={post.description}
        canonicalPath={path}
        robots="index, follow"
        ogType="article"
        ogTitle={post.title}
        ogDescription={post.description}
        ogUrl={absoluteUrl(path)}
        jsonLd={jsonLd}
      />

      <Breadcrumbs
        aria-label="Breadcrumb"
        sx={{ mb: 3, '& .MuiBreadcrumbs-separator': { color: BRAND.muted } }}
      >
        <MuiLink component={RouterLink} to="/" underline="hover" color="inherit" sx={{ fontSize: '0.9rem' }}>
          Anasayfa
        </MuiLink>
        <MuiLink component={RouterLink} to="/blog" underline="hover" color="inherit" sx={{ fontSize: '0.9rem' }}>
          Blog
        </MuiLink>
        <Typography color="text.primary" sx={{ fontSize: '0.9rem' }}>
          {post.title}
        </Typography>
      </Breadcrumbs>

      <Chip
        size="small"
        label={getCategoryLabel(post.category)}
        sx={{ mb: 2, bgcolor: BRAND.accentLight, fontWeight: 600, borderRadius: 1 }}
      />

      <Typography
        component="h1"
        sx={{
          fontSize: { xs: '1.75rem', md: '2.35rem' },
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          mb: 2,
        }}
      >
        {post.title}
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1, sm: 2 }}
        flexWrap="wrap"
        useFlexGap
        sx={{ color: BRAND.warmGray, mb: 3, fontSize: '0.9rem' }}
      >
        <Typography component="span">Yayın: {formatBlogDate(post.publishedAt)}</Typography>
        <Typography component="span">Yazar: {post.author}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" component="span">
          <AccessTimeIcon sx={{ fontSize: 16 }} />
          <span>{post.readingTime} dk okuma</span>
        </Stack>
      </Stack>

      <Typography sx={{ color: BRAND.muted, fontSize: '0.85rem', mb: 3 }}>
        {post.reviewedBy}
      </Typography>

      {/* Typographic hero — no stock image */}
      <Box
        sx={{
          mb: 4,
          py: { xs: 3, md: 4 },
          px: { xs: 2.5, md: 3 },
          borderRadius: 2,
          background: `linear-gradient(135deg, ${BRAND.dark} 0%, #2a2a2a 55%, ${BRAND.accentDark} 160%)`,
          color: BRAND.white,
        }}
        aria-hidden={false}
      >
        <Typography sx={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: BRAND.accent, mb: 1 }}>
          {getCategoryLabel(post.category)}
        </Typography>
        <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' }, lineHeight: 1.6, maxWidth: 560, color: 'rgba(255,255,255,0.85)' }}>
          {post.excerpt}
        </Typography>
      </Box>

      {toc.length > 0 && (
        <Box
          component="nav"
          aria-label="İçindekiler"
          sx={{
            mb: 4,
            p: 2.5,
            bgcolor: BRAND.white,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 1.5 }}>İçindekiler</Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            {toc.map((item) => (
              <Box component="li" key={item.id} sx={{ mb: 0.75 }}>
                <MuiLink href={`#${item.id}`} underline="hover" sx={{ color: BRAND.dark, fontSize: '0.95rem' }}>
                  {item.text}
                </MuiLink>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <BlogContent blocks={post.content} />

      <BlogFaq faq={post.faq || []} />

      <BlogTrustBox />

      <Divider sx={{ my: 4 }} />

      <Stack spacing={2} sx={{ mb: 4 }}>
        <Typography sx={{ fontWeight: 600 }}>
          Mağaza veya ödeme planı hakkında soru sormak ister misiniz?
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<WhatsAppIcon />}
            href={BUSINESS.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ bgcolor: BRAND.whatsapp, '&:hover': { bgcolor: '#1da851' } }}
          >
            WhatsApp ile yazın
          </Button>
          {showCustomerLoginCta && (
            <Button
              component={RouterLink}
              to="/customer-login"
              variant="outlined"
              sx={{ borderColor: BRAND.black, color: BRAND.black }}
            >
              Müşteri paneline gir
            </Button>
          )}
          <Button
            component={RouterLink}
            to="/#contact"
            variant="text"
            sx={{ color: BRAND.warmGray }}
          >
            İletişim bilgileri
          </Button>
        </Stack>
      </Stack>

      {related.length > 0 && (
        <Box component="section" sx={{ mb: 4 }}>
          <Typography component="h2" sx={{ fontSize: '1.35rem', fontWeight: 700, mb: 2 }}>
            İlgili yazılar
          </Typography>
          <Stack spacing={2}>
            {related.map((rel) => (
              <BlogCard key={rel.slug} post={rel} headingLevel="h3" />
            ))}
          </Stack>
        </Box>
      )}

      <MuiLink
        component={RouterLink}
        to="/blog"
        sx={{ color: BRAND.black, fontWeight: 600, textDecoration: 'none', '&:hover': { color: BRAND.accentDark } }}
      >
        ← Tüm blog yazıları
      </MuiLink>
    </BlogLayout>
  );
}

export default BlogDetail;
