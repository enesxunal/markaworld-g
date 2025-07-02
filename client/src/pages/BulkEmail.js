import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Divider
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { adminAPI } from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BulkEmail = () => {
  const [loading, setLoading] = useState(false);
  const [customerEmails, setCustomerEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [result, setResult] = useState(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link'
  ];

  // Müşteri emaillerini yükle
  useEffect(() => {
    const loadCustomerEmails = async () => {
      try {
        const response = await adminAPI.get('/customers/emails');
        if (response.data.success) {
          setCustomerEmails(response.data.emails);
        }
      } catch (error) {
        console.error('Email listesi yükleme hatası:', error);
      }
    };

    loadCustomerEmails();
  }, []);

  // Tümünü seç/kaldır
  const handleSelectAll = (event) => {
    setSelectAll(event.target.checked);
    if (event.target.checked) {
      setSelectedEmails(customerEmails);
    } else {
      setSelectedEmails([]);
    }
  };

  // Özel email listesini işle
  const handleCustomEmailsChange = (event) => {
    setCustomEmails(event.target.value);
  };

  // Mail gönder
  const handleSendEmails = async () => {
    try {
      setLoading(true);
      setResult(null);

      // Özel emailleri işle
      const customEmailList = customEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

      // Tüm alıcıları birleştir
      const allRecipients = [...new Set([...selectedEmails, ...customEmailList])];

      if (allRecipients.length === 0) {
        setResult({
          type: 'error',
          message: 'En az bir alıcı seçmelisiniz'
        });
        return;
      }

      if (!subject || !messageContent) {
        setResult({
          type: 'error',
          message: 'Konu ve mesaj içeriği gerekli'
        });
        return;
      }

      const response = await adminAPI.post('/send-bulk-email', {
        recipients: allRecipients,
        subject,
        messageContent
      });

      if (response.data.success) {
        setResult({
          type: 'success',
          message: response.data.message
        });
        // Formu temizle
        setSubject('');
        setMessageContent('');
        setCustomEmails('');
        setSelectedEmails([]);
        setSelectAll(false);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Mail gönderimi sırasında bir hata oluştu'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h4" gutterBottom>
              Toplu Mail Gönderimi
            </Typography>

            {result && (
              <Alert severity={result.type} onClose={() => setResult(null)}>
                {result.message}
              </Alert>
            )}

            <Typography variant="h6">
              Alıcılar
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                  disabled={loading}
                />
              }
              label={`Tüm Müşteriler (${customerEmails.length})`}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {customerEmails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  color={selectedEmails.includes(email) ? "primary" : "default"}
                  onClick={() => {
                    if (selectedEmails.includes(email)) {
                      setSelectedEmails(selectedEmails.filter(e => e !== email));
                    } else {
                      setSelectedEmails([...selectedEmails, email]);
                    }
                  }}
                  disabled={loading}
                />
              ))}
            </Box>

            <Divider />

            <TextField
              label="Özel Email Adresleri (virgülle ayırın)"
              multiline
              rows={2}
              value={customEmails}
              onChange={handleCustomEmailsChange}
              disabled={loading}
              helperText="Örnek: ornek1@mail.com, ornek2@mail.com"
            />

            <TextField
              label="Mail Konusu"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
              required
            />

            <Typography variant="subtitle2" gutterBottom>
              Mail İçeriği
            </Typography>

            <Box sx={{ 
              '.ql-container': {
                minHeight: '200px',
                fontSize: '1rem',
                fontFamily: theme => theme.typography.fontFamily
              },
              '.ql-editor': {
                minHeight: '200px'
              },
              '.ql-toolbar': {
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px'
              },
              '.ql-container': {
                borderBottomLeftRadius: '4px',
                borderBottomRightRadius: '4px'
              },
              marginBottom: '50px'
            }}>
              <ReactQuill
                value={messageContent}
                onChange={setMessageContent}
                modules={modules}
                formats={formats}
                readOnly={loading}
                theme="snow"
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              onClick={handleSendEmails}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? 'Gönderiliyor...' : 'Toplu Mail Gönder'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default BulkEmail; 