import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { sendWelcomeEmail } from "@/lib/email";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatcher";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.safeParse({
      ...body,
      confirmPassword: body.password, // API doesn't need confirm password
    });

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    dispatchWebhookEvent("USER_CREATED", {
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
