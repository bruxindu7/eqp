"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Analytics.module.css";
import {
  LuActivity,
  LuChartBar,
  LuTrendingUp,
  LuMousePointerClick,
} from "react-icons/lu";

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
  netAmount: number;
  status: string;
  createdAt: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [sales, setSales] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);

   // 🔑 Pega usuário real via /api/me
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setUser({
            username: data.username,
          });
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

 useEffect(() => {
  async function fetchSummary() {
    try {
      const res = await fetch("/api/sales/summary", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao carregar resumo");
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("❌ Erro ao buscar resumo:", err);
    }
  }

  async function fetchSales() {
    try {
      const res = await fetch("/api/sales", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao carregar vendas");
      const data: Venda[] = await res.json();
      setSales(data);
    } catch (err) {
      console.error("❌ Erro ao buscar vendas:", err);
    } finally {
      setLoading(false);
    }
  }

  fetchSummary();
  fetchSales();
}, []);


  const formatBRL = (value: number) =>
    value?.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }) || "R$ 0,00";

  // 🔹 Últimos 6 meses dinâmicos
  const hoje = new Date();
  const mesesUltimos6: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mes = d.toLocaleString("pt-BR", { month: "short" }).toLowerCase();
    mesesUltimos6.push(mes);
  }

  // 🔹 Inicializa com 0 para evolução, aprovadas e pendentes
  const ganhosAprovadasPorMes: { [key: string]: number } = {};
  const ganhosPendentesPorMes: { [key: string]: number } = {};
  mesesUltimos6.forEach((m) => {
    ganhosAprovadasPorMes[m] = 0;
    ganhosPendentesPorMes[m] = 0;
  });

  // 🔹 Percorre vendas
  sales.forEach((v) => {
    const date = new Date(v.createdAt);
    const mes = date.toLocaleString("pt-BR", { month: "short" }).toLowerCase();
    if (mesesUltimos6.includes(mes)) {
      if (v.status === "approved") {
        ganhosAprovadasPorMes[mes] += v.totalAmount || 0;
      } else if (v.status === "pending") {
        ganhosPendentesPorMes[mes] += v.totalAmount || 0;
      }
    }
  });

  // 🔹 Dados para evolução de receita aprovada
  const evolutionData = mesesUltimos6.map((mes) => ({
    name: mes,
    valor: ganhosAprovadasPorMes[mes],
  }));

  // 🔹 Dados comparativo aprovadas x pendentes (por mês)
  const comparativoData = mesesUltimos6.map((mes) => ({
    name: mes,
    aprovadas: ganhosAprovadasPorMes[mes],
    pendentes: ganhosPendentesPorMes[mes],
  }));

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Analytics</h1>
          <p>Resumo financeiro.</p>
        </div>

        {/* KPIs Ledger */}
        <div className={styles.kpis}>
          <div className={styles.kpiCard}>
            <LuActivity className={styles.kpiIcon} />
            <div>
              <p>Aprovadas ({summary?.countApproved || 0})</p>
              <h2>{loading ? "..." : formatBRL(summary?.approved)}</h2>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <LuMousePointerClick className={styles.kpiIcon} />
            <div>
              <p>Pendentes ({summary?.countPending || 0})</p>
              <h2>{loading ? "..." : formatBRL(summary?.pending)}</h2>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <LuChartBar className={styles.kpiIcon} />
            <div>
              <p>Receita Total</p>
              <h2>{loading ? "..." : formatBRL(summary?.total)}</h2>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <LuTrendingUp className={styles.kpiIcon} />
            <div>
              <p>Receita Líquida</p>
              <h2>{loading ? "..." : formatBRL(summary?.net)}</h2>
            </div>
          </div>
        </div>

        {/* GRÁFICOS estilo Ledger */}
        <div className={styles.charts}>
          {/* Evolução de Receita */}
          <div className={styles.chartCard}>
            <h3>Evolução de Receita Aprovada</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionData}>
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
  dy={10}
  tick={({ x, y, payload }) => (
    <text
      x={x}
      y={y + 20}
      textAnchor="middle"
      fill="#aaa"
      dx={payload.index === 0 ? 15 : 0}   // 🔥 só o 1º mês vai mais pra direita
    >
      {payload.value}
    </text>
  )}
/>

              <YAxis
  stroke="#aaa"
  axisLine={false}
  tickLine={false}
  dx={-8}   // 🔥 move os números pra esquerda
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
                  formatter={(value: number) => formatBRL(value)}
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
          </div>

          {/* Comparativo Aprovadas x Pendentes */}
          <div className={styles.chartCard}>
            <h3>Aprovadas x Pendentes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={comparativoData}>
                <defs>
                  <linearGradient id="aprovadasGradient" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pendentesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b9b9b9ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#b9b9b9ff" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
<XAxis
  dataKey="name"
  stroke="#aaa"
  axisLine={false}
  tickLine={false}
  dy={10}
  tick={({ x, y, payload }) => (
    <text
      x={x}
      y={y + 20}
      textAnchor="middle"
      fill="#aaa"
      dx={payload.index === 0 ? 15 : 0}   // 🔥 só o 1º mês vai mais pra direita
    >
      {payload.value}
    </text>
  )}
/>

<YAxis
  stroke="#aaa"
  axisLine={false}
  tickLine={false}
  dx={-8}   // 🔥 move os números pra esquerda
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
                  formatter={(value: number) => formatBRL(value)}
                />

                <Area
                  type="monotone"
                  dataKey="aprovadas"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#aprovadasGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="pendentes"
                  stroke="#8d8d8dff"
                  strokeWidth={2}
                  fill="url(#pendentesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
