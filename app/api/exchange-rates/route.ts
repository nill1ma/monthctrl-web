import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base") ?? "USD";

  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) {
    console.warn("[exchange-rates] EXCHANGE_RATE_API_KEY not set");
    return NextResponse.json({ rates: {} });
  }

  const res = await fetch(
    `https://v6.exchangerate-api.com/v6/${key}/latest/${base}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    return NextResponse.json({ rates: {} }, { status: res.status });
  }

  const json = await res.json();

  return NextResponse.json({ rates: json.conversion_rates ?? {} });
}
