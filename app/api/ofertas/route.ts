import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

// 🔹 GET → listar ofertas do usuário autenticado, incluindo vendas e valores
export async function GET(req: Request) {
  try {
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

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 1️⃣ pega todos os grupos onde o usuário é membro
    const grupos = await db
      .collection("groups")
      .find({ members: decoded.username })
      .toArray();

    const groupIds = grupos.map((g) => g._id.toString());

    // 2️⃣ busca ofertas criadas pelo usuário OU vinculadas a grupos dele
    const ofertas = await db
      .collection("ofertas")
      .find({
        $or: [
          { "createdBy.id": decoded.id },
          { groupId: { $in: groupIds } },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    // 3️⃣ normaliza os dados
    const normalizadas = ofertas.map((o) => ({
      _id: o._id,
      nome: o.nome,
      site: o.site,
      status: o.status,
      groupId: o.groupId || null,
      vendas: o.vendas || 0,
      receitaBruta: o.valorTotal || 0,
      lucro: o.valorLiquido || 0,
      createdAt: o.createdAt,
      createdBy: o.createdBy,
    }));

    return NextResponse.json(normalizadas);
  } catch (err) {
    console.error("❌ Erro GET /api/ofertas:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// 🔹 POST → criar nova oferta
export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    if (!body.nome || !body.site) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome e site" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const novaOferta = {
      nome: body.nome.trim(),
      site: body.site.trim(),
      vendas: 0,
      status: "Ativa",
      createdAt: new Date().toISOString(),
      createdBy: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      },
    };

    const result = await db.collection("ofertas").insertOne(novaOferta);

    // opcional: log em relatórios
    await db.collection("relatorios").insertOne({
      tipo: "Criação",
      oferta: novaOferta.nome,
      site: novaOferta.site,
      status: novaOferta.status,
      usuario: novaOferta.createdBy,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ insertedId: result.insertedId });
  } catch (err) {
    console.error("❌ Erro POST /api/ofertas:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// 🔹 PUT → atualizar status OU vincular grupo
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { nome, status, groupId } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "Campo 'nome' é obrigatório" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const update: any = { $set: {} };

    if (status) update.$set.status = status;
    if (groupId) update.$set.groupId = groupId;

    if (Object.keys(update.$set).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualizar" },
        { status: 400 }
      );
    }

    const result = await db.collection("ofertas").updateOne({ nome }, update);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Oferta não encontrada" },
        { status: 404 }
      );
    }

    const atualizado = await db.collection("ofertas").findOne({ nome });

    await db.collection("relatorios").insertOne({
      tipo: groupId ? "Vinculação de Grupo" : "Atualização",
      oferta: atualizado?.nome,
      site: atualizado?.site,
      status: atualizado?.status,
      groupId: atualizado?.groupId || null,
      usuario: atualizado?.createdBy,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(atualizado);
  } catch (err) {
    console.error("❌ Erro PUT /api/ofertas:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
