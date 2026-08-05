import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import PublicLayout from '../components/PublicLayout';
import SeoHead from '../components/SeoHead';
import { SEO_PAGES } from '../seo/siteConfig';

const PrivacyPolicy = () => {
  const seo = SEO_PAGES.privacy;

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
              Gizlilik Politikası
            </Typography>
            <Typography variant="body1" paragraph>
              Marka World olarak kişisel verilerinizin güvenliği konusunda büyük hassasiyet gösteriyoruz. Bu gizlilik politikası, hizmetlerimizi kullanırken kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              1. Toplanan Bilgiler
            </Typography>
            <Typography variant="body1" paragraph>
              • Kimlik bilgileri (ad, soyad, TC kimlik numarası)
              • İletişim bilgileri (e-posta, telefon, adres)
              • Finansal bilgiler (ödeme bilgileri)
              • Sistem kullanım bilgileri
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              2. Bilgilerin Kullanımı
            </Typography>
            <Typography variant="body1" paragraph>
              Toplanan bilgiler aşağıdaki amaçlarla kullanılmaktadır:
              • Hizmetlerimizin sağlanması ve iyileştirilmesi
              • Yasal yükümlülüklerin yerine getirilmesi
              • Müşteri ilişkilerinin yönetimi
              • Güvenlik ve dolandırıcılığın önlenmesi
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              3. Bilgi Güvenliği
            </Typography>
            <Typography variant="body1" paragraph>
              Kişisel verileriniz, endüstri standardı güvenlik önlemleriyle korunmaktadır. Verilerinizin güvenliği için teknik ve idari tedbirler alınmaktadır.
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              4. İletişim
            </Typography>
            <Typography variant="body1" paragraph>
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </PublicLayout>
  );
};

export default PrivacyPolicy;
