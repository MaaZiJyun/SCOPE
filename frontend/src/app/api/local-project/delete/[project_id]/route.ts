// app/api/project/list/[user_id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest, { params }: { params: { project_id: string } }) {
  const { project_id } = await params

  try {
    const res = await fetch(`http://localhost:8000/api/project/delete/${project_id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const error = await res.json()
      return NextResponse.json({ error: 'FastAPI 获取列表失败', detail: error }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch project list failed:', error)
    return NextResponse.json({ error: '内部服务器错误', detail: String(error) }, { status: 500 })
  }
}
