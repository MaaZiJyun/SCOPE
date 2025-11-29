import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { project_id: string } }
) {
  const { project_id } = await params;

  try {
    const res = await fetch(`http://localhost:8000/api/project/get/${project_id}`);
    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: "Backend error", detail: json }, { status: res.status });
    }

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: "Internal error", detail: String(error) }, { status: 500 });
  }
}
