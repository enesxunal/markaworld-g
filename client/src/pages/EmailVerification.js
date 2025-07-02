import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Description,
  Security,
  Gavel
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { customerAPI } from '../services/api';

const steps = ['Email Onayı', 'Sözleşme Onayı', 'Hesap Aktif'];

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState(null);
  const [agreements, setAgreements] = useState({
    kvkk: false,
    contract: false,
    electronic: false
  });

  useEffect(() => {
    if (!token) {
      setError('Geçersiz doğrulama linki');
      return;
    }
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.verifyEmail(token);
      
      if (response.data.success) {
        setCustomer(response.data.customer);
        setActiveStep(1); // Her zaman sözleşme adımına geç
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Email onayı başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleAgreementChange = (type) => {
    setAgreements(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    setError(''); // Sözleşme onayı değiştiğinde hata mesajını temizle
  };

  const handleCompleteRegistration = async () => {
    if (!agreements.kvkk || !agreements.contract || !agreements.electronic) {
      setError('Lütfen tüm sözleşmeleri onaylayın');
      return;
    }

    try {
      setLoading(true);
      setError(''); // Hata mesajını temizle
      const response = await customerAPI.completeRegistration(token, agreements);
      
      if (response.data.success) {
        setActiveStep(2);
        // 3 saniye sonra giriş sayfasına yönlendir
        setTimeout(() => {
          navigate('/customer-login', { 
            state: { message: 'Hesabınız başarıyla aktifleştirildi! Giriş yapabilirsiniz.' }
          });
        }, 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Sözleşme onayı başarısız');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box textAlign="center" py={4}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Email onayınız kontrol ediliyor...
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              Email Onaylandı!
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Sayın <strong>{customer?.name}</strong>, email adresiniz başarıyla onaylandı. 
              Hesabınızı aktifleştirmek için aşağıdaki sözleşmeleri onaylamanız gerekmektedir.
            </Alert>

            {/* KVKK Aydınlatma Metni */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Security color="primary" />
                KVKK Aydınlatma Metni
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2, p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2" paragraph>
                  <strong>Değerli Müşterimiz,</strong>
                </Typography>
                <Typography variant="body2" paragraph>
                  6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, 
                  "3 KARE YAZILIM VE TASARIM AJANSI LİMİTED ŞİRKETİ" olarak, 
                  kişisel verilerinizin gizliliğini ve güvenliğini önemsemekteyiz.
                </Typography>
                <Typography variant="body2" paragraph>
                  Tarafımıza sağlamış olduğunuz kişisel veriler;
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                  <li>Satış süreçlerinin yürütülmesi,</li>
                  <li>Taksitli satış sözleşmelerinin oluşturulması ve takibi,</li>
                  <li>Ödeme planlarının yönetilmesi,</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi ve</li>
                  <li>Sözleşme bilgilendirmelerinin yapılması</li>
                </Typography>
                <Typography variant="body2" paragraph>
                  amaçlarıyla işlenmektedir.
                </Typography>
                <Typography variant="body2" paragraph>
                  Kişisel verileriniz yalnızca yetkili firma personelleri tarafından erişilebilecek 
                  şekilde saklanacak ve hiçbir şekilde üçüncü taraflarla paylaşılmayacaktır.
                </Typography>
                <Typography variant="body2" paragraph>
                  Veri sorumlusu sıfatıyla şirket sahibi tarafından yönetilen bu süreçte, 
                  kişisel verileriniz 5 yıl süreyle saklanacak olup, KVKK kapsamındaki haklarınızı 
                  kullanmak için info@markaworld.com.tr adresinden bizimle iletişime geçebilirsiniz.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Saygılarımızla,<br />
                  3 KARE YAZILIM VE TASARIM AJANSI LİMİTED ŞİRKETİ
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreements.kvkk}
                    onChange={() => handleAgreementChange('kvkk')}
                    color="primary"
                  />
                }
                label="KVKK Aydınlatma Metnini okudum ve onaylıyorum"
              />
            </Paper>

            {/* Taksitli Satış Sözleşmesi */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Description color="primary" />
                Taksitli Satış Sözleşmesi
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2, p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2" paragraph>
                  <strong>Taraflar:</strong>
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Satıcı:</strong><br />
                  3 KARE YAZILIM VE TASARIM AJANSI LİMİTED ŞİRKETİ<br />
                  Karşıyaka Mah. Vali Ayhan Çevik Bulvarı 46/A<br />
                  Merkez / TOKAT<br />
                  Vergi Dairesi: Güngören<br />
                  Vergi No: 0012587682<br />
                  E-posta: info@markaworld.com.tr
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Alıcı:</strong><br />
                  Adı Soyadı: {customer?.name}<br />
                  T.C. Kimlik No: {customer?.tc_no}<br />
                  Telefon: {customer?.phone}<br />
                  E-posta: {customer?.email}<br />
                  Adres: {customer?.address || 'Belirtilmemiş'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Madde 1 – Konu</strong><br />
                  İşbu sözleşme, Alıcı'nın Satıcıdan satın aldığı kadın, erkek ve çocuk giyim 
                  ürünlerine ilişkin taksitli ödeme koşullarını düzenlemektedir.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Madde 2 – Ürün Bilgileri ve Bedeli</strong><br />
                  Alıcı aşağıda belirtilen ürün/hizmeti taksitli olarak satın almayı kabul eder:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                  <li>Ürün: Kadın, Erkek, Çocuk Giyim</li>
                  <li>Kredi Limiti: {customer?.credit_limit}₺</li>
                  <li>Faiz oranları satış sırasında sistem tarafından belirlenecektir.</li>
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Madde 3 – Ödeme Şartları</strong><br />
                  - Taksitler eşit tutarlarda olup her ayın aynı gününde ödenecektir.<br />
                  - Ödeme gecikmeleri durumunda gecikme faizi uygulanabilir.<br />
                  - Ödeme yapılmadığı takdirde sistem limiti otomatik olarak düşürecektir.<br />
                  - Düzenli yapılan ödemelerde müşteri limiti sistem tarafından %20 artırılacaktır.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Madde 4 – Cayma Hakkı ve İade</strong><br />
                  Alıcı, teslimden itibaren 14 gün içerisinde cayma hakkına sahiptir. 
                  Cayma halinde taksitli satış iptal edilir.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Madde 5 – Diğer Hükümler</strong><br />
                  İşbu sözleşme, dijital ortamda onaylandığında yürürlüğe girer ve ıslak imza gerektirmez.
                </Typography>
                <Typography variant="body2" paragraph>
                  Alıcı, tüm şartları okuyup anladığını ve kabul ettiğini beyan eder.
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreements.contract}
                    onChange={() => handleAgreementChange('contract')}
                    color="primary"
                  />
                }
                label="Taksitli Satış Sözleşmesini okudum ve onaylıyorum"
              />
            </Paper>

            {/* Elektronik Onay Metni */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Gavel color="primary" />
                Elektronik Onay Metni
              </Typography>
              <Box sx={{ maxHeight: 150, overflow: 'auto', mb: 2, p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2" paragraph>
                  <strong>Değerli Müşterimiz,</strong>
                </Typography>
                <Typography variant="body2" paragraph>
                  Aşağıda yer alan "Onayla" butonuna tıklamanız halinde:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                  <li>Taksitli satış sözleşmesini dijital olarak kabul etmiş sayılacaksınız.</li>
                  <li>KVKK aydınlatma metnini okuyup onayladığınızı beyan etmiş olacaksınız.</li>
                  <li>Satın alım işleminiz sistem tarafından aktif hale gelecek ve taksitleriniz başlayacaktır.</li>
                  <li>Sözleşme örnekleri e-posta adresinize gönderilecektir.</li>
                </Typography>
                <Typography variant="body2" paragraph>
                  Bu işlem 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun 
                  kapsamında geçerli bir onay olarak kayıt altına alınacaktır.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Saygılarımızla,<br />
                  3 KARE YAZILIM VE TASARIM AJANSI LİMİTED ŞİRKETİ
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreements.electronic}
                    onChange={() => handleAgreementChange('electronic')}
                    color="primary"
                  />
                }
                label="Elektronik onay metnini okudum ve dijital imza yetkisi veriyorum"
              />
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box textAlign="center">
              <Button
                variant="contained"
                size="large"
                onClick={handleCompleteRegistration}
                disabled={loading || !agreements.kvkk || !agreements.contract || !agreements.electronic}
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} /> : 'SÖZLEŞMELERI ONAYLA VE HESABI AKTİFLEŞTİR'}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box textAlign="center" py={4}>
            <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" gutterBottom color="success.main">
              Hesabınız Aktifleştirildi!
            </Typography>
            <Typography variant="h6" paragraph>
              Sayın <strong>{customer?.name}</strong>,
            </Typography>
            <Typography paragraph>
              Tüm sözleşmeler onaylandı ve hesabınız başarıyla aktifleştirildi.
              Artık taksitli alışveriş yapabilir ve müşteri panelinize erişebilirsiniz.
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>Kredi Limitiniz:</strong> {customer?.credit_limit}₺<br />
              <strong>Hesap Durumu:</strong> Aktif
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Giriş sayfasına yönlendiriliyorsunuz...
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading && activeStep === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Email onayınız kontrol ediliyor...
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (error && activeStep === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign="center">
            <Error color="error" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              Email Onayı Başarısız
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/customer-register')}
            >
              Yeniden Kayıt Ol
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center" sx={{ mb: 4 }}>
          Hesap Onayı - Marka World
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </Paper>
    </Container>
  );
};

export default EmailVerification; 