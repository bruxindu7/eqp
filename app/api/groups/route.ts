import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

// 🔹 GET -> listar grupos do usuário logado
export async function GET(req: Request) {
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

    // 🔹 Apenas grupos onde o usuário logado está em "members"
    const groups = await db
      .collection("groups")
      .find({ members: decoded.username })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(groups, { status: 200 });
  } catch (error) {
    console.error("❌ Erro GET /groups:", error);
    return NextResponse.json({ error: "Erro ao buscar grupos" }, { status: 500 });
  }
}

// 🔹 POST -> criar grupo
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image, members } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const novoGrupo = {
      name,
      image: image || "",
      members: members && members.length > 0 ? members : [decoded.username], // 🔹 cria já com o dono
      status: "Ativo",
      createdAt: new Date(),
    };

    const result = await db.collection("groups").insertOne(novoGrupo);

    return NextResponse.json({ _id: result.insertedId, ...novoGrupo }, { status: 201 });
  } catch (error) {
    console.error("❌ Erro POST /groups:", error);
    return NextResponse.json({ error: "Erro ao criar grupo" }, { status: 500 });
  }
}
