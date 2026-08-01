import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/validations";
import { createProject, getPublishedProjects } from "@/services/project-service";
import { verifySession } from "@/services/user-service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const projects = await getPublishedProjects(limit, offset);

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        limit,
        offset,
      },
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
    const validated = createProjectSchema.parse(body);

    // Create project
    const project = await createProject(user.id, {
      title: validated.title,
      slug: validated.slug,
      description: validated.description,
      shortDescription: validated.shortDescription,
      categoryId: validated.categoryId,
      price: validated.price,
      currency: validated.currency,
    });

    return NextResponse.json({
      success: true,
      data: project,
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
