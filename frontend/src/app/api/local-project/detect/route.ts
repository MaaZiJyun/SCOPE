// app/api/project_update_detection/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("[project_update_detection] Received:", data);

    const resp = await fetch('http://localhost:8000/api/project/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'Python API error' }, { status: resp.status });
    }
    const result = await resp.json();
    console.log("[project_update_detection] Response from backend:", result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 500 });
  }
}

