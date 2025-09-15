import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    // 🔐 Validar token
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

    // 🔒 Apenas Admins/Owners podem acessar todas as vendas
    if (decoded.role !== "Admin" && decoded.role !== "Owner") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 🔹 Retornar apenas vendas aprovadas, mais recentes primeiro
    const docs = await db
      .collection("sales")
      .find({ status: "paid" })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(docs);
  } catch (err) {
    console.error("❌ Erro GET /api/sales/approved:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
