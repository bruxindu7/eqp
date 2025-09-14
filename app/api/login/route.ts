import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Usuário e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    // 🔎 Procura o usuário
    const user = await users.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // 🔑 Confere senha
    const senhaCorreta = await bcrypt.compare(password, user.password);
    if (!senhaCorreta) {
      return NextResponse.json(
        { message: "Senha incorreta" },
        { status: 401 }
      );
    }

    // 🔐 Gera JWT com 7 dias de validade
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        message: "Login realizado com sucesso!",
        token,
        username: user.username,
        email: user.email,
        role: user.role || "Member", // 🔹 devolve também
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
