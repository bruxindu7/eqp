import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 🔹 Busca apenas os campos que precisa
    const users = await db
      .collection("users")
      .find({}, { projection: { _id: 1, username: 1 } })
      .toArray();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("❌ Erro GET /users:", error);
    return NextResponse.json(
      { error: "Erro ao carregar usuários" },
      { status: 500 }
    );
  }
}
