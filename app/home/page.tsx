"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/home.module.css";
import {
  LuActivity,
  LuBell,
  LuMegaphone,
  LuArrowRight,
  LuUser,
  LuTrendingUp,
} from "react-icons/lu";

interface Venda {
  _id: string;
  sourceSite: string;
  totalAmount: number;
  netAmount: number;
  status: string; // approved | pending | failed
  createdAt: string;
  ganhoUser?: number; // 👈 novo campo vindo da API
}


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
  } else {
    // 🔑 Chama a API para puxar os dados confiáveis
    fetch("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setUser({
            username: data.username,
            email: data.email,
            role: data.role,
          });
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));

    carregarVendas();
  }
}, [router]);

const carregarVendas = async () => {
  try {
    const res = await fetch("/api/sales", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao carregar vendas");
    const data: Venda[] = await res.json();
    setVendas(data.filter((v) => v.status === "approved")); // só aprovadas
  } catch (err) {
    console.error("❌ Erro ao carregar vendas:", err);
  } finally {
    setLoading(false);
  }
};


  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);


// agora: total líquido
const totalGanho = vendas.reduce((acc, v) => acc + (v.netAmount || 0), 0);

// 💰 total ganho real do usuário (somando ganhos individuais)
const totalGanhoUser = vendas.reduce((acc, v) => acc + (v.ganhoUser || 0), 0);

const sitesUnicos = [...new Set(vendas.map((v) => v.sourceSite))];
const totalOfertas = sitesUnicos.length;

const mediaComissao =
  vendas.length > 0
    ? (
        (vendas.reduce((acc, v) => acc + (v.netAmount || 0), 0) /
          vendas.reduce((acc, v) => acc + (v.totalAmount || 0), 0)) *
        100
      ).toFixed(1)
    : "0";


  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        {/* HEADER */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeadLeft}>
            <h1>Início</h1>
            <p>
              Bem-vindo de volta {user?.username}! Confira suas atividades, perfil e ganhos.
            </p>
            <div className={styles.sectionDivider}>
              <span className={styles.sectionLine}></span>
              <span className={styles.sectionIcon}>
                <LuActivity />
              </span>
              <span className={styles.sectionLine}></span>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div className={styles.cards}>
          {/* Perfil */}
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.cardTitle}>Perfil</span>
              <div className={styles.iconBox}>
                <LuUser />
              </div>
            </div>

            {user ? (
              <div className={styles.profileContent}>
                <div className={styles.avatarCircle}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <div className={styles.profileTop}>
                    <span className={styles.profileName}>{user.username}</span>
                    {/* 🔹 agora mostra o role salvo */}
                    <span className={styles.profileBadge}>{user.role}</span>
                  </div>
                  <p className={styles.profileSub}>
                    Total já ganho: <strong>{money(totalGanho)}</strong>
                  </p>
                  <p className={styles.profileSub}>
                    Comissão média: <strong>{mediaComissao}%</strong>
                  </p>
                </div>
              </div>
            ) : (
              <p className={styles.planEmpty}>Carregando perfil...</p>
            )}
          </div>

          {/* Ofertas */}
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.cardTitle}>Ofertas</span>
              <div className={styles.iconBox}>
                <LuTrendingUp />
              </div>
            </div>

            {loading ? (
              <p className={styles.planEmpty}>Carregando...</p>
            ) : totalOfertas > 0 ? (
              <>
                <p className={styles.plan}>{totalOfertas} ofertas vinculadas</p>
                <div className={styles.expireRow}>
                  <span>Comissão média:</span>
                  <span className={styles.expireDate}>{mediaComissao}%</span>
                </div>
                <div className={styles.divider}></div>
                <h2 className={styles.days}>{money(totalGanho)}</h2>
                <p className={styles.daysrestantes}>Total ganho nas ofertas</p>
              </>
            ) : (
              <>
                <p className={styles.planEmpty}>Nenhuma oferta ativa</p>
                <p className={styles.sub}>
                  Vincule suas ofertas para começar a gerar ganhos.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Últimas Novidades */}
        <div className={styles.news}>
          <div className={styles.newsLeft}>
            <div className={styles.newsIcon}>
              <LuBell />
              <span className={styles.newsBadge}>3</span>
            </div>
            <div>
              <p className={styles.newsTitle}>Últimas Novidades</p>
              <p className={styles.newsDesc}>Novo sistema de tracking de ofertas</p>
            </div>
          </div>
          <LuArrowRight className={styles.newsArrow} />
        </div>

        {/* Anúncios */}
        <div className={styles.announcements}>
          <div className={styles.annHeader}>
            <div className={styles.annHeaderLeft}>
              <div className={styles.annHeaderIcon}>
                <LuMegaphone />
              </div>
              <h3>Anúncios</h3>
            </div>
          </div>

          <div className={styles.annList}>
            <div className={styles.annItem}>
              <div className={styles.annUser}>
                <img
                  src="https://cdn.discordapp.com/embed/avatars/0.png"
                  alt="User"
                />
              </div>
              <div className={styles.annContent}>
                <p className={styles.annUserName}>Sistema</p>
                <p className={styles.annText}>Integração de vendas concluída!</p>
                <span className={styles.annDate}>
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
