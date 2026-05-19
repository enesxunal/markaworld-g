import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack,
  CircularProgress,
  Chip,
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Send as SendIcon, Refresh as RefreshIcon, People as PeopleIcon } from '@mui/icons-material';
import { adminAPI } from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ color: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ]
};

const isEmptyHtml = (html) => {
  const text = (html || '').replace(/<[^>]*>/g, '').trim();
  return !text;
};

const BulkEmail = () => {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [recipients, setRecipients] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [result, setResult] = useState(null);
  const [listError, setListError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadRecipients = async () => {
    try {
      setListLoading(true);
      setListError('');
      const response = await adminAPI.get('/customers/emails');
      if (response.data.success) {
        const list = response.data.recipients || response.data.emails.map((e) => ({ email: e, name: '' }));
        setRecipients(list);
      } else {
        setListError('Liste alınamadı');
      }
    } catch (error) {
      setListError(error.response?.data?.error || 'Müşteri listesi yüklenemedi');
      setRecipients([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadRecipients();
  }, []);

  const customerEmails = recipients.map((r) => r.email);

  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    setSelectedEmails(checked ? [...customerEmails] : []);
  };

  const toggleEmail = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
    setSelectAll(false);
  };

  const buildRecipientList = () => {
    const customList = customEmails
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    return [...new Set([...selectedEmails.map((e) => e.toLowerCase()), ...customList])];
  };

  const handleSendEmails = async () => {
    const allRecipients = buildRecipientList();

    if (allRecipients.length === 0) {
      setResult({ type: 'error', message: 'En az bir alıcı seçin veya e-posta yazın' });
      return;
    }
    if (!subject.trim() || isEmptyHtml(messageContent)) {
      setResult({ type: 'error', message: 'Konu ve mail içeriği gerekli' });
      return;
    }

    setConfirmOpen(false);
    try {
      setLoading(true);
      setResult(null);

      const response = await adminAPI.post('/send-bulk-email', {
        recipients: allRecipients,
        subject: subject.trim(),
        messageContent
      });

      if (response.data.success) {
        let msg = response.data.message;
        if (response.data.errors?.length) {
          msg += ` (İlk hata: ${response.data.errors[0].email})`;
        }
        setResult({ type: 'success', message: msg });
        setSubject('');
        setMessageContent('');
        setCustomEmails('');
        setSelectedEmails([]);
        setSelectAll(false);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: error.response?.data?.error || 'Mail gönderilemedi — Gmail ayarlarını kontrol edin'
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = buildRecipientList().length;

  return (
    <Box>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Toplu Kampanya Maili
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aktif ve e-postası doğrulanmış müşterilere özel kampanya gönderin
              </Typography>
            </Box>
            <Button startIcon={<RefreshIcon />} onClick={loadRecipients} disabled={listLoading}>
              Listeyi yenile
            </Button>
          </Stack>

          {result && (
            <Alert severity={result.type} sx={{ mb: 2 }} onClose={() => setResult(null)}>
              {result.message}
            </Alert>
          )}

          {listError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {listError}
            </Alert>
          )}

          <Alert severity="info" icon={<PeopleIcon />} sx={{ mb: 3 }}>
            Listede <strong>{recipients.length}</strong> müşteri var (aktif + mail onaylı + listeden çıkmamış).
            {listLoading && ' Yükleniyor...'}
          </Alert>

          <Typography variant="h6" gutterBottom>
            Alıcılar
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={selectAll}
                onChange={handleSelectAll}
                disabled={loading || listLoading || recipients.length === 0}
              />
            }
            label={`Tümünü seç (${recipients.length})`}
          />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, maxHeight: 200, overflow: 'auto', p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
            {recipients.length === 0 && !listLoading && (
              <Typography variant="body2" color="text.secondary">
                Henüz uygun müşteri yok — kayıt tamamlanmış aktif müşteri gerekir
              </Typography>
            )}
            {recipients.map((r) => (
              <Chip
                key={r.email}
                label={r.name ? `${r.name} · ${r.email}` : r.email}
                color={selectedEmails.includes(r.email) ? 'primary' : 'default'}
                variant={selectedEmails.includes(r.email) ? 'filled' : 'outlined'}
                onClick={() => toggleEmail(r.email)}
                disabled={loading}
                size="small"
              />
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <TextField
            label="Ek e-posta adresleri"
            multiline
            rows={2}
            fullWidth
            value={customEmails}
            onChange={(e) => setCustomEmails(e.target.value)}
            disabled={loading}
            helperText="Virgül veya satır ile ayırın"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Mail konusu"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
            required
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Kampanya içeriği
          </Typography>
          <Box sx={{ mb: 3, '& .ql-container': { minHeight: 200 }, '& .ql-editor': { minHeight: 200 } }}>
            <ReactQuill
              value={messageContent}
              onChange={setMessageContent}
              modules={quillModules}
              readOnly={loading}
              theme="snow"
            />
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={() => setConfirmOpen(true)}
            disabled={loading || listLoading}
          >
            {loading ? 'Gönderiliyor...' : `Kampanya Gönder (${pendingCount || selectedEmails.length} alıcı)`}
          </Button>
        </Paper>
      </Stack>

      <Dialog open={confirmOpen} onClose={() => !loading && setConfirmOpen(false)}>
        <DialogTitle>Mail gönderilsin mi?</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{buildRecipientList().length}</strong> kişiye &quot;{subject}&quot; konulu mail gidecek. Onaylıyor musunuz?
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Çok sayıda alıcıda gönderim birkaç dakika sürebilir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>İptal</Button>
          <Button variant="contained" onClick={handleSendEmails} disabled={loading}>
            Gönder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkEmail;
