"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Perfil.module.css";
import {
  LuKey,
  LuArrowRight,
  LuTrendingUp,
  LuLogIn,
  LuDollarSign,
} from "react-icons/lu";

interface Activity {
  type: "login" | "sale" | "password" | "campaign";
  message: string;
  date: string;
}

interface Venda {
  _id: string;
  totalAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

interface User {
  username: string;
  email: string;
  role: string;
}

interface Group {
  _id: string;
  name: string;
  image: string;
  status: string;
  members: string[];
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [grupo, setGrupo] = useState<Group | null>(null);

  const [atividades, setAtividades] = useState<Activity[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [campanhas, setCampanhas] = useState<number>(0);
  const [loading, setLoading] = useState(true); // 👈 novo

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
      .then(async (data) => {
        if (!data.username) {
          router.push("/login");
          return;
        }

        setUser({
          username: data.username,
          email: data.email,
          role: data.role,
        });

        // 🔹 pega grupo do user
        const resGroup = await fetch("/api/groups", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const groups: Group[] = await resGroup.json();
        const groupUser = groups.find((g) =>
          g.members.includes(data.username)
        );
        setGrupo(groupUser || null);

        await Promise.all([
          carregarAtividades(token, data.username),
          carregarVendas(token),
          carregarCampanhas(token),
        ]);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false)); // ✅ só sai do loading no fim
  }, [router]);

  const carregarAtividades = async (token: string, username: string) => {
    try {
      const res = await fetch(`/api/activities?username=${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar atividades");
      const data = await res.json();
      setAtividades(
        data.map((a: any) => ({
          type: a.type,
          message: a.message,
          date: new Date(a.createdAt).toLocaleDateString("pt-BR"),
        }))
      );
    } catch {}
  };

  const carregarVendas = async (token: string) => {
    try {
      const res = await fetch("/api/sales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Venda[] = await res.json();
      setVendas(data.filter((v) => v.status === "approved"));
    } catch {}
  };

  const carregarCampanhas = async (token: string) => {
    try {
      const res = await fetch("/api/ads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCampanhas(data.length);
    } catch {}
  };

 
if (loading)
  return (
    <div className={styles.loadingWrapper}>
      <div className={styles.spinner}></div>
      <p>Carregando...</p>
    </div>
  );

  if (!user) return null;

  // 📊 métricas
  const totalLiquido = vendas.reduce((acc, v) => acc + (v.netAmount || 0), 0);
  const vendasRealizadas = vendas.length;
  const comissaoMedia =
    vendas.length > 0
      ? (
          vendas.reduce(
            (acc, v) => acc + (v.netAmount / v.totalAmount) * 100,
            0
          ) / vendas.length
        ).toFixed(1)
      : "0.0";

  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  const renderIcon = (type: Activity["type"]) => {
    switch (type) {
      case "login":
        return <LuLogIn />;
      case "sale":
        return <LuDollarSign />;
      case "campaign":
        return <LuTrendingUp />;
      case "password":
        return <LuKey />;
      default:
        return <LuLogIn />;
    }
  };

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Perfil</h1>
          <p>Gerencie suas informações e acompanhe suas métricas pessoais.</p>
        </div>

        <div className={styles.grid}>
          {/* CARD PERFIL */}
          <div className={styles.card}>
            <div className={styles.userTop}>
              <div className={styles.avatar}>
                {user.username[0].toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <h3 className={styles.username}>
                  {user.username}
                  <span className={styles.role}>{user.role}</span>
                </h3>
                <p className={styles.email}>{user.email}</p>
              </div>
            </div>
            <div className={styles.stats}>
              <div>
                <h4>{money(totalLiquido)}</h4>
                <span>Total ganho (líquido)</span>
              </div>
              <div>
                <h4>{comissaoMedia}%</h4>
                <span>Comissão média</span>
              </div>
              <div>
                <h4>{campanhas}</h4>
                <span>Campanhas</span>
              </div>
              <div>
                <h4>{vendasRealizadas}</h4>
                <span>Vendas realizadas</span>
              </div>
            </div>
          </div>

          {/* CARD GRUPO */}
          {grupo && (
            <div className={styles.card}>
              <div className={styles.integrationHeader}>
                <h3>Seu grupo</h3>
                <span
                  className={`${styles.badge} ${
                    grupo.status === "Ativo"
                      ? styles.badgeSuccess
                      : styles.badgeDanger
                  }`}
                >
                  {grupo.status}
                </span>
              </div>
              <div className={styles.groupCard}>
                <img
                  src={grupo.image}
                  alt={grupo.name}
                  className={styles.groupImage}
                />
                <div className={styles.groupInfo}>
                  <h4>{grupo.name}</h4>
                  <p>Membro ativo</p>
                </div>
                <button
                  className={styles.groupBtn}
                  onClick={() => router.push(`/group/${grupo._id}`)}
                >
                  <LuArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* CARD ATIVIDADES */}
          <div className={styles.card}>
            <h3>Atividades recentes</h3>
            <ul className={styles.activity}>
              {atividades.length === 0 ? (
                <p style={{ color: "#888" }}>Nenhuma atividade encontrada.</p>
              ) : (
                atividades.map((a, i) => (
                  <li key={i}>
                    <span className={styles.activityIcon}>
                      {renderIcon(a.type)}
                    </span>
                    {a.message}{" "}
                    <span className={styles.activityTime}>{a.date}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
