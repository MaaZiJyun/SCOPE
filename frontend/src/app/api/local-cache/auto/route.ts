import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();

    const resp = await fetch("http://localhost:8000/api/cache/auto_testing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!resp.ok) {
      const error = await resp.json();
      return NextResponse.json({ error: "FastAPI 初始化缓存失败", detail: error }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "内部服务器错误", detail: String(error) }, { status: 500 });
  }
}