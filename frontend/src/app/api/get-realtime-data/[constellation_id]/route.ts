// app/api/get-realtime-data/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { constellation_id: string } }
) {
  const { constellation_id } = await params;

  try {
    const res = await fetch(
      `http://localhost:8000/api/realtime/frames/${constellation_id}`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch data from backend." }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching real-time data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
