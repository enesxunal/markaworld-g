import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { pageTitleSx, pageSubtitleSx } from '../styles/brand';

const PageHeader = ({ title, subtitle, action }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    justifyContent="space-between"
    alignItems={{ xs: 'flex-start', sm: 'center' }}
    spacing={2}
    sx={{ mb: 3 }}
  >
    <Box>
      <Typography component="h1" sx={pageTitleSx}>{title}</Typography>
      {subtitle && <Typography sx={pageSubtitleSx}>{subtitle}</Typography>}
    </Box>
    {action && <Box>{action}</Box>}
  </Stack>
);

export default PageHeader;
