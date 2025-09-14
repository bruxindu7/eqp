"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Admin.module.css";
import {
  LuUsers,
  LuDollarSign,
  LuTrendingUp,
  LuActivity,
  LuShield,
  LuUserCog,
} from "react-icons/lu";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string; // Admin | Owner | Member
}

interface Venda {
  _id: string;
  sourceSite: string;
  totalAmount: number;
  status: string; // approved | pending
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [roleTemp, setRoleTemp] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    const carregarUser = async () => {
      try {
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          router.push("/login");
          return;
        }

        if (data.role !== "Admin" && data.role !== "Owner") {
          router.push("/home");
          return;
        }

        setUser({ username: data.username, role: data.role });
        carregarUsers(token);
        carregarVendas();
      } catch (err) {
        console.error("Erro ao carregar user:", err);
        router.push("/login");
      }
    };

    carregarUser();
  }, [router]);

  const carregarUsers = async (token: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  const carregarVendas = async () => {
    try {
const res = await fetch("/api/sales/all", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
      const data: Venda[] = await res.json();
      setVendas(data);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
    } finally {
      setLoading(false);
    }
  };

  const atualizarRole = async (id: string, novoRole: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/admin/users/update-role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, role: novoRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, role: novoRole } : u))
        );
        setEditando(null);
      } else {
        console.error("Erro ao atualizar role");
      }
    } catch (err) {
      console.error("Erro ao salvar role:", err);
    }
  };

 // 📊 KPIs
const totalUsuarios = users.length;
const totalVendas = vendas.length;
const aprovadas = vendas.filter((v) => v.status === "approved").length;

// receita líquida
const receitaLiquida = vendas
  .filter((v: any) => v.status === "approved" && v.netAmount)
  .reduce((acc: number, v: any) => acc + v.netAmount, 0);

// 📈 Dados para gráfico (receita líquida)
const hoje = new Date();
const mesesUltimos6: string[] = [];
for (let i = 5; i >= 0; i--) {
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
  const mes = d.toLocaleString("pt-BR", { month: "short" }).toLowerCase();
  mesesUltimos6.push(mes);
}

const ganhosPorMes: { [key: string]: number } = {};
mesesUltimos6.forEach((m) => (ganhosPorMes[m] = 0));

vendas.forEach((v: any) => {
  const mes = new Date(v.createdAt)
    .toLocaleString("pt-BR", { month: "short" })
    .toLowerCase();
  if (v.status === "approved" && mesesUltimos6.includes(mes)) {
    ganhosPorMes[mes] += v.netAmount || 0;
  }
});

const chartData = mesesUltimos6.map((mes) => ({
  name: mes,
  valor: ganhosPorMes[mes],
}));

  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Painel Administrativo</h1>
          <p>
            Bem-vindo <strong>{user?.username}</strong>{" "}
            (<span className={styles.badge}>{user?.role}</span>)
          </p>
        </div>

        {/* KPIs */}
        <div className={styles.kpis}>
          <div className={styles.kpiCard}>
            <LuUsers className={styles.kpiIcon} />
            <div>
              <p>Usuários</p>
              <h2>{totalUsuarios}</h2>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <LuActivity className={styles.kpiIcon} />
            <div>
              <p>Vendas</p>
              <h2>{totalVendas}</h2>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <LuTrendingUp className={styles.kpiIcon} />
            <div>
              <p>Aprovadas</p>
              <h2>{aprovadas}</h2>
            </div>
          </div>
<div className={styles.kpiCard}>
  <LuDollarSign className={styles.kpiIcon} />
  <div>
    <p>Receita Líquida</p>
    <h2>{money(receitaLiquida)}</h2>
  </div>
</div>
        </div>



{/* 📈 Gráfico de evolução (receita líquida) */}
<div className={styles.card}>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
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
            const isLast = index === chartData.length - 1;
            return (
              <text
                x={x + (isLast ? 0 : 15)}  // 👉 empurra os labels pra direita (menos o último)
                y={y + 20}                 // 👉 desce um pouco os labels
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
          dx={-8}   // 👉 move os números mais pra esquerda
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
</div>



        {/* Users & Roles */}
        <div className={styles.card}>
          <h3>Gerenciamento de Usuários</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Ações</th>
                <th>Moderação</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    {editando === u._id ? (
                      <div className={styles.customSelect}>
                        <div
                          className={styles.selected}
                          onClick={() =>
                            setRoleTemp((prev) => (prev === "Cargo" ? "" : "Cargo"))
                          }
                        >
                          {roleTemp}
                        </div>
                        {roleTemp === "Cargo" && (
                          <ul className={styles.options}>
                            {["Member", "Admin", "Owner"].map((opt) => (
                              <li
                                key={opt}
                                onClick={() => {
                                  atualizarRole(u._id, opt);
                                  setRoleTemp(opt);
                                }}
                              >
                                {opt}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <span
                        className={`${styles.badge} ${
                          u.role === "Owner"
                            ? styles.badgeOwner
                            : u.role === "Admin"
                            ? styles.badgeAdmin
                            : styles.badgeMember
                        }`}
                      >
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td>
                    {editando === u._id ? (
                      <button
                        className={styles.actionBtn}
                        onClick={() => atualizarRole(u._id, roleTemp)}
                      >
                        Salvar
                      </button>
                    ) : (
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          setEditando(u._id);
                          setRoleTemp(u.role);
                        }}
                      >
                        <LuUserCog /> Editar
                      </button>
                    )}
                  </td>
                  <td>
                    <button className={styles.actionBtnDanger}>
                      <LuShield /> Banir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
