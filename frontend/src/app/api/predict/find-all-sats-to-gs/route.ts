// app/api/launch_constellation/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const project = await request.json();
    const res = await fetch('http://localhost:8000/api/predict/find-all-sats-to-gs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });

    if (!res.ok) {
      const errorDetail = await res.json()
      return NextResponse.json(
        { error: 'FastAPI 上传失败', detail: errorDetail },
        { status: res.status }
      )
    }

    const data = await res.json()
    console.log('FastAPI 返回数据:', data)
    return NextResponse.json(data)

  } catch {
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 500 });
  }
}

