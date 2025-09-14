import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function PUT(req: Request) {
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
    if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Owner")) {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
    }

    const { id, role } = await req.json();

    if (!["Admin", "Owner", "Member"].includes(role)) {
      return NextResponse.json({ message: "Role inválido" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    await users.updateOne({ _id: new ObjectId(id) }, { $set: { role } });

    return NextResponse.json({ message: "Role atualizado com sucesso!" }, { status: 200 });
  } catch (error) {
    console.error("Erro update-role:", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
