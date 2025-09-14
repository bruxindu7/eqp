"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Dashboard.module.css";
import { LuTrendingUp } from "react-icons/lu";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Venda {
  _id: string;
  sourceSite: string;
  totalAmount: number;
  netAmount: number; // 🔹 receita líquida
  status: string;
  createdAt: string;
}

export default function Portfolio() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 🔑 Busca user real do backend
    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setUser({
            username: data.username,
            email: data.email,
            role: data.role,
          });
          carregarVendas(); // só carrega vendas depois que confirmou login
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const carregarVendas = async () => {
    try {
      const res = await fetch("/api/sales", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar vendas");
      const data: Venda[] = await res.json();
      setVendas(data.filter((v) => v.status === "approved"));
    } catch (err) {
      console.error("❌ Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // 🔹 Total líquido ganho
  const totalLiquido = vendas.reduce((acc, v) => acc + (v.netAmount || 0), 0);

  // 🔹 Últimos 6 meses
  const hoje = new Date();
  const mesesUltimos6: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mes = d.toLocaleString("pt-BR", { month: "short" }).toLowerCase();
    mesesUltimos6.push(mes);
  }

  // 🔹 Inicializa ganhos líquidos mensais
  const ganhosPorMes: { [key: string]: number } = {};
  mesesUltimos6.forEach((m) => (ganhosPorMes[m] = 0));

  vendas.forEach((v) => {
    const date = new Date(v.createdAt);
    const mes = date.toLocaleString("pt-BR", { month: "short" }).toLowerCase();
    if (mesesUltimos6.includes(mes)) {
      ganhosPorMes[mes] += v.netAmount || 0;
    }
  });

  const ganhosData = mesesUltimos6.map((mes) => ({
    name: mes,
    valor: ganhosPorMes[mes],
  }));

  const ultimaVenda = vendas.length > 0
    ? [...vendas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const ganhosPorSite: { [site: string]: number } = {};
  vendas.forEach((v) => {
    ganhosPorSite[v.sourceSite] = (ganhosPorSite[v.sourceSite] || 0) + (v.netAmount || 0);
  });

  const ativos = Object.entries(ganhosPorSite).map(([site, valor]) => ({
    site,
    price: money(valor),
    allocation: totalLiquido > 0 ? Math.round((valor / totalLiquido) * 100) : 0,
    value: money(valor),
  }));

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Portfólio</h1>
          <p>Resumo da sua performance geral, {user?.username}.</p>
        </div>
  {/* CARD PRINCIPAL */}
        <div className={styles.balanceCard}>
          <h2>{money(totalLiquido)}</h2>
          <p className={styles.gain}>
            <LuTrendingUp /> {ultimaVenda ? money(ultimaVenda.netAmount || 0) : "—"}
          </p>

          {/* 📊 Gráfico (receita líquida) */}
          <div className={styles.chartWrapper}>
            {loading ? (
              <p style={{ textAlign: "center", color: "#888" }}>Carregando...</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={ganhosData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />

                  <XAxis
                    dataKey="name"
                    stroke="#aaa"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tick={({ x, y, payload, index }) => {
                      const isLast = index === ganhosData.length - 1;
                      return (
                        <text
                          x={x + (isLast ? 0 : 15)}
                          y={y + 20}
                          textAnchor="middle"
                          fill="#aaa"
                          fontSize={16}
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />

                  <YAxis
                    stroke="#aaa"
                    axisLine={false}
                    tickLine={false}
                    dx={-8}
                    tickFormatter={(value) =>
                      value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value
                    }
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid #222",
                      borderRadius: "6px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => money(value)}
                  />

                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {/* LISTA DE ATIVOS */}
        <div className={styles.assetTable}>
          <h3>Distribuição por Site</h3>
          {ativos.length === 0 ? (
            <p className={styles.empty}>Nenhuma venda aprovada ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Preço</th>
                  <th>Alocação</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {ativos.map((item, i) => (
                  <tr key={i}>
                    <td>{item.site}</td>
                    <td>{item.price}</td>
                    <td>
                      <div className={styles.allocationWrapper}>
                        <div className={styles.allocationBar}>
                          <div
                            className={styles.allocationFill}
                            style={{ width: `${item.allocation}%` }}
                          ></div>
                        </div>
                        <span>{item.allocation}%</span>
                      </div>
                    </td>
                    <td>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
