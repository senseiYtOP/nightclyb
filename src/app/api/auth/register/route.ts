import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { createUser } from "@/services/user-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = registerSchema.parse(body);

    // Create user
    const user = await createUser(
      validated.email,
      validated.username,
      validated.password,
      validated.username
    );

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("validation")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
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
