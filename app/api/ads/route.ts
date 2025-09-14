import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

// 🔹 GET → listar anúncios do usuário autenticado, incluindo vínculo com grupos
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

    // 2️⃣ busca anúncios criados pelo usuário OU vinculados a grupos dele
    const ads = await db
      .collection("ads")
      .find({
        $or: [
          { "createdBy.id": decoded.id },
          { groupId: { $in: groupIds } },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    // 3️⃣ normaliza os dados
    const normalizados = ads.map((a) => ({
      _id: a._id,
      campanha: a.campanha,
      plataforma: a.plataforma,
      site: a.site,
      orcamento: a.orcamento || 0,
      leads: a.leads || 0,
      status: a.status || "Rodando",
      groupId: a.groupId || null,
      createdAt: a.createdAt,
      createdBy: a.createdBy,
    }));

    return NextResponse.json(normalizados);
  } catch (err) {
    console.error("❌ Erro GET /api/ads:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// 🔹 POST → criar novo anúncio
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
    if (!body.campanha || !body.plataforma || !body.site || !body.orcamento) {
      return NextResponse.json(
        { error: "Campos obrigatórios: campanha, plataforma, site, orçamento" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const novoAd = {
      campanha: body.campanha.trim(),
      plataforma: body.plataforma.trim(),
      site: body.site.trim(),
      orcamento: parseFloat(body.orcamento),
      leads: 0,
      status: "Rodando",
      createdAt: new Date().toISOString(),
      createdBy: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      },
      groupId: body.groupId || null,
    };

    const result = await db.collection("ads").insertOne(novoAd);

    return NextResponse.json({ insertedId: result.insertedId });
  } catch (err) {
    console.error("❌ Erro POST /api/ads:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// 🔹 PUT → atualizar status, orçamento ou vincular grupo
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { campanha, status, incremento, groupId } = body;

    if (!campanha) {
      return NextResponse.json(
        { error: "Campo 'campanha' é obrigatório" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const update: any = { $set: {} };

    if (status) update.$set.status = status;
    if (groupId) update.$set.groupId = groupId;
    if (incremento) update.$inc = { orcamento: incremento };

    if (
      Object.keys(update.$set).length === 0 &&
      !update.$inc
    ) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualizar" },
        { status: 400 }
      );
    }

    const result = await db.collection("ads").updateOne({ campanha }, update);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Anúncio não encontrado" },
        { status: 404 }
      );
    }

    const atualizado = await db.collection("ads").findOne({ campanha });

    return NextResponse.json(atualizado);
  } catch (err) {
    console.error("❌ Erro PUT /api/ads:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
