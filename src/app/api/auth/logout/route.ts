import { NextRequest, NextResponse } from "next/server";
import { invalidateSession } from "@/services/user-service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      await invalidateSession(sessionToken);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear session cookie
    response.cookies.delete("session_token");

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
