import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Award, Calendar, CheckCircle, User, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CertificateDownload } from "@/components/certificate/certificate-download";

interface CertificatePageProps {
  params: Promise<{ code: string }>;
}

async function getCertificate(code: string) {
  return db.certificate.findUnique({
    where: { uniqueCode: code },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          instructor: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { code } = await params;
  const certificate = await getCertificate(code);

  if (!certificate) {
    notFound();
  }

  const issueDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">CiviLabs</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Verification Badge */}
        <div className="flex items-center justify-center gap-2 mb-8 text-green-600 animate-fade-in">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Verified Certificate</span>
        </div>

        {/* Certificate Card */}
        <Card className="overflow-hidden animate-fade-in-up shadow-xl">
          {/* Certificate Design */}
          <div className="relative bg-gradient-blue text-white p-8 md:p-12">
            {/* Decorative Pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="cert-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="5" cy="5" r="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100" height="100" fill="url(#cert-pattern)" />
              </svg>
            </div>

            {/* Border Frame */}
            <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none" />

            <div className="relative text-center space-y-6">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="p-4 bg-white/10 rounded-full">
                  <Award className="h-12 w-12" />
                </div>
              </div>

              {/* Title */}
              <div>
                <p className="text-sm uppercase tracking-[0.3em] opacity-80 mb-2">
                  Certificate of Completion
                </p>
                <h1 className="text-3xl md:text-4xl font-bold">CiviLabs LMS</h1>
              </div>

              {/* Recipient */}
              <div className="py-6">
                <p className="text-sm opacity-80 mb-2">This certifies that</p>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {certificate.user.name || "Student"}
                </h2>
              </div>

              {/* Course */}
              <div>
                <p className="text-sm opacity-80 mb-2">has successfully completed</p>
                <h3 className="text-xl md:text-2xl font-semibold">
                  {certificate.course.title}
                </h3>
              </div>

              {/* Date and Instructor */}
              <div className="pt-6 flex flex-col md:flex-row justify-center gap-8 text-sm">
                <div>
                  <p className="opacity-80 mb-1">Date Issued</p>
                  <p className="font-semibold">{issueDate}</p>
                </div>
                <div>
                  <p className="opacity-80 mb-1">Instructor</p>
                  <p className="font-semibold">
                    {certificate.course.instructor.name || "Instructor"}
                  </p>
                </div>
              </div>

              {/* Certificate ID */}
              <div className="pt-4">
                <p className="text-xs opacity-60">
                  Certificate ID: {certificate.uniqueCode}
                </p>
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <CardContent className="p-6 bg-muted/30">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recipient Info */}
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="font-medium">{certificate.user.name || "Student"}</p>
                </div>
              </div>

              {/* Course Info */}
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="font-medium">{certificate.course.title}</p>
                </div>
              </div>

              {/* Issue Date */}
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issued On</p>
                  <p className="font-medium">{issueDate}</p>
                </div>
              </div>

              {/* Verification */}
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-green-600">Verified</p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 flex justify-center">
              <CertificateDownload
                certificate={{
                  id: certificate.id,
                  uniqueCode: certificate.uniqueCode,
                  userName: certificate.user.name || "Student",
                  courseTitle: certificate.course.title,
                  instructorName: certificate.course.instructor.name || "Instructor",
                  issuedAt: certificate.issuedAt.toISOString(),
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Verification Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in">
          <p>
            Verify this certificate at:{" "}
            <code className="px-2 py-1 bg-muted rounded">
              {typeof window !== "undefined" ? window.location.origin : ""}/certificates/{certificate.uniqueCode}
            </code>
          </p>
        </div>
      </main>
    </div>
  );
}
