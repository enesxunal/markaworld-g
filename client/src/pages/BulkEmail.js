import React, { useState, useEffect, useMemo } from 'react';
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
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Code as CodeIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { adminAPI } from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const FRONTEND_URL = 'https://markaworld.com.tr';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ]
};

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden">
          <tr>
            <td style="background:#000;padding:32px;text-align:center">
              <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:2px">MARKA WORLD</h1>
              <p style="margin:12px 0 0;color:#ccc;font-size:14px">Özel Kampanya</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#222;line-height:1.7">
              <h2 style="margin:0 0 16px;color:#000">Merhaba!</h2>
              <p style="margin:0 0 16px">Size özel kampanyamızı kaçırmayın.</p>
              <p style="text-align:center;margin:32px 0">
                <a href="https://markaworld.com.tr" style="background:#000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">
                  Kampanyayı İncele
                </a>
              </p>
              <p style="margin:0;color:#666;font-size:14px">Sorularınız için bize ulaşabilirsiniz.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:20px;text-align:center;font-size:12px;color:#888">
              © Marka World
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const isEmptyHtml = (html) => {
  const text = (html || '').replace(/<[^>]*>/g, '').trim();
  return !text;
};

function footerPreview(email = 'ornek@mail.com') {
  const unsub = `${FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<div style="padding:16px 24px;border-top:1px solid #eee;background:#fafafa;font-size:12px;color:#666;text-align:center">
Marka World kampanya — <a href="${unsub}">listeden çıkın</a></div>`;
}

function buildPreviewHtml(content, { useFullHtml, useWrapper, appendUnsubscribe }) {
  const sampleEmail = 'ornek@mail.com';
  let html = content;

  if (useFullHtml) {
    if (appendUnsubscribe && !/unsubscribe/i.test(html)) {
      html += footerPreview(sampleEmail);
    }
    return html;
  }

  if (useWrapper) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:8px">
<div style="background:#000;padding:24px;text-align:center"><p style="margin:0;color:#fff;font-size:20px;font-weight:bold">MARKA WORLD</p></div>
<div style="padding:28px 24px;color:#111">${html}</div>
${appendUnsubscribe ? footerPreview(sampleEmail) : ''}
</div>`;
  }

  if (appendUnsubscribe && !/unsubscribe/i.test(html)) {
    html += footerPreview(sampleEmail);
  }
  return html;
}

const BulkEmail = () => {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [recipients, setRecipients] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [contentTab, setContentTab] = useState(0);
  const [useFullHtml, setUseFullHtml] = useState(false);
  const [useWrapper, setUseWrapper] = useState(true);
  const [appendUnsubscribe, setAppendUnsubscribe] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [result, setResult] = useState(null);
  const [listError, setListError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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
  const activeContent = contentTab === 1 ? htmlCode : editorContent;

  const previewHtml = useMemo(
    () => buildPreviewHtml(activeContent, { useFullHtml, useWrapper: useFullHtml ? false : useWrapper, appendUnsubscribe }),
    [activeContent, useFullHtml, useWrapper, appendUnsubscribe]
  );

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

  const openConfirm = () => {
    const allRecipients = buildRecipientList();
    if (allRecipients.length === 0) {
      setResult({ type: 'error', message: 'En az bir alıcı seçin' });
      return;
    }
    if (!subject.trim() || isEmptyHtml(activeContent)) {
      setResult({ type: 'error', message: 'Konu ve içerik gerekli' });
      return;
    }
    setConfirmOpen(true);
  };

  const handleSendEmails = async () => {
    const allRecipients = buildRecipientList();
    setConfirmOpen(false);

    try {
      setLoading(true);
      setResult(null);

      const response = await adminAPI.post('/send-bulk-email', {
        recipients: allRecipients,
        subject: subject.trim(),
        messageContent: activeContent,
        useFullHtml,
        useWrapper: useFullHtml ? false : useWrapper,
        appendUnsubscribe
      });

      if (response.data.success) {
        let msg = response.data.message;
        if (response.data.errors?.length) {
          msg += ` (İlk hata: ${response.data.errors[0].email})`;
        }
        setResult({ type: 'success', message: msg });
        setSubject('');
        setEditorContent('');
        setHtmlCode('');
        setCustomEmails('');
        setSelectedEmails([]);
        setSelectAll(false);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: error.response?.data?.error || 'Mail gönderilemedi'
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
                Görsel editör veya HTML kodu ile profesyonel kampanya mailleri gönderin
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
          {listError && <Alert severity="warning" sx={{ mb: 2 }}>{listError}</Alert>}

          <Alert severity="info" icon={<PeopleIcon />} sx={{ mb: 2 }}>
            <strong>{recipients.length}</strong> kayıtlı müşteri (aktif + mail onaylı)
          </Alert>

          <Typography variant="h6" gutterBottom>Alıcılar</Typography>
          <FormControlLabel
            control={<Checkbox checked={selectAll} onChange={handleSelectAll} disabled={loading || recipients.length === 0} />}
            label={`Tümünü seç (${recipients.length})`}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, maxHeight: 160, overflow: 'auto', p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
            {recipients.map((r) => (
              <Chip
                key={r.email}
                label={r.name ? `${r.name}` : r.email}
                title={r.email}
                color={selectedEmails.includes(r.email) ? 'primary' : 'default'}
                variant={selectedEmails.includes(r.email) ? 'filled' : 'outlined'}
                onClick={() => toggleEmail(r.email)}
                disabled={loading}
                size="small"
              />
            ))}
          </Box>

          <TextField
            label="Ek e-posta (virgül / satır)"
            multiline
            rows={2}
            fullWidth
            value={customEmails}
            onChange={(e) => setCustomEmails(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Mail konusu"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={1}>
            <Typography variant="h6">İçerik</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)} disabled={isEmptyHtml(activeContent)}>
                Önizleme
              </Button>
              {contentTab === 1 && (
                <Button size="small" onClick={() => setHtmlCode(SAMPLE_HTML)}>
                  Örnek şablon yükle
                </Button>
              )}
            </Stack>
          </Stack>

          <Tabs value={contentTab} onChange={(_, v) => setContentTab(v)} sx={{ mb: 2 }}>
            <Tab icon={<EditIcon />} iconPosition="start" label="Görsel editör" />
            <Tab icon={<CodeIcon />} iconPosition="start" label="HTML kod" />
          </Tabs>

          {contentTab === 0 ? (
            <Box sx={{ mb: 2, '& .ql-container': { minHeight: 220 }, '& .ql-editor': { minHeight: 220 } }}>
              <ReactQuill value={editorContent} onChange={setEditorContent} modules={quillModules} readOnly={loading} theme="snow" />
            </Box>
          ) : (
            <TextField
              multiline
              fullWidth
              minRows={14}
              maxRows={24}
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="<html>...</html> veya <table> ile e-posta şablonu yapıştırın"
              disabled={loading}
              sx={{
                mb: 2,
                '& textarea': { fontFamily: 'Monaco, Menlo, Consolas, monospace', fontSize: '0.8rem', lineHeight: 1.5 }
              }}
            />
          )}

          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
            <Typography variant="subtitle2" gutterBottom>Gönderim ayarları</Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={<Checkbox checked={useFullHtml} onChange={(e) => setUseFullHtml(e.target.checked)} />}
                label="Tam HTML gönder (kendi tasarımım — Marka World kutusu eklenmez)"
              />
              {!useFullHtml && (
                <FormControlLabel
                  control={<Checkbox checked={useWrapper} onChange={(e) => setUseWrapper(e.target.checked)} />}
                  label="Marka World üst şeridi ekle (siyah başlık + içerik)"
                />
              )}
              <FormControlLabel
                control={<Checkbox checked={appendUnsubscribe} onChange={(e) => setAppendUnsubscribe(e.target.checked)} />}
                label="Alta 'listeden çık' linki ekle (önerilir)"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              HTML sekmesinde table tabanlı şablonlar Gmail/Outlook’ta en iyi görünür.
            </Typography>
          </Paper>

          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={openConfirm}
            disabled={loading || listLoading}
          >
            {loading ? 'Gönderiliyor...' : `Kampanya Gönder (${pendingCount} alıcı)`}
          </Button>
        </Paper>
      </Stack>

      <Dialog open={confirmOpen} onClose={() => !loading && setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mail gönderilsin mi?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            <strong>{buildRecipientList().length}</strong> kişiye gönderilecek: <em>{subject}</em>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mod: {contentTab === 1 ? 'HTML kod' : 'Görsel editör'}
            {useFullHtml ? ' · Tam HTML' : useWrapper ? ' · Marka World şeridi' : ' · Sadece içerik'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>İptal</Button>
          <Button variant="contained" onClick={handleSendEmails} disabled={loading}>Gönder</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Mail önizleme</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: '#f4f4f4',
              minHeight: 400
            }}
          >
            <iframe
              title="mail-onizleme"
              srcDoc={previewHtml}
              style={{ width: '100%', height: 480, border: 'none', background: '#fff' }}
              sandbox=""
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkEmail;
