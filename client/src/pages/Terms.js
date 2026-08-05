import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import PublicLayout from '../components/PublicLayout';
import SeoHead from '../components/SeoHead';
import { SEO_PAGES } from '../seo/siteConfig';

const Terms = () => {
  const seo = SEO_PAGES.terms;

  return (
    <PublicLayout>
      <SeoHead
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.path}
        robots={seo.robots}
      />
      <Container maxWidth="md" component="main">
        <Box sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Kullanım Koşulları
            </Typography>
            <Typography variant="body1" paragraph>
              Marka World platformunu kullanmadan önce lütfen aşağıdaki kullanım koşullarını dikkatlice okuyunuz.
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              1. Hizmet Kullanımı
            </Typography>
            <Typography variant="body1" paragraph>
              • Platform üzerinden sunulan hizmetleri yasal amaçlar için kullanmayı kabul ediyorsunuz
              • Hesap bilgilerinizin güvenliğinden siz sorumlusunuz
              • Platformu kötüye kullanmamayı taahhüt ediyorsunuz
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              2. Ödeme ve Faturalama
            </Typography>
            <Typography variant="body1" paragraph>
              • Hizmet bedelleri ve ödeme koşulları platform üzerinde belirtilmiştir
              • Ödemeler güvenli ödeme sistemleri üzerinden yapılmaktadır
              • Fatura bilgilerinizin doğruluğundan siz sorumlusunuz
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              3. Fikri Mülkiyet
            </Typography>
            <Typography variant="body1" paragraph>
              Platform üzerindeki tüm içerik, logo ve markalar Marka World&apos;e aittir ve izinsiz kullanılamaz.
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              4. Sorumluluk Reddi
            </Typography>
            <Typography variant="body1" paragraph>
              • Platform &quot;olduğu gibi&quot; sunulmaktadır
              • Hizmet kesintileri olabilir
              • Veri kaybından kullanıcı sorumludur
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              5. Değişiklikler
            </Typography>
            <Typography variant="body1" paragraph>
              Marka World, bu kullanım koşullarını önceden haber vermeksizin değiştirme hakkını saklı tutar.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </PublicLayout>
  );
};

export default Terms;
