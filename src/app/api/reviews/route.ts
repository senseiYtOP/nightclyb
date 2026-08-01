import { NextRequest, NextResponse } from "next/server";
import { createReviewSchema } from "@/lib/validations";
import { createReview, getProjectReviews } from "@/services/review-service";
import { verifySession } from "@/services/user-service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 }
      );
    }

    const reviews = await getProjectReviews(projectId, limit);

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Validate input
    const validated = createReviewSchema.parse(body);

    // Create review
    const review = await createReview(
      validated.projectId,
      user.id,
      {
        rating: validated.rating,
        title: validated.title,
        content: validated.content,
      }
    );

    return NextResponse.json({
      success: true,
      data: review,
    });
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
