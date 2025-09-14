// /api/sales/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 1️⃣ Buscar grupos do usuário
    const grupos = await db
      .collection("groups")
      .find({ members: decoded.username })
      .toArray();

    // 2️⃣ Montar mapa { site -> percentual }
    const percentuaisUser: Record<string, number> = {};
    grupos.forEach((g: any) => {
      if (g.percentuais && g.percentuais[decoded.username]) {
        Object.entries(g.percentuais[decoded.username]).forEach(
          ([site, pct]) => {
            // força para minúsculo e número
            percentuaisUser[site.toLowerCase()] = Number(pct) || 0;
          }
        );
      }
    });

    const groupIds = grupos.map((g) => g._id.toString());

    // 3️⃣ Ofertas do user ou vinculadas a grupos
    const ofertas = await db
      .collection("ofertas")
      .find({
        $or: [
          { "createdBy.id": decoded.id },
          { groupId: { $in: groupIds } },
        ],
      })
      .toArray();

    const sitesUsuario = ofertas.map((o) => o.site);

    if (sitesUsuario.length === 0) {
      return NextResponse.json([]);
    }

    // 4️⃣ Buscar vendas
    const docs = await db
      .collection("sales")
      .find({ sourceSite: { $in: sitesUsuario } })
      .sort({ createdAt: -1 })
      .toArray();

    // 5️⃣ Adicionar campo ganhoUser
    const vendasComGanho = docs.map((v: any) => {
      const siteKey = (v.sourceSite || "").toLowerCase();
      const pct = percentuaisUser[siteKey] || 0;
      const ganhoUser = (Number(v.netAmount) || 0) * (pct / 100);
      return { ...v, ganhoUser: Number(ganhoUser.toFixed(2)) };
    });

    return NextResponse.json(vendasComGanho);
  } catch (err) {
    console.error("❌ Erro GET /api/sales:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
