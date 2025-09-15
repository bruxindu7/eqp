import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 🔹 buscar todas ofertas do usuário
    const ofertas = await db
      .collection("ofertas")
      .find({ "createdBy.id": decoded.id })
      .toArray();

    let updates: any[] = [];

    for (const oferta of ofertas) {
      // conta quantas vendas aprovadas existem para o site da oferta
      const vendas = await db.collection("sales").countDocuments({
        sourceSite: oferta.site,
        status: "paid",
      });

      // soma total vendido líquido
      const docs = await db.collection("sales").find({
        sourceSite: oferta.site,
        status: "paid",
      }).toArray();

      const valorTotal = docs.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
      const valorLiquido = docs.reduce((acc, s) => acc + (Number(s.netAmount) || 0), 0);

      // atualizar a oferta com os valores
      await db.collection("ofertas").updateOne(
        { _id: oferta._id },
        {
          $set: {
            vendas,
            valorTotal: Number(valorTotal.toFixed(2)),
            valorLiquido: Number(valorLiquido.toFixed(2)),
          },
        }
      );

      updates.push({
        oferta: oferta.nome,
        site: oferta.site,
        vendas,
        valorTotal: Number(valorTotal.toFixed(2)),
        valorLiquido: Number(valorLiquido.toFixed(2)),
      });
    }

    return NextResponse.json({ success: true, updates }, { status: 200 });
  } catch (err) {
    console.error("❌ Erro POST /api/sync-offers:", err);
    return NextResponse.json({ error: "Erro ao sincronizar ofertas" }, { status: 500 });
  }
}
