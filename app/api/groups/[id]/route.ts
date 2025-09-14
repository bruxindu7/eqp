import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

// 🔹 Middleware simples p/ autenticar usuário
async function autenticar(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { error: "Não autorizado", status: 401 };

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    return { decoded };
  } catch {
    return { error: "Token inválido", status: 401 };
  }
}

// 🔹 GET -> detalhes do grupo + ofertas
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // aqui vem o NAME do grupo
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // busca grupo pelo NAME
    const group = await db.collection("groups").findOne({ name: id });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    }

    // pega o _id real do grupo e busca as ofertas pelo groupId
    const ofertas = await db
      .collection("ofertas")
      .find({ groupId: group._id.toString() })
      .toArray();

    return NextResponse.json({ ...group, ofertas }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro GET /groups/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao buscar grupo" },
      { status: 500 }
    );
  }
}

// 🔹 PUT -> atualizar grupo
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await autenticar(req);
    if ("error" in auth)
      return NextResponse.json(auth, { status: auth.status });

    const body = await req.json();
    const { action, membro, campanhaId, percentual } = body;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    let updateDoc: any = {};

    if (action === "adicionar" && membro) {
      updateDoc = { $addToSet: { members: membro } };
    }

    if (action === "remover" && membro) {
      updateDoc = { $pull: { members: membro } };
    }

    if (action === "percentual" && membro && campanhaId) {
      // buscar campanha pelo _id para pegar o site
      const campanha = await db
        .collection("ofertas")
        .findOne({ _id: new ObjectId(campanhaId) });

      if (!campanha) {
        return NextResponse.json(
          { error: "Campanha não encontrada" },
          { status: 404 }
        );
      }

      // salva com o site como chave
      updateDoc = {
        $set: {
          [`percentuais.${membro}.${campanha.site}`]: percentual,
        },
      };
    }

    if (Object.keys(updateDoc).length === 0) {
      return NextResponse.json(
        { error: "Nenhuma ação válida" },
        { status: 400 }
      );
    }

    const result = await db.collection("groups").findOneAndUpdate(
      { name: id }, // busca pelo nome do grupo
      updateDoc,
      { returnDocument: "after" }
    );

    // 👇 fallback: se não retornar `.value`, busca manualmente
    const updatedGroup =
      result?.value || (await db.collection("groups").findOne({ name: id }));

    if (!updatedGroup) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error) {
    console.error("❌ Erro PUT /groups/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar grupo" },
      { status: 500 }
    );
  }
}

// 🔹 DELETE -> excluir grupo
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await autenticar(req);
    if ("error" in auth)
      return NextResponse.json(auth, { status: auth.status });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection("groups").deleteOne({ name: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro DELETE /groups/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao excluir grupo" },
      { status: 500 }
    );
  }
}
