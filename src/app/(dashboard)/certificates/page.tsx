import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Award, Calendar, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function getCertificates(userId: string) {
  return db.certificate.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          instructor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { issuedAt: "desc" },
  });
}

export default async function CertificatesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const certificates = await getCertificates(session.user.id);

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground mt-1">
          View and download your earned certificates
        </p>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card className="animate-fade-in-up">
          <CardContent className="py-16 text-center">
            <Award className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No certificates yet</h2>
            <p className="text-muted-foreground mb-6">
              Complete courses to earn certificates
            </p>
            <Button asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate, index) => (
            <Card
              key={certificate.id}
              className="overflow-hidden cascade-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Certificate Preview */}
              <div className="relative aspect-[4/3] bg-gradient-blue p-6 text-white">
                <div className="absolute inset-0 opacity-10">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <pattern
                      id={`pattern-${certificate.id}`}
                      x="0"
                      y="0"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="10" cy="10" r="1" fill="currentColor" />
                    </pattern>
                    <rect
                      x="0"
                      y="0"
                      width="100"
                      height="100"
                      fill={`url(#pattern-${certificate.id})`}
                    />
                  </svg>
                </div>
                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <Award className="h-8 w-8 mb-2" />
                    <p className="text-xs uppercase tracking-wider opacity-80">
                      Certificate of Completion
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg line-clamp-2">
                      {certificate.course.title}
                    </h3>
                    <p className="text-sm opacity-80 mt-1">
                      {session.user.name || "Student"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(certificate.issuedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/certificates/${certificate.uniqueCode}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/certificates/${certificate.uniqueCode}?download=true`}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
