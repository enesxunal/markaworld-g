import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { BRAND } from '../../styles/brand';
import { formatBlogDate, getCategoryLabel, getPostPath } from '../../content/blogPosts';

function BlogCard({ post, headingLevel = 'h2' }) {
  if (!post) return null;
  const HeadingTag = headingLevel === 'h3' ? 'h3' : 'h2';

  return (
    <Box
      component="article"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 2,
        p: { xs: 2.5, md: 3 },
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: BRAND.accentDark,
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        <Chip
          size="small"
          label={getCategoryLabel(post.category)}
          sx={{
            bgcolor: BRAND.accentLight,
            color: BRAND.black,
            fontWeight: 600,
            borderRadius: 1,
          }}
        />
        <Typography variant="caption" sx={{ color: BRAND.warmGray }}>
          {formatBlogDate(post.publishedAt)}
        </Typography>
      </Stack>

      <Typography
        component={HeadingTag}
        sx={{
          fontSize: { xs: '1.15rem', md: '1.25rem' },
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.35,
          mb: 1.25,
        }}
      >
        <Box
          component={RouterLink}
          to={getPostPath(post.slug)}
          sx={{
            color: BRAND.black,
            textDecoration: 'none',
            '&:hover': { color: BRAND.accentDark },
          }}
        >
          {post.title}
        </Box>
      </Typography>

      <Typography sx={{ color: BRAND.warmGray, fontSize: '0.95rem', lineHeight: 1.7, flexGrow: 1, mb: 2 }}>
        {post.excerpt}
      </Typography>

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: BRAND.muted }}>
          <AccessTimeIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">{post.readingTime} dk okuma</Typography>
        </Stack>
        <Typography
          component={RouterLink}
          to={getPostPath(post.slug)}
          sx={{
            color: BRAND.black,
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            borderBottom: `1px solid ${BRAND.accent}`,
            '&:hover': { color: BRAND.accentDark },
          }}
        >
          Yazıyı oku
        </Typography>
      </Stack>
    </Box>
  );
}

export default BlogCard;
