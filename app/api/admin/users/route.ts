import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Token não encontrado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    // 🔒 Somente Admin e Owner podem listar
    if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Owner")) {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    // 🔎 Busca todos os usuários, mas remove a senha do retorno
    const lista = await users
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(lista, { status: 200 });
  } catch (error) {
    console.error("Erro no GET /api/admin/users:", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
