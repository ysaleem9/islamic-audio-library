import { NextResponse } from "next/server";
import { getAllData } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAllData();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل جلب البيانات" },
      { status: 500 }
    );
  }
}
