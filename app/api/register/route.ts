import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { username, email, password, codigoUnico, role } = await req.json();

    if (!username || !email || !password || !codigoUnico) {
      return NextResponse.json(
        { message: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const users = db.collection("users");
    const invites = db.collection("invites");

    // 🔎 Verifica se o convite existe e ainda não foi usado
    const invite = await invites.findOne({ codigo: codigoUnico, usado: false });
    if (!invite) {
      return NextResponse.json(
        { message: "Código de convite inválido ou já usado" },
        { status: 403 }
      );
    }

    // 🔎 Evita duplicatas de usuário/email
    const existe = await users.findOne({ $or: [{ username }, { email }] });
    if (existe) {
      return NextResponse.json(
        { message: "Usuário ou email já cadastrados" },
        { status: 400 }
      );
    }

    // 🔑 Hash da senha
    const hash = await bcrypt.hash(password, 10);

    // 💾 Cria usuário com role (default: "Member")
    await users.insertOne({
      username,
      email,
      password: hash,
      convite: codigoUnico,
      role: role || "Member", // 🔹 se não passar nada, vira "Member"
      createdAt: new Date(),
    });

    // ✅ Marca o convite como usado
    await invites.updateOne(
      { codigo: codigoUnico },
      { $set: { usado: true, usadoEm: new Date(), usadoPor: username } }
    );

    return NextResponse.json(
      { message: "Usuário registrado com sucesso!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
