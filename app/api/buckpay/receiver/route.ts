import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📦 Notificação recebida no site central:", JSON.stringify(body, null, 2));

    const { event, data, sourceSite } = body;

    if (!data || !data.id) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // 🔌 Conexão com o MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const sales = db.collection("sales");

    // 📂 Estrutura organizada da venda
    const sale = {
      transactionId: data.id,
      status: data.status, // "pending", "approved", etc
      method: data.payment_method,
      totalAmount: data.total_amount / 100, // transforma centavos em reais
      netAmount: data.net_amount / 100,
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
      sourceSite: sourceSite || "desconhecido",
      createdAt: data.created_at,
      receivedAt: new Date().toISOString(),
    };

    // 💾 Salva ou atualiza se já existir
    await sales.updateOne(
      { transactionId: sale.transactionId },
      { $set: sale },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, saved: sale });
  } catch (err) {
    console.error("❌ Erro no site central:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
