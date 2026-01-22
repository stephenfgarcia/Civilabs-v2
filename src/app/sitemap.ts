import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://civilabsreview.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/forums`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.7,
    },
  ];

  // Get all published courses
  const courses = await db.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      slug: true,
      updatedAt: true,
    },
  });

  const coursePages: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${BASE_URL}/courses/${course.id}`,
    lastModified: course.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Get all forum categories
  const forumCategories = await db.forumCategory.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const forumCategoryPages: MetadataRoute.Sitemap = forumCategories.map(
    (category) => ({
      url: `${BASE_URL}/forums/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "daily",
      priority: 0.6,
    })
  );

  // Get published learning paths
  const learningPaths = await db.learningPath.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const learningPathPages: MetadataRoute.Sitemap = learningPaths.map((path) => ({
    url: `${BASE_URL}/learning-paths/${path.slug}`,
    lastModified: path.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...coursePages,
    ...forumCategoryPages,
    ...learningPathPages,
  ];
}
