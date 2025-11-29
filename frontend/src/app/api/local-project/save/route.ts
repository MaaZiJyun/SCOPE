// app/api/project/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const project = await req.json()

    // 发送到后端 FastAPI 的接口
    const res = await fetch('http://localhost:8000/api/project/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    })

    if (!res.ok) {
      const errorDetail = await res.json()
      return NextResponse.json(
        { error: 'FastAPI 上传失败', detail: errorDetail },
        { status: res.status }
      )
    }

    const data = await res.json()
    console.log('Upload successful:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: '内部服务器错误', detail: String(error) },
      { status: 500 }
    )
  }
}
