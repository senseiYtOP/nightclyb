import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/services/user-service";
import { getDeveloperStats } from "@/services/dashboard-service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await verifySession(sessionToken);

    // Only allow developers to view their own stats
    if (user.role !== "developer" && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const stats = await getDeveloperStats(user.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
