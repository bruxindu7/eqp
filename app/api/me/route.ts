import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // ✅

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

    // 🔑 Verifica JWT
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    // 🔎 Busca usuário real no banco
    const user = await users.findOne({ _id: new ObjectId(decoded.id) });
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        username: user.username,
        email: user.email,
        role: user.role || "Member",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no /api/me:", error);
    return NextResponse.json(
      { message: "Erro no servidor" },
      { status: 500 }
    );
  }
}
