import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Stack,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  RestoreFromTrash as RestoreIcon,
  Delete as DeleteIcon,
  Backup as BackupIcon
} from '@mui/icons-material';
import { adminAPI } from '../services/api';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoreDialog, setRestoreDialog] = useState({ open: false, backup: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, backup: null });
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  // Yedekleri yükle
  const loadBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.get('/backups');
      if (response.data.success) {
        setBackups(response.data.backups);
      } else {
        setError('Yedekler yüklenirken bir hata oluştu');
      }
    } catch (error) {
      setError('Yedekler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // Manuel yedek al
  const handleCreateBackup = async () => {
    try {
      setActionInProgress(true);
      setActionResult(null);
      const response = await adminAPI.post('/backups');
      if (response.data.success) {
        setActionResult({ type: 'success', message: 'Yedek başarıyla oluşturuldu' });
        loadBackups();
      } else {
        setActionResult({ type: 'error', message: 'Yedek oluşturulurken bir hata oluştu' });
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Yedek oluşturulurken bir hata oluştu: ' + error.message });
    } finally {
      setActionInProgress(false);
    }
  };

  // Yedeği geri yükle
  const handleRestore = async () => {
    try {
      setActionInProgress(true);
      setActionResult(null);
      const response = await adminAPI.post(`/backups/restore/${restoreDialog.backup.filename}`);
      if (response.data.success) {
        setActionResult({ type: 'success', message: 'Yedek başarıyla geri yüklendi' });
      } else {
        setActionResult({ type: 'error', message: 'Yedek geri yüklenirken bir hata oluştu' });
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Yedek geri yüklenirken bir hata oluştu: ' + error.message });
    } finally {
      setActionInProgress(false);
      setRestoreDialog({ open: false, backup: null });
    }
  };

  // Yedeği sil
  const handleDelete = async () => {
    try {
      setActionInProgress(true);
      setActionResult(null);
      const response = await adminAPI.delete(`/backups/${deleteDialog.backup.filename}`);
      if (response.data.success) {
        setActionResult({ type: 'success', message: 'Yedek başarıyla silindi' });
        loadBackups();
      } else {
        setActionResult({ type: 'error', message: 'Yedek silinirken bir hata oluştu' });
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Yedek silinirken bir hata oluştu: ' + error.message });
    } finally {
      setActionInProgress(false);
      setDeleteDialog({ open: false, backup: null });
    }
  };

  // Yedeği indir
  const handleDownload = (backup) => {
    window.open(`${process.env.REACT_APP_API_URL}/admin/backups/download/${backup.filename}`);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" gutterBottom>
            Yedek Yönetimi
          </Typography>
          <Tooltip title="Sistemin anlık yedeğini al" arrow>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={handleCreateBackup}
              disabled={actionInProgress}
            >
              Yeni Yedek Al
            </Button>
          </Tooltip>
        </Stack>

        {actionResult && (
          <Alert severity={actionResult.type} onClose={() => setActionResult(null)}>
            {actionResult.message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Dosya Adı</TableCell>
                  <TableCell>Boyut</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.filename}>
                    <TableCell>{backup.date}</TableCell>
                    <TableCell>
                      <Tooltip title="Dosyayı indirmek için tıklayın" arrow>
                        <Typography
                          component="span"
                          sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => handleDownload(backup)}
                        >
                          {backup.filename}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Yedeği bilgisayarınıza indirin" arrow>
                        <IconButton
                          color="primary"
                          onClick={() => handleDownload(backup)}
                          disabled={actionInProgress}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Yedeği Geri Yükle" arrow>
                        <IconButton
                          color="warning"
                          onClick={() => setRestoreDialog({ open: true, backup })}
                          disabled={actionInProgress}
                        >
                          <RestoreIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Yedeği Sil" arrow>
                        <IconButton
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, backup })}
                          disabled={actionInProgress}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {backups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Henüz yedek bulunmuyor
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>

      {/* Geri yükleme onay dialogu */}
      <Dialog open={restoreDialog.open} onClose={() => setRestoreDialog({ open: false, backup: null })}>
        <DialogTitle>Yedeği Geri Yükle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu işlem mevcut verilerin üzerine yazacak ve geri alınamaz. Devam etmek istediğinize emin misiniz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog({ open: false, backup: null })} disabled={actionInProgress}>
            İptal
          </Button>
          <Button onClick={handleRestore} color="warning" disabled={actionInProgress}>
            Geri Yükle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme onay dialogu */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, backup: null })}>
        <DialogTitle>Yedeği Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu yedek kalıcı olarak silinecek. Devam etmek istediğinize emin misiniz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, backup: null })} disabled={actionInProgress}>
            İptal
          </Button>
          <Button onClick={handleDelete} color="error" disabled={actionInProgress}>
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Backups; 