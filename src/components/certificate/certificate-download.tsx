"use client";

import { useState, useRef } from "react";
import { Download, Loader2, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CertificateData {
  id: string;
  uniqueCode: string;
  userName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: string;
}

interface CertificateDownloadProps {
  certificate: CertificateData;
}

export function CertificateDownload({ certificate }: CertificateDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Create a simple HTML certificate that can be printed/saved as PDF
      const issueDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const certificateHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificate.courseTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .certificate {
      background: white;
      width: 100%;
      max-width: 900px;
      padding: 60px;
      border-radius: 8px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      position: relative;
    }
    .certificate::before {
      content: '';
      position: absolute;
      inset: 20px;
      border: 2px solid #3b82f6;
      border-radius: 4px;
      pointer-events: none;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 4px;
      color: #666;
    }
    .title {
      text-align: center;
      margin-bottom: 40px;
    }
    .title h1 {
      font-size: 42px;
      color: #1e3a5f;
      font-weight: normal;
      margin-bottom: 10px;
    }
    .recipient {
      text-align: center;
      margin-bottom: 30px;
    }
    .recipient p {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    .recipient h2 {
      font-size: 36px;
      color: #1e3a5f;
      font-style: italic;
    }
    .course {
      text-align: center;
      margin-bottom: 40px;
    }
    .course p {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    .course h3 {
      font-size: 24px;
      color: #3b82f6;
    }
    .footer {
      display: flex;
      justify-content: space-around;
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .footer-item p:first-child {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .footer-item p:last-child {
      font-size: 14px;
      font-weight: bold;
      color: #1e3a5f;
    }
    .certificate-id {
      text-align: center;
      margin-top: 30px;
      font-size: 11px;
      color: #999;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">CiviLabs</div>
      <div class="subtitle">Certificate of Completion</div>
    </div>

    <div class="title">
      <h1>Certificate of Achievement</h1>
    </div>

    <div class="recipient">
      <p>This certifies that</p>
      <h2>${certificate.userName}</h2>
    </div>

    <div class="course">
      <p>has successfully completed the course</p>
      <h3>${certificate.courseTitle}</h3>
    </div>

    <div class="footer">
      <div class="footer-item">
        <p>Date Issued</p>
        <p>${issueDate}</p>
      </div>
      <div class="footer-item">
        <p>Instructor</p>
        <p>${certificate.instructorName}</p>
      </div>
    </div>

    <div class="certificate-id">
      Certificate ID: ${certificate.uniqueCode}
    </div>
  </div>
</body>
</html>
      `;

      // Create blob and download
      const blob = new Blob([certificateHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${certificate.uniqueCode}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download certificate:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/certificates/${certificate.uniqueCode}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/certificates/${certificate.uniqueCode}`;
    const text = `I just earned a certificate for completing "${certificate.courseTitle}" on CiviLabs!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate - ${certificate.courseTitle}`,
          text,
          url,
        });
      } catch (error) {
        // User cancelled or share failed
        console.error("Share failed:", error);
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <Button onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download Certificate
      </Button>

      <Button variant="outline" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <Button variant="outline" onClick={handleCopyLink}>
        {copied ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <Copy className="h-4 w-4 mr-2" />
        )}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
    </div>
  );
}
