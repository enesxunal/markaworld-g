import React from 'react';
import { Box, Container } from '@mui/material';
import PublicLayout from '../PublicLayout';
import { BRAND } from '../../styles/brand';

/**
 * Shared shell for blog list/detail pages.
 */
function BlogLayout({ children, maxWidth = 'lg' }) {
  return (
    <PublicLayout>
      <Box
        component="main"
        sx={{
          bgcolor: BRAND.warmWhite,
          minHeight: '70vh',
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth={maxWidth}>{children}</Container>
      </Box>
    </PublicLayout>
  );
}

export default BlogLayout;
