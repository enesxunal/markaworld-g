import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import PublicLayout from '../components/PublicLayout';

const KVKK = () => {
  return (
    <PublicLayout>
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              KVKK Aydınlatma Metni
            </Typography>
            <Typography variant="body1" paragraph>
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, Marka World olarak kişisel verilerinizin işlenmesi hakkında sizi bilgilendirmek isteriz.
            </Typography>
            <Typography variant="h6" gutterBottom>
              1. Veri Sorumlusu
            </Typography>
            <Typography variant="body1" paragraph>
              Marka World, kişisel verilerinizin işlenmesi konusunda veri sorumlusu olarak hareket etmektedir.
            </Typography>
            <Typography variant="h6" gutterBottom>
              2. Kişisel Verilerin İşlenme Amaçları
            </Typography>
            <Typography variant="body1" paragraph>
              • Hizmetlerimizin sunulması ve geliştirilmesi
              • Müşteri ilişkilerinin yönetimi
              • Yasal yükümlülüklerin yerine getirilmesi
              • İş süreçlerinin yürütülmesi
              • Güvenliğin sağlanması
            </Typography>
            <Typography variant="h6" gutterBottom>
              3. Kişisel Verilerin Aktarımı
            </Typography>
            <Typography variant="body1" paragraph>
              Kişisel verileriniz, yasal zorunluluklar ve hizmet gereklilikleri doğrultusunda üçüncü kişilerle paylaşılabilir.
            </Typography>
            <Typography variant="h6" gutterBottom>
              4. Kişisel Veri Sahibinin Hakları
            </Typography>
            <Typography variant="body1" paragraph>
              KVKK'nın 11. maddesi uyarınca sahip olduğunuz haklar:
              • Kişisel verilerinizin işlenip işlenmediğini öğrenme
              • Kişisel verileriniz işlenmişse bilgi talep etme
              • İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
              • Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
              • Eksik veya yanlış işlenmişse düzeltilmesini isteme
              • Silinmesini veya yok edilmesini isteme
            </Typography>
            <Typography variant="h6" gutterBottom>
              5. İletişim
            </Typography>
            <Typography variant="body1" paragraph>
              KVKK kapsamındaki haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </PublicLayout>
  );
};

export default KVKK; 