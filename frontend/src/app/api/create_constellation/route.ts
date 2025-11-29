import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const constellation = await request.json();
    // console.log('Received constellation:', constellation);

    const pythonApiUrl = 'http://localhost:8000/api/generate-constellation';

    const pythonRes = await fetch(pythonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(constellation),
    });

    if (!pythonRes.ok) {
      return NextResponse.json({ error: 'Python API error' }, { status: pythonRes.status });
    }

    const result = await pythonRes.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
