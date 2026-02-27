import { NextResponse } from "next/server";
import { workflows } from "@/lib/workflows";

export async function GET() {
  return NextResponse.json(workflows);
}
