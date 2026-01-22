import { Resend } from "resend";

// Initialize Resend - will be undefined if API key is not set
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@civilabsreview.com";
const APP_NAME = "CiviLabs LMS";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (!resend) {
    console.log("Email service not configured. Skipping email:", { to, subject });
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

// Email Templates

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${APP_NAME}!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${name},</p>
        <p style="font-size: 16px;">Welcome to ${APP_NAME}! We're excited to have you join our learning community.</p>
        <p style="font-size: 16px;">Here's what you can do next:</p>
        <ul style="font-size: 16px;">
          <li>Browse our course catalog</li>
          <li>Enroll in courses that interest you</li>
          <li>Join discussions in our forums</li>
          <li>Connect with other learners</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/courses" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Browse Courses</a>
        </div>
        <p style="font-size: 14px; color: #666;">Happy learning!<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}!`,
    html,
  });
}

export async function sendEnrollmentEmail(
  to: string,
  studentName: string,
  courseName: string,
  courseId: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">You're Enrolled!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${studentName},</p>
        <p style="font-size: 16px;">Great news! You've successfully enrolled in:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h2 style="margin: 0; color: #1f2937; font-size: 20px;">${courseName}</h2>
        </div>
        <p style="font-size: 16px;">Start learning now and track your progress as you go.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/courses/${courseId}/learn" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Start Learning</a>
        </div>
        <p style="font-size: 14px; color: #666;">Happy learning!<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `You're enrolled in "${courseName}"`,
    html,
  });
}

export async function sendCertificateEmail(
  to: string,
  studentName: string,
  courseName: string,
  certificateCode: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Congratulations!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${studentName},</p>
        <p style="font-size: 16px;">You've successfully completed the course and earned your certificate!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b;">
          <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 20px;">${courseName}</h2>
          <p style="margin: 0; color: #666; font-size: 14px;">Certificate Code: <strong>${certificateCode}</strong></p>
        </div>
        <p style="font-size: 16px;">You can view, download, and share your certificate at any time.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/certificates/${certificateCode}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Certificate</a>
        </div>
        <p style="font-size: 14px; color: #666;">Keep up the great work!<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Your Certificate for "${courseName}"`,
    html,
  });
}

export async function sendQuizResultEmail(
  to: string,
  studentName: string,
  quizTitle: string,
  score: number,
  passed: boolean,
  courseId: string,
  chapterId: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${passed ? "#10b981" : "#ef4444"} 0%, ${passed ? "#059669" : "#dc2626"} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${passed ? "Quiz Passed!" : "Quiz Results"}</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${studentName},</p>
        <p style="font-size: 16px;">${passed ? "Great job!" : "Keep practicing!"} Here are your quiz results:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 18px;">${quizTitle}</h2>
          <p style="font-size: 48px; font-weight: bold; color: ${passed ? "#10b981" : "#ef4444"}; margin: 10px 0;">${score}%</p>
          <p style="margin: 0; color: #666; font-size: 14px;">${passed ? "Congratulations!" : "You can retake this quiz anytime."}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/courses/${courseId}/learn?chapter=${chapterId}" style="background: ${passed ? "#10b981" : "#3b82f6"}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">${passed ? "Continue Learning" : "Retake Quiz"}</a>
        </div>
        <p style="font-size: 14px; color: #666;">Keep up the effort!<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Quiz Results: ${quizTitle} - ${score}%`,
    html,
  });
}

export async function sendForumReplyEmail(
  to: string,
  userName: string,
  replierName: string,
  threadTitle: string,
  replyPreview: string,
  threadUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Forum Reply</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${userName},</p>
        <p style="font-size: 16px;"><strong>${replierName}</strong> replied to your thread:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 16px;">${threadTitle}</h3>
          <p style="margin: 0; color: #666; font-size: 14px; font-style: italic;">"${replyPreview}..."</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}${threadUrl}" style="background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Reply</a>
        </div>
        <p style="font-size: 14px; color: #666;">The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `New reply to "${threadTitle}"`,
    html,
  });
}
