// JSON-LD Structured Data Components for SEO

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://civilabsreview.com";
const APP_NAME = "CiviLabs LMS";

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
}

export function OrganizationJsonLd({
  name = APP_NAME,
  url = APP_URL,
  logo = `${APP_URL}/logo.png`,
}: OrganizationJsonLdProps = {}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface WebsiteJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
}

export function WebsiteJsonLd({
  name = APP_NAME,
  url = APP_URL,
  description = "A modern learning management system for engineering education",
}: WebsiteJsonLdProps = {}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/courses?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface CourseJsonLdProps {
  name: string;
  description: string;
  provider?: string;
  url: string;
  imageUrl?: string;
  instructorName?: string;
  numberOfLessons?: number;
  enrollmentCount?: number;
}

export function CourseJsonLd({
  name,
  description,
  provider = APP_NAME,
  url,
  imageUrl,
  instructorName,
  numberOfLessons,
  enrollmentCount,
}: CourseJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: provider,
      sameAs: APP_URL,
    },
    url,
    ...(imageUrl && { image: imageUrl }),
    ...(instructorName && {
      instructor: {
        "@type": "Person",
        name: instructorName,
      },
    }),
    ...(numberOfLessons && {
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: `${numberOfLessons} lessons`,
      },
    }),
    ...(enrollmentCount && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingCount: enrollmentCount,
      },
    }),
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${APP_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface EducationalOrganizationJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
}

export function EducationalOrganizationJsonLd({
  name = APP_NAME,
  url = APP_URL,
  description = "A modern learning management system for engineering education with interactive 3D content, quizzes, and certificates.",
}: EducationalOrganizationJsonLdProps = {}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name,
    url,
    description,
    areaServed: "Worldwide",
    teaches: ["Engineering", "3D Modeling", "Technical Skills"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
