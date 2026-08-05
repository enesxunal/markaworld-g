import React from 'react';
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BRAND } from '../../styles/brand';
import { BUSINESS } from '../../seo/siteConfig';

const linkSx = {
  color: BRAND.black,
  fontWeight: 600,
  textDecoration: 'underline',
  textDecorationColor: BRAND.accent,
  textUnderlineOffset: 3,
  '&:hover': { color: BRAND.accentDark },
};

/**
 * Renders structured blog content blocks (no markdown dependency).
 */
function BlogContent({ blocks = [] }) {
  return (
    <Box
      className="blog-content"
      sx={{
        '& p': { mb: 2.25 },
        color: BRAND.black,
      }}
    >
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'p') {
          return (
            <Typography key={key} component="p" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, lineHeight: 1.8, color: BRAND.dark, mb: 2.25 }}>
              {renderInline(block.text)}
            </Typography>
          );
        }

        if (block.type === 'h2') {
          return (
            <Typography
              key={key}
              id={block.id}
              component="h2"
              sx={{
                fontSize: { xs: '1.35rem', md: '1.5rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                mt: 4.5,
                mb: 1.75,
                scrollMarginTop: 96,
              }}
            >
              {block.text}
            </Typography>
          );
        }

        if (block.type === 'h3') {
          return (
            <Typography
              key={key}
              component="h3"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                fontWeight: 600,
                mt: 3,
                mb: 1.25,
              }}
            >
              {block.text}
            </Typography>
          );
        }

        if (block.type === 'ul' || block.type === 'ol') {
          const ListTag = block.type === 'ol' ? 'ol' : 'ul';
          return (
            <Box
              key={key}
              component={ListTag}
              sx={{
                pl: 3,
                mb: 2.5,
                '& li': {
                  mb: 1,
                  pl: 0.5,
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  lineHeight: 1.75,
                  color: BRAND.dark,
                },
              }}
            >
              {block.items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </Box>
          );
        }

        if (block.type === 'note') {
          return (
            <Box
              key={key}
              component="aside"
              sx={{
                my: 3,
                p: 2.5,
                bgcolor: BRAND.accentLight,
                borderLeft: `3px solid ${BRAND.accentDark}`,
                borderRadius: 1,
              }}
            >
              <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.7, color: BRAND.dark }}>
                {block.text}
              </Typography>
            </Box>
          );
        }

        if (block.type === 'summary') {
          return (
            <Box
              key={key}
              sx={{
                mt: 4,
                mb: 2,
                p: 2.5,
                bgcolor: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                borderRadius: 2,
              }}
            >
              <Typography sx={{ fontSize: '1rem', lineHeight: 1.75, fontWeight: 500 }}>
                {block.text}
              </Typography>
            </Box>
          );
        }

        return null;
      })}
    </Box>
  );
}

/** Very small inline linker for known internal paths in plain text — kept minimal. */
function renderInline(text) {
  if (!text || typeof text !== 'string') return text;

  // Split known phrases into RouterLinks where helpful
  const patterns = [
    {
      phrase: 'müşteri giriş sayfasını',
      to: '/customer-login',
    },
    {
      phrase: 'müşteri giriş sayfasından',
      to: '/customer-login',
    },
    {
      phrase: 'anasayfanın iletişim bölümünde',
      to: '/#contact',
    },
    {
      phrase: 'anasayfadaki konum bölümünü',
      to: '/#contact',
    },
  ];

  for (const { phrase, to } of patterns) {
    const idx = text.indexOf(phrase);
    if (idx !== -1) {
      return (
        <>
          {text.slice(0, idx)}
          <Box component={RouterLink} to={to} sx={linkSx}>
            {phrase}
          </Box>
          {text.slice(idx + phrase.length)}
        </>
      );
    }
  }

  return text;
}

export function BlogFaq({ faq = [] }) {
  if (!faq.length) return null;
  return (
    <Box component="section" sx={{ mt: 5 }} aria-labelledby="blog-faq-heading">
      <Typography id="blog-faq-heading" component="h2" sx={{ fontSize: '1.35rem', fontWeight: 700, mb: 2 }}>
        Sık sorulan sorular
      </Typography>
      <List disablePadding>
        {faq.map((item) => (
          <ListItem
            key={item.question}
            alignItems="flex-start"
            sx={{
              flexDirection: 'column',
              alignItems: 'stretch',
              bgcolor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 2,
              mb: 1.5,
              px: 2.5,
              py: 2,
            }}
          >
            <Typography component="h3" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>
              {item.question}
            </Typography>
            <ListItemText
              primary={item.answer}
              primaryTypographyProps={{ sx: { color: BRAND.warmGray, lineHeight: 1.7 } }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export function BlogTrustBox() {
  return (
    <Box
      component="aside"
      sx={{
        mt: 4,
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${BRAND.border}`,
        bgcolor: BRAND.white,
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Marka World hakkında</Typography>
      <Typography sx={{ color: BRAND.warmGray, fontSize: '0.95rem', lineHeight: 1.7, mb: 1.5 }}>
        Tokat’ta kadın, erkek ve çocuk ürünleri sunan fiziksel mağaza. Taksitli alışveriş bilgisi ve ödeme takibi için bizimle iletişime geçebilirsiniz.
      </Typography>
      <Typography sx={{ fontSize: '0.9rem', color: BRAND.dark, lineHeight: 1.7 }}>
        {BUSINESS.streetAddress}, {BUSINESS.postalCode} {BUSINESS.addressLocality}
        <br />
        Tel: {BUSINESS.telephoneDisplay}
        <br />
        E-posta: {BUSINESS.email}
      </Typography>
    </Box>
  );
}

export default BlogContent;
