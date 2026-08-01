import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { authenticateUser } from "@/services/user-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = loginSchema.parse(body);

    // Authenticate user
    const result = await authenticateUser(validated.email, validated.password);

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    // Set session cookie
    response.cookies.set("session_token", result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
