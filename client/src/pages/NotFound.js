import React from 'react';
import { Box, Button, Container, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { SEO_PAGES } from '../seo/siteConfig';
import { BRAND } from '../styles/brand';

const NotFound = () => {
  const seo = SEO_PAGES.notFound;

  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', bgcolor: BRAND.warmWhite }}>
      <SeoHead
        title={seo.title}
        description={seo.description}
        robots={seo.robots}
        noCanonical
      />
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography
          component="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '2.5rem' },
            color: BRAND.black,
            mb: 2,
            letterSpacing: '-0.02em',
          }}
        >
          Sayfa bulunamadı
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 4, fontSize: '1.05rem', lineHeight: 1.7 }}>
          Aradığınız adres mevcut değil veya taşınmış olabilir. Anasayfadan devam edebilirsiniz.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            size="large"
            sx={{
              bgcolor: BRAND.black,
              '&:hover': { bgcolor: BRAND.dark },
              px: 3,
            }}
          >
            Anasayfaya dön
          </Button>
          <Button
            component={RouterLink}
            to="/#contact"
            variant="outlined"
            size="large"
            sx={{
              borderColor: BRAND.black,
              color: BRAND.black,
              '&:hover': { borderColor: BRAND.accent, color: BRAND.accent },
            }}
          >
            İletişim
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default NotFound;
