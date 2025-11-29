import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const resp = await fetch("http://localhost:8000/api/cache/size", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!resp.ok) {
      const error = await resp.json();
      return NextResponse.json({ error: "FastAPI 获取缓存大小失败", detail: error }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "内部服务器错误", detail: String(error) }, { status: 500 });
  }
}