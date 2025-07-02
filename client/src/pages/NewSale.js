import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { customerAPI, salesAPI } from '../services/api';

function NewSale() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    total_amount: '',
    installment_count: 1,
  });
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    
    // Eğer müşteri detay sayfasından gelindiyse, müşteriyi seç
    if (location.state?.selectedCustomer) {
      const customer = location.state.selectedCustomer;
      setSelectedCustomer(customer);
      setFormData(prev => ({ ...prev, customer_id: customer.id }));
    }
  }, [location.state]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll({ status: 'active' });
      setCustomers(response.data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    }
  };

  const calculateInstallments = () => {
    if (!formData.total_amount || !formData.installment_count || !selectedCustomer) {
      return;
    }

    const totalAmount = parseFloat(formData.total_amount);
    const installmentCount = parseInt(formData.installment_count);
    
    // Faiz oranları
    const interestRates = {
      1: 0,  // Faizsiz
      2: 5,  // %5 faiz
      3: 5,  // %5 faiz
      4: 10, // %10 faiz
      5: 10  // %10 faiz
    };
    const interestRate = interestRates[installmentCount] || 0;
    
    const totalWithInterest = totalAmount * (1 + interestRate / 100);
    const installmentAmount = totalWithInterest / installmentCount;
    
    // İlk ödeme tarihi (30 gün sonra)
    const firstPaymentDate = new Date();
    firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);
    
    // Taksit tablosu oluştur
    const installments = [];
    for (let i = 1; i <= installmentCount; i++) {
      const dueDate = new Date(firstPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      
      installments.push({
        number: i,
        amount: installmentAmount,
        dueDate: dueDate.toLocaleDateString('tr-TR'),
      });
    }

    setCalculation({
      totalAmount,
      interestRate,
      totalWithInterest,
      installmentAmount,
      firstPaymentDate: firstPaymentDate.toLocaleDateString('tr-TR'),
      installments,
    });
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !formData.total_amount || !formData.installment_count) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    // Kredi limiti kontrolü
    const availableLimit = selectedCustomer.credit_limit - (selectedCustomer.current_debt || 0);
    if (parseFloat(formData.total_amount) > availableLimit) {
      alert(`Kredi limiti yetersiz! Kullanılabilir limit: ${availableLimit.toLocaleString('tr-TR')}₺`);
      return;
    }

    try {
      setLoading(true);
      const response = await salesAPI.create(formData);
      
      alert('Taksitli satış başarıyla oluşturuldu ve onaylandı! Müşteriye bilgilendirme maili gönderildi.');
      navigate('/admin/sales');
    } catch (error) {
      console.error('Satış oluşturulamadı:', error);
      alert('Hata: ' + (error.response?.data?.error || 'Satış oluşturulamadı'));
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (event, newValue) => {
    setSelectedCustomer(newValue);
    setFormData(prev => ({ 
      ...prev, 
      customer_id: newValue ? newValue.id : '' 
    }));
    setCalculation(null);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/sales')}
          sx={{ mr: 2 }}
        >
          Geri
        </Button>
        <Typography variant="h4">
          Yeni Taksitli Satış
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Satış Formu */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Satış Bilgileri
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => `${option.name} - TC: ${option.tc_no} - Tel: ${option.phone}`}
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ p: 2, minHeight: '80px', width: '100%' }}>
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                            {option.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: '0.85rem' }}>
                            <Typography variant="body2" color="textSecondary">
                              TC: {option.tc_no}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Tel: {option.phone}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Email: {option.email || 'Yok'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Adres: {option.address ? option.address.substring(0, 30) + '...' : 'Yok'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: '0.85rem' }}>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              Kredi: {option.credit_limit.toLocaleString('tr-TR')}₺
                            </Typography>
                            <Typography variant="body2" color="error">
                              Borç: {(option.current_debt || 0).toLocaleString('tr-TR')}₺
                            </Typography>
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              Kullanılabilir: {(option.credit_limit - (option.current_debt || 0)).toLocaleString('tr-TR')}₺
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Müşteri Seçin *"
                        fullWidth
                        placeholder="Müşteri adı, TC kimlik no veya telefon ile arayın..."
                        sx={{
                          minWidth: '800px',
                          width: '100%',
                          '& .MuiInputBase-root': {
                            minHeight: '56px',
                            fontSize: '1rem',
                            padding: '14px 16px'
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '1rem'
                          },
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '4px',
                            '& fieldset': {
                              borderWidth: '1px'
                            }
                          }
                        }}
                      />
                    )}
                    ListboxProps={{
                      style: {
                        maxHeight: '500px',
                        fontSize: '0.95rem'
                      }
                    }}
                    sx={{
                      minWidth: '800px',
                      width: '100%',
                      '& .MuiAutocomplete-option': {
                        minHeight: '80px',
                        padding: '12px 16px',
                        fontSize: '0.95rem'
                      },
                      '& .MuiAutocomplete-listbox': {
                        '& .MuiAutocomplete-option': {
                          borderBottom: '1px solid #e0e0e0',
                          '&:hover': {
                            backgroundColor: '#f5f5f5'
                          }
                        }
                      },
                      '& .MuiAutocomplete-popper': {
                        minWidth: '800px !important'
                      }
                    }}
                  />
                </Grid>
                
                {selectedCustomer && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <strong>Kredi Limiti:</strong> {selectedCustomer.credit_limit.toLocaleString('tr-TR')}₺<br />
                      <strong>Mevcut Borç:</strong> {(selectedCustomer.current_debt || 0).toLocaleString('tr-TR')}₺<br />
                      <strong>Kullanılabilir:</strong> {(selectedCustomer.credit_limit - (selectedCustomer.current_debt || 0)).toLocaleString('tr-TR')}₺
                    </Alert>
                  </Grid>
                )}
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Satış Tutarı *"
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    InputProps={{
                      endAdornment: '₺',
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Taksit Sayısı</InputLabel>
                    <Select
                      value={formData.installment_count}
                      onChange={(e) => {
                        setFormData({ ...formData, installment_count: e.target.value });
                        setCalculation(null);
                      }}
                    >
                      <MenuItem value={1}>1 Taksit (Faizsiz)</MenuItem>
                      <MenuItem value={2}>2 Taksit (%5 Faiz)</MenuItem>
                      <MenuItem value={3}>3 Taksit (%5 Faiz)</MenuItem>
                      <MenuItem value={4}>4 Taksit (%10 Faiz)</MenuItem>
                      <MenuItem value={5}>5 Taksit (%10 Faiz)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CalculateIcon />}
                    onClick={calculateInstallments}
                    disabled={!selectedCustomer || !formData.total_amount || !formData.installment_count}
                  >
                    Taksitleri Hesapla
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Hesaplama Sonuçları */}
        <Grid item xs={12} md={6}>
          {calculation && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hesaplama Sonuçları
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Ana Para
                    </Typography>
                    <Typography variant="h6">
                      {calculation.totalAmount.toLocaleString('tr-TR')}₺
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Faiz Oranı
                    </Typography>
                    <Typography variant="h6">
                      %{calculation.interestRate}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Faizli Toplam
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {calculation.totalWithInterest.toLocaleString('tr-TR')}₺
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Aylık Ödeme
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {calculation.installmentAmount.toLocaleString('tr-TR')}₺
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      İlk Ödeme Tarihi
                    </Typography>
                    <Typography variant="body1">
                      {calculation.firstPaymentDate}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Taksit Tablosu */}
        {calculation && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Taksit Tablosu
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Taksit No</TableCell>
                        <TableCell>Tutar</TableCell>
                        <TableCell>Vade Tarihi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calculation.installments.map((installment) => (
                        <TableRow key={installment.number}>
                          <TableCell>{installment.number}</TableCell>
                          <TableCell>{installment.amount.toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>{installment.dueDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Kaydediliyor...' : 'Satışı Kaydet'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default NewSale; 