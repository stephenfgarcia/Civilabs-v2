"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, Search, Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyCertificatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    message?: string;
    certificate?: {
      user: { name: string };
      course: { title: string };
      issuedAt: string;
    };
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsVerifying(true);
    setResult(null);

    try {
      const response = await fetch(`/api/certificates/verify/${code.trim()}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setResult({
          valid: true,
          certificate: data.certificate,
        });
      } else {
        setResult({
          valid: false,
          message: data.message || "Certificate not found",
        });
      }
    } catch (error) {
      setResult({
        valid: false,
        message: "Failed to verify certificate",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewCertificate = () => {
    router.push(`/certificates/${code.trim()}`);
  };

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

      <main className="container mx-auto px-4 py-16 max-w-lg">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Verify Certificate</h1>
          <p className="text-muted-foreground">
            Enter the certificate ID to verify its authenticity
          </p>
        </div>

        <Card className="animate-fade-in-up">
          <CardContent className="pt-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter certificate ID..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="focus-glow text-center text-lg"
                  disabled={isVerifying}
                />
              </div>

              <Button
                type="submit"
                className="w-full btn-hover-lift"
                disabled={isVerifying || !code.trim()}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Verify Certificate
              </Button>
            </form>

            {/* Result */}
            {result && (
              <div className="mt-6 animate-fade-in">
                {result.valid ? (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-600 mb-3">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Certificate Verified</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Recipient:</span>{" "}
                        <span className="font-medium">
                          {result.certificate?.user.name}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Course:</span>{" "}
                        <span className="font-medium">
                          {result.certificate?.course.title}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Issued:</span>{" "}
                        <span className="font-medium">
                          {result.certificate?.issuedAt &&
                            new Date(result.certificate.issuedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={handleViewCertificate}
                      className="w-full mt-4"
                      variant="outline"
                    >
                      View Full Certificate
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">{result.message}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8 animate-fade-in">
          The certificate ID can be found at the bottom of each certificate
        </p>
      </main>
    </div>
  );
}
