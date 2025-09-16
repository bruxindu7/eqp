import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📦 Notificação recebida no site central:", JSON.stringify(body, null, 2));

    const { data } = body;

    if (!data || !data.id) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // 🔍 Origem do site (via tracking.site do checkout)
    const sourceSite = data.tracking?.site || "desconhecido";
    console.log("🔎 Site de origem detectado:", sourceSite);

    // 🔌 Conexão com o MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const sales = db.collection("sales");

    const updateResult = await sales.updateOne(
      { transactionId: data.id },
      {
        $set: {
          status: data.status,
          receivedAt: new Date().toISOString(), // sempre atualiza
        },
        $setOnInsert: {
          transactionId: data.id,
          method: data.payment_method,
          totalAmount: Number(data.total_amount) / 100,
          netAmount: Number(data.net_amount) / 100,
          offer: {
            name: data.offer?.name || null,
            price: data.offer?.discount_price || null,
            quantity: data.offer?.quantity || 1,
          },
          buyer: {
            name: data.buyer?.name || null,
            email: data.buyer?.email || null,
            phone: data.buyer?.phone || null,
            document: data.buyer?.document || null,
          },
          tracking: data.tracking || {},
          sourceSite, // ✅ campo de primeiro nível, continua igual
          createdAt: data.created_at,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, result: updateResult });
  } catch (err) {
    console.error("❌ Erro no site central:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
