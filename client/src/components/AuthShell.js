import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { BRAND } from '../styles/brand';

/**
 * Login / register ekranları için ortak sade auth layout
 */
const AuthShell = ({ title, subtitle, children, dark = false }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: BRAND.warmWhite,
      py: { xs: 3, md: 6 },
      px: 2,
    }}
  >
    <Container maxWidth="sm">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 2,
          border: `1px solid ${BRAND.border}`,
          bgcolor: BRAND.white,
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        <Box textAlign="center" mb={{ xs: 3, md: 4 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Marka World"
            sx={{
              height: { xs: 48, md: 56 },
              width: 'auto',
              mb: 2,
              filter: dark ? 'brightness(0) invert(1)' : 'none',
            }}
          />
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              color: BRAND.black,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ mt: 1, color: BRAND.warmGray, fontSize: '0.95rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {children}
      </Paper>
    </Container>
  </Box>
);

export default AuthShell;
