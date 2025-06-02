import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { customerAPI } from '../services/api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    tc_no: '',
    phone: '',
    email: '',
    birth_date: '',
    address: '',
    credit_limit: 5000,
    status: 'active'
  });
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, statusFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.tc_no.includes(searchTerm) ||
        customer.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        tc_no: customer.tc_no,
        phone: customer.phone,
        email: customer.email || '',
        birth_date: customer.birth_date || '',
        address: customer.address || '',
        credit_limit: customer.credit_limit,
        status: customer.status
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: '',
        tc_no: '',
        phone: '',
        email: '',
        birth_date: '',
        address: '',
        credit_limit: 5000,
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedCustomer) {
        await customerAPI.update(selectedCustomer.id, formData);
      } else {
        await customerAPI.create(formData);
      }
      handleCloseDialog();
      loadCustomers();
    } catch (error) {
      console.error('Müşteri kaydedilemedi:', error);
      alert('Hata: ' + (error.response?.data?.error || 'Müşteri kaydedilemedi'));
    }
  };

  const handleDelete = async (customer) => {
    if (window.confirm(`${customer.name} adlı müşteriyi silmek istediğinizden emin misiniz?`)) {
      try {
        await customerAPI.delete(customer.id);
        loadCustomers();
      } catch (error) {
        console.error('Müşteri silinemedi:', error);
        alert('Hata: ' + (error.response?.data?.error || 'Müşteri silinemedi'));
      }
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'active': { label: 'Aktif', color: 'success' },
      'passive': { label: 'Pasif', color: 'default' },
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  const handleCardExpand = (customerId) => {
    setExpandedCard(expandedCard === customerId ? null : customerId);
  };

  const renderMobileCard = (customer) => (
    <Card key={customer.id} sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                {customer.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                TC: {customer.tc_no}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {getStatusChip(customer.status)}
              <IconButton 
                size="small" 
                onClick={() => handleCardExpand(customer.id)}
                sx={{ p: 0.5 }}
              >
                {expandedCard === customer.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </Stack>

          {/* Quick Info */}
          <Stack direction="row" spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Telefon
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {customer.phone}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Kredi Limiti
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                {parseFloat(customer.credit_limit).toLocaleString('tr-TR')}₺
              </Typography>
            </Box>
          </Stack>

          {/* Expanded Content */}
          <Collapse in={expandedCard === customer.id}>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={1}>
              {customer.email && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {customer.email}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Mevcut Borç
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {parseFloat(customer.current_debt || 0).toLocaleString('tr-TR')}₺
                </Typography>
              </Box>
              
              {/* Action Buttons */}
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/admin/customers/${customer.id}`)}
                  sx={{ backgroundColor: 'primary.main', color: 'white', '&:hover': { backgroundColor: 'primary.dark' } }}
                >
                  <VisibilityIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(customer)}
                  sx={{ backgroundColor: 'warning.main', color: 'white', '&:hover': { backgroundColor: 'warning.dark' } }}
                >
                  <EditIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(customer)}
                  sx={{ backgroundColor: 'error.main', color: 'white', '&:hover': { backgroundColor: 'error.dark' } }}
                >
                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Stack>
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 0 }}>
      {/* Header */}
      <Stack 
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between" 
        alignItems={isMobile ? "stretch" : "center"}
        spacing={isMobile ? 2 : 0}
        mb={3}
      >
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
          Müşteriler ({filteredCustomers.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size={isMobile ? "medium" : "large"}
          sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}
        >
          Yeni Müşteri
        </Button>
      </Stack>

      {/* Arama ve Filtreleme */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 2 }}>
        <Grid container spacing={isMobile ? 1.5 : 2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Müşteri ara (ad, TC, telefon)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size={isMobile ? "small" : "medium"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: isMobile ? '1rem' : '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: isMobile ? '0.8rem' : '0.9rem'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Durum</InputLabel>
              <Select
                value={statusFilter}
                label="Durum"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="passive">Pasif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Müşteri Listesi */}
      {isMobile ? (
        // Mobil Card Görünümü
        <Box>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(renderMobileCard)
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Müşteri bulunamadı
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        // Masaüstü Tablo Görünümü
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Ad Soyad</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>TC Kimlik No</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Telefon</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kredi Limiti</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mevcut Borç</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.tc_no}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{parseFloat(customer.credit_limit).toLocaleString('tr-TR')}₺</TableCell>
                    <TableCell>{parseFloat(customer.current_debt || 0).toLocaleString('tr-TR')}₺</TableCell>
                    <TableCell>{getStatusChip(customer.status)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/customers/${customer.id}`)}
                        title="Detay"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(customer)}
                        title="Düzenle"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(customer)}
                        title="Sil"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Müşteri bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Müşteri Ekleme/Düzenleme Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
          {selectedCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 2 : 3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="TC Kimlik No"
                value={formData.tc_no}
                onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
                inputProps={{ maxLength: 11 }}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Doğum Tarihi"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kredi Limiti"
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) })}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adres"
                multiline
                rows={isMobile ? 2 : 3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }
                }}
              />
            </Grid>
            {selectedCustomer && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Durum</InputLabel>
                  <Select
                    value={formData.status}
                    label="Durum"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}
                  >
                    <MenuItem value="active">Aktif</MenuItem>
                    <MenuItem value="passive">Pasif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            size={isMobile ? "medium" : "large"}
            sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            size={isMobile ? "medium" : "large"}
            sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}
          >
            {selectedCustomer ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Customers; 