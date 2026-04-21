import { groq } from "next-sanity";

// ── Site Settings (singleton) ──────────────────────────────────────
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    orgName,
    orgNameEn,
    registrationNumber,
    phone,
    email,
    whatsappNumber,
    address,
    socialLinks,
    statsVolunteers,
    statsCallsPerYear,
    statsYearsActive,
    accessibilityCoordinator,
    accessibilityCoordinatorEmail,
    accessibilityCoordinatorPhone
  }
`;

// ── Page by slug ───────────────────────────────────────────────────
export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0]{
    title,
    titleEn,
    "slug": slug.current,
    body,
    bodyEn,
    heroImage,
    seoDescription,
    seoDescriptionEn
  }
`;

// ── News Articles ──────────────────────────────────────────────────
export const newsArticlesQuery = groq`
  *[_type == "newsArticle"] | order(publishedAt desc) [$start...$end]{
    _id,
    title,
    titleEn,
    "slug": slug.current,
    publishedAt,
    mainImage,
    excerpt
  }
`;

export const latestNewsQuery = groq`
  *[_type == "newsArticle"] | order(publishedAt desc) [0...3]{
    _id,
    title,
    titleEn,
    "slug": slug.current,
    publishedAt,
    mainImage,
    excerpt
  }
`;

export const tickerNewsQuery = groq`
  *[_type == "newsArticle"] | order(publishedAt desc) [0...7]{
    title,
    titleEn,
    "slug": slug.current
  }
`;

export const newsArticleBySlugQuery = groq`
  *[_type == "newsArticle" && slug.current == $slug][0]{
    _id,
    _updatedAt,
    title,
    titleEn,
    "slug": slug.current,
    publishedAt,
    mainImage,
    gallery,
    excerpt,
    body,
    bodyEn
  }
`;

export const newsArticlesSlugsQuery = groq`
  *[_type == "newsArticle" && defined(slug.current)]{
    "slug": slug.current
  }
`;

// ── Field Stories ──────────────────────────────────────────────────
export const fieldStoriesQuery = groq`
  *[_type == "fieldStory"] | order(publishedAt desc){
    _id,
    title,
    titleEn,
    "slug": slug.current,
    publishedAt,
    mainImage,
    location,
    excerpt
  }
`;

export const fieldStoryBySlugQuery = groq`
  *[_type == "fieldStory" && slug.current == $slug][0]{
    _id,
    _updatedAt,
    title,
    titleEn,
    "slug": slug.current,
    publishedAt,
    mainImage,
    location,
    excerpt,
    body,
    bodyEn
  }
`;

export const fieldStoriesSlugsQuery = groq`
  *[_type == "fieldStory" && defined(slug.current)]{
    "slug": slug.current
  }
`;

// ── Team Members ───────────────────────────────────────────────────
export const teamMembersQuery = groq`
  *[_type == "teamMember"] | order(order asc){
    _id,
    name,
    nameEn,
    role,
    roleEn,
    image,
    order
  }
`;
