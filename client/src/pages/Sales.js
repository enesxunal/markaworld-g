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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { salesAPI } from '../services/api';

function Sales() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getAll();
      setSales(response.data);
    } catch (error) {
      console.error('Satışlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = sales;

    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    setFilteredSales(filtered);
  };

  const handleDelete = async (sale) => {
    if (sale.status === 'approved') {
      alert('Onaylanmış satış iptal edilemez!');
      return;
    }

    if (window.confirm(`#${sale.id} numaralı satışı iptal etmek istediğinizden emin misiniz?`)) {
      try {
        await salesAPI.cancel(sale.id);
        loadSales();
      } catch (error) {
        console.error('Satış iptal edilemedi:', error);
        alert('Hata: ' + (error.response?.data?.error || 'Satış iptal edilemedi'));
      }
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'pending_approval': { label: 'Onay Bekliyor', color: 'warning' },
      'approved': { label: 'Onaylandı', color: 'success' },
      'cancelled': { label: 'İptal', color: 'error' },
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  const getProgressChip = (paid, total) => {
    const percentage = total > 0 ? (paid / total) * 100 : 0;
    let color = 'default';
    
    if (percentage === 100) color = 'success';
    else if (percentage > 50) color = 'info';
    else if (percentage > 0) color = 'warning';
    
    return (
      <Chip 
        label={`${paid}/${total}`} 
        color={color} 
        size="small" 
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Satışlar</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/sales/new')}
        >
          Yeni Satış
        </Button>
      </Box>

      {/* Arama ve Filtreleme */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Satış ara (müşteri adı, satış ID)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={statusFilter}
                label="Durum"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="pending_approval">Onay Bekliyor</MenuItem>
                <MenuItem value="approved">Onaylandı</MenuItem>
                <MenuItem value="cancelled">İptal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Satış Tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Satış ID</TableCell>
              <TableCell>Müşteri</TableCell>
              <TableCell>Tutar</TableCell>
              <TableCell>Faizli Toplam</TableCell>
              <TableCell>Taksit</TableCell>
              <TableCell>Ödeme Durumu</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Tarih</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>#{sale.id}</TableCell>
                  <TableCell>{sale.customer_name}</TableCell>
                  <TableCell>{parseFloat(sale.total_amount).toLocaleString('tr-TR')}₺</TableCell>
                  <TableCell>{parseFloat(sale.total_with_interest).toLocaleString('tr-TR')}₺</TableCell>
                  <TableCell>{sale.installment_count} Taksit</TableCell>
                  <TableCell>
                    {getProgressChip(sale.paid_installments, sale.total_installments)}
                  </TableCell>
                  <TableCell>{getStatusChip(sale.status)}</TableCell>
                  <TableCell>
                    {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/sales/${sale.id}`)}
                      title="Detay"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {sale.status === 'pending_approval' && (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(sale)}
                        title="İptal Et"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Satış bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Sales; 