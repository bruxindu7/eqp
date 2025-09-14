import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGIN = "https://eqp.lat";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔓 Exceção: libera o webhook da BuckPay (vai ter proteção própria por assinatura)
  if (pathname.startsWith("/api/buckpay/receiver")) {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin") || req.headers.get("host");

  // 🚫 Bloqueia se não for eqp.lat nem localhost
  if (!origin || (!origin.includes("eqp.lat") && !origin.includes("localhost"))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

// 🔹 Aplica só nas rotas da API
export const config = {
  matcher: ["/api/:path*"],
};
