/**
 * Marka World public SEO / NAP constants.
 * Only verified business facts from the public homepage and live site.
 */

export const SITE_ORIGIN = 'https://www.markaworld.com.tr';

export const SITE_NAME = 'Marka World';

export const BUSINESS = {
  name: 'Marka World',
  legalName: 'Marka World',
  telephoneDisplay: '(0356) 502 78 99',
  telephoneE164: '+903565027899',
  email: 'info@markaworld.com.tr',
  streetAddress: 'Karşıyaka, Vali Ayhan Çevik Cd. 46/A',
  addressLocality: 'Tokat',
  addressRegion: 'Tokat',
  postalCode: '60000',
  addressCountry: 'TR',
  // From homepage Google Maps embed (Marka World Tokat place)
  geo: {
    latitude: 40.34522967145135,
    longitude: 36.538942076860806,
  },
  sameAs: [
    'https://www.instagram.com/markaworldtokat',
    'https://g.co/kgs/mLGTxNA',
  ],
  whatsappUrl: 'https://wa.me/905368324660',
  logoPath: '/logo.png',
};

export const DEFAULT_OG = {
  type: 'website',
  locale: 'tr_TR',
  siteName: SITE_NAME,
  // Dedicated 1200×630 share image not available in repo; omit og:image until approved asset exists.
};

export function absoluteUrl(path = '/') {
  if (!path || path === '/') return `${SITE_ORIGIN}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

export const PUBLIC_INDEXABLE_PATHS = [
  '/',
  '/blog',
  '/privacy-policy',
  '/terms',
  '/kvkk',
];

export const SEO_PAGES = {
  home: {
    path: '/',
    title: 'Marka World | Tokat’ta Taksitli Marka Alışverişi',
    description:
      'Tokat’taki Marka World mağazasında marka ürünlerini inceleyin, taksitli alışveriş seçenekleri hakkında bilgi alın ve ödemelerinizi müşteri panelinden takip edin.',
    robots: 'index, follow',
  },
  blog: {
    path: '/blog',
    title: 'Blog | Marka World Tokat',
    description:
      'Tokat’ta mağazadan alışveriş, kadın–erkek–çocuk giyim ve taksitli ödeme planı hakkında Marka World blog yazıları.',
    robots: 'index, follow',
  },
  blogNotFound: {
    path: null,
    title: 'Yazı Bulunamadı | Marka World Blog',
    description: 'Aradığınız blog yazısı bulunamadı. Marka World blog veya anasayfaya dönebilirsiniz.',
    robots: 'noindex, follow',
  },
  privacy: {
    path: '/privacy-policy',
    title: 'Gizlilik Politikası | Marka World',
    description:
      'Marka World gizlilik politikası: kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgilendirme.',
    robots: 'index, follow',
  },
  terms: {
    path: '/terms',
    title: 'Kullanım Koşulları | Marka World',
    description:
      'Marka World platformu kullanım koşulları: hizmet kullanımı, ödeme, fikri mülkiyet ve sorumluluk bilgileri.',
    robots: 'index, follow',
  },
  kvkk: {
    path: '/kvkk',
    title: 'KVKK Aydınlatma Metni | Marka World',
    description:
      '6698 sayılı KVKK kapsamında Marka World kişisel veri işleme amaçları, aktarımı ve veri sahibi hakları hakkında aydınlatma metni.',
    robots: 'index, follow',
  },
  notFound: {
    path: null,
    title: 'Sayfa Bulunamadı | Marka World',
    description: 'Aradığınız sayfa bulunamadı. Marka World anasayfasına dönebilirsiniz.',
    robots: 'noindex, follow',
  },
  adminLogin: {
    path: '/admin/login',
    title: 'Yönetici Girişi | Marka World',
    description: 'Marka World yönetici paneli girişi.',
    robots: 'noindex, nofollow',
  },
  customerLogin: {
    path: '/customer-login',
    title: 'Müşteri Girişi | Marka World',
    description: 'Marka World müşteri paneli girişi.',
    robots: 'noindex, nofollow',
  },
  customerRegister: {
    path: '/register',
    title: 'Müşteri Kaydı | Marka World',
    description: 'Marka World müşteri kayıt sayfası.',
    robots: 'noindex, nofollow',
  },
  emailVerification: {
    path: null,
    title: 'Doğrulama | Marka World',
    description: 'Marka World hesap veya sözleşme doğrulama sayfası.',
    robots: 'noindex, nofollow',
  },
  unsubscribe: {
    path: '/unsubscribe',
    title: 'Abonelikten Çık | Marka World',
    description: 'Marka World e-posta bülteni aboneliğinden çıkış.',
    robots: 'noindex, nofollow',
  },
  adminApp: {
    path: null,
    title: 'Yönetici Paneli | Marka World',
    description: 'Marka World yönetici paneli.',
    robots: 'noindex, nofollow',
  },
  customerApp: {
    path: null,
    title: 'Müşteri Paneli | Marka World',
    description: 'Marka World müşteri paneli.',
    robots: 'noindex, nofollow',
  },
};

export function buildHomeJsonLd() {
  const logoUrl = absoluteUrl(BUSINESS.logoPath);
  const websiteId = `${SITE_ORIGIN}/#website`;
  const storeId = `${SITE_ORIGIN}/#store`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: SITE_NAME,
        url: `${SITE_ORIGIN}/`,
        publisher: { '@id': storeId },
        inLanguage: 'tr-TR',
      },
      {
        '@type': 'Store',
        '@id': storeId,
        name: BUSINESS.name,
        url: `${SITE_ORIGIN}/`,
        logo: logoUrl,
        image: logoUrl,
        telephone: BUSINESS.telephoneE164,
        email: BUSINESS.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: BUSINESS.streetAddress,
          addressLocality: BUSINESS.addressLocality,
          addressRegion: BUSINESS.addressRegion,
          postalCode: BUSINESS.postalCode,
          addressCountry: BUSINESS.addressCountry,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: BUSINESS.geo.latitude,
          longitude: BUSINESS.geo.longitude,
        },
        sameAs: BUSINESS.sameAs,
        currenciesAccepted: 'TRY',
      },
    ],
  };
}

/**
 * BlogPosting + BreadcrumbList (+ optional FAQPage when visible FAQ exists).
 * No image field unless a real public asset path is provided on the post.
 */
export function buildBlogPostingJsonLd(post) {
  if (!post) return null;
  const path = `/blog/${post.slug}`;
  const pageUrl = absoluteUrl(path);
  const logoUrl = absoluteUrl(BUSINESS.logoPath);
  const dateModified =
    post.updatedAt && post.updatedAt !== post.publishedAt ? post.updatedAt : undefined;

  const blogPosting = {
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author || 'Marka World İçerik Ekibi',
    },
    publisher: {
      '@type': 'Organization',
      name: BUSINESS.name,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    inLanguage: 'tr-TR',
  };

  if (dateModified) {
    blogPosting.dateModified = dateModified;
  }

  if (post.heroImage) {
    blogPosting.image = absoluteUrl(post.heroImage);
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Anasayfa',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: absoluteUrl('/blog'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: pageUrl,
      },
    ],
  };

  const graph = [blogPosting, breadcrumb];

  if (post.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: post.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
