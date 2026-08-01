import { NextRequest, NextResponse } from "next/server";
import { updateProjectSchema } from "@/lib/validations";
import { getProjectById, updateProject, publishProject, hideProject } from "@/services/project-service";
import { verifySession } from "@/services/user-service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validated = updateProjectSchema.parse(body);

    // Convert price to string if provided
    const updateData = {
      ...validated,
      price: validated.price !== undefined ? validated.price.toString() : undefined,
    };

    // Update project
    const project = await updateProject(id, user.id, updateData);

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
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
