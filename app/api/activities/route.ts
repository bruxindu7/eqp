import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// 🔹 GET -> lista atividades
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const username = url.searchParams.get("username");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const query: any = {};
    if (userId) query.userId = new ObjectId(userId);
    if (username) query.username = username;

    const activities = await db
      .collection("activities")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json(activities, { status: 200 });
  } catch (error) {
    console.error("Erro GET /activities:", error);
    return NextResponse.json({ error: "Erro ao carregar atividades" }, { status: 500 });
  }
}

// 🔹 POST -> cria ou atualiza última atividade
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, username, type, message } = body;

    if ((!userId && !username) || !type || !message) {
      return NextResponse.json(
        { error: "Campos obrigatórios: userId ou username, type, message" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 🔹 filtro agora inclui user + type
    const filter: any = userId
      ? { userId: new ObjectId(userId), type }
      : { username, type };

    const update = {
      $set: {
        userId: userId ? new ObjectId(userId) : null,
        username: username || null,
        type,
        message,
        createdAt: new Date(),
      },
    };

    // 🔹 atualiza só se já tiver o mesmo type, senão cria outro
    const result = await db
      .collection("activities")
      .updateOne(filter, update, { upsert: true });

    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (error) {
    console.error("Erro POST /activities:", error);
    return NextResponse.json({ error: "Erro ao salvar atividade" }, { status: 500 });
  }
}
