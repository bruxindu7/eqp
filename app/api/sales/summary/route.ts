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

    // 1️⃣ Grupos do user
    const grupos = await db
      .collection("groups")
      .find({ members: decoded.username })
      .toArray();
    const groupIds = grupos.map((g) => g._id.toString());

    // 2️⃣ Ofertas do user OU de grupos
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
      return NextResponse.json({
        paid: 0,
        pending: 0,
        total: 0,
        net: 0,
        countpaid: 0,
        countPaid: 0,
        totalCount: 0,
      });
    }

    // 3️⃣ Todas as vendas dos sites
    const docs = await db
      .collection("sales")
      .find({ sourceSite: { $in: sitesUsuario } })
      .toArray();

    let paid = 0;
    let pending = 0;
    let total = 0;
    let net = 0;
    let countpaid = 0;
    let countPending = 0;

    docs.forEach((sale) => {
      const status = (sale?.status || "").toLowerCase();
      const totalAmount = Number(sale?.totalAmount) || 0;
      const netAmount = Number(sale?.netAmount) || 0;

      if (status === "paid") {
        paid += totalAmount;
        net += netAmount;
        countpaid++;
      } else if (status === "pending") {
        pending += totalAmount;
        countPending++;
      }
    });

    total = paid;

    return NextResponse.json({
      paid: Number(paid.toFixed(2)),
      pending: Number(pending.toFixed(2)),
      total: Number(total.toFixed(2)),
      net: Number(net.toFixed(2)),
      countpaid,
      countPending,
      totalCount: docs.length,
    });
  } catch (err) {
    console.error("❌ Erro GET /api/sales/summary:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
