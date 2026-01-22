import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create Admin user
  const adminPassword = await hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@civilabs.com" },
    update: {},
    create: {
      email: "admin@civilabs.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create Instructor user
  const instructorPassword = await hash("Instructor123!", 12);
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@civilabs.com" },
    update: {},
    create: {
      email: "instructor@civilabs.com",
      name: "Demo Instructor",
      password: instructorPassword,
      role: "INSTRUCTOR",
      emailVerified: new Date(),
      bio: "Experienced civil engineering instructor with expertise in structural analysis and 3D modeling.",
    },
  });
  console.log("✅ Instructor user created:", instructor.email);

  // Create Student user
  const studentPassword = await hash("Student123!", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@civilabs.com" },
    update: {},
    create: {
      email: "student@civilabs.com",
      name: "Demo Student",
      password: studentPassword,
      role: "STUDENT",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Student user created:", student.email);

  // Create some categories
  const categories = [
    { name: "Structural Engineering", slug: "structural-engineering" },
    { name: "Geotechnical Engineering", slug: "geotechnical-engineering" },
    { name: "Transportation Engineering", slug: "transportation-engineering" },
    { name: "Environmental Engineering", slug: "environmental-engineering" },
    { name: "Construction Management", slug: "construction-management" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("✅ Categories created");

  // Create forum categories
  const forumCategories = [
    {
      name: "General Discussion",
      slug: "general-discussion",
      description: "General discussions about civil engineering topics",
      icon: "MessageSquare",
      color: "#3b82f6",
    },
    {
      name: "Course Help",
      slug: "course-help",
      description: "Get help with course content and assignments",
      icon: "HelpCircle",
      color: "#22c55e",
    },
    {
      name: "Career Advice",
      slug: "career-advice",
      description: "Discuss career paths and professional development",
      icon: "Briefcase",
      color: "#f59e0b",
    },
  ];

  for (const category of forumCategories) {
    await prisma.forumCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("✅ Forum categories created");

  console.log("\n🎉 Seeding complete!\n");
  console.log("═══════════════════════════════════════════");
  console.log("  Demo Account Credentials");
  console.log("═══════════════════════════════════════════");
  console.log("\n  ADMIN");
  console.log("  Email:    admin@civilabs.com");
  console.log("  Password: Admin123!");
  console.log("\n  INSTRUCTOR");
  console.log("  Email:    instructor@civilabs.com");
  console.log("  Password: Instructor123!");
  console.log("\n  STUDENT");
  console.log("  Email:    student@civilabs.com");
  console.log("  Password: Student123!");
  console.log("\n═══════════════════════════════════════════\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
