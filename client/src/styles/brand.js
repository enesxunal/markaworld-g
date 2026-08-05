/** Marka World — ortak görsel token'lar (siyah-beyaz + krem/gold vurgu) */
export const BRAND = {
  black: '#0A0A0A',
  dark: '#141414',
  white: '#FFFFFF',
  warmWhite: '#F7F5F2',
  warmGray: '#6B6560',
  muted: '#9A9590',
  border: '#E8E4DF',
  borderDark: 'rgba(255,255,255,0.1)',
  accent: '#C9B896',
  accentDark: '#A08B6E',
  accentLight: '#EDE6D8',
  whatsapp: '#25D366',
  success: '#2D6A4F',
  successBg: '#E8F5EE',
  warning: '#8B6914',
  warningBg: '#F5EFE0',
  error: '#8B2E2E',
  errorBg: '#F5E8E8',
  pageMax: 1280,
};

export const pageCardSx = {
  borderRadius: 2,
  border: `1px solid ${BRAND.border}`,
  bgcolor: BRAND.white,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

export const statCardSx = {
  ...pageCardSx,
  transition: 'box-shadow 0.2s ease',
  '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
};

export const tableHeadSx = {
  bgcolor: BRAND.warmWhite,
  fontWeight: 700,
  color: BRAND.black,
  fontSize: '0.8rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${BRAND.border}`,
};

export const filterBarSx = {
  ...pageCardSx,
  p: 2,
  mb: 3,
};

export const primaryButtonSx = {
  bgcolor: BRAND.black,
  color: BRAND.white,
  fontWeight: 600,
  borderRadius: '8px',
  px: 3,
  py: 1.25,
  boxShadow: 'none',
  '&:hover': { bgcolor: '#333', boxShadow: 'none' },
};

export const accentButtonSx = {
  bgcolor: BRAND.accent,
  color: BRAND.black,
  fontWeight: 700,
  borderRadius: '8px',
  px: 3,
  py: 1.25,
  boxShadow: 'none',
  '&:hover': { bgcolor: BRAND.accentDark, boxShadow: 'none' },
};

export const outlineButtonSx = {
  color: BRAND.black,
  borderColor: BRAND.border,
  borderWidth: 1.5,
  fontWeight: 600,
  borderRadius: '8px',
  '&:hover': { borderColor: BRAND.black, borderWidth: 1.5, bgcolor: 'rgba(0,0,0,0.03)' },
};

export const pageTitleSx = {
  fontWeight: 700,
  fontSize: { xs: '1.5rem', md: '1.75rem' },
  color: BRAND.black,
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
};

export const pageSubtitleSx = {
  color: BRAND.warmGray,
  fontSize: { xs: '0.9rem', md: '1rem' },
  mt: 0.5,
};

export const chipPaidSx = { bgcolor: BRAND.successBg, color: BRAND.success, fontWeight: 600, border: 'none' };
export const chipPendingSx = { bgcolor: BRAND.warningBg, color: BRAND.warning, fontWeight: 600, border: 'none' };
export const chipOverdueSx = { bgcolor: BRAND.errorBg, color: BRAND.error, fontWeight: 600, border: 'none' };
export const chipNeutralSx = { bgcolor: BRAND.warmWhite, color: BRAND.black, fontWeight: 600, border: `1px solid ${BRAND.border}` };
