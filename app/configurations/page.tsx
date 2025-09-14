"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Configuracoes.module.css";
import {
  LuUser,
  LuMail,
  LuBell,
  LuKey,
  LuShield,
  LuMoon,
} from "react-icons/lu";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    username: string;
    email: string;
    role?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true); // 👈 estado de loading

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
            email: data.email,
            role: data.role,
          });
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false)); // 👈 encerra loading
  }, [router]);

  // 👇 Tela de carregamento
  if (loading)
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );

  if (!user) return null;

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        {/* HEADER */}
        <div className={styles.header}>
          <h1>Configurações</h1>
          <p>Gerencie sua conta, preferências e segurança.</p>
        </div>

        <div className={styles.grid}>
          {/* CONTA */}
          <div className={styles.card}>
            <h3>Conta</h3>
            <div className={styles.formGroup}>
              <label>
                <LuUser /> Nome de usuário
              </label>
              <input type="text" defaultValue={user.username} />
            </div>
            <div className={styles.formGroup}>
              <label>
                <LuMail /> Email
              </label>
              <input type="email" defaultValue={user.email} />
            </div>
          </div>

          {/* NOTIFICAÇÕES */}
          <div className={styles.card}>
            <h3>Notificações</h3>
            <div className={styles.toggle}>
              <LuBell />
              <span>Receber notificações por email</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div className={styles.toggle}>
              <LuBell />
              <span>Notificações push</span>
              <input type="checkbox" />
            </div>
          </div>

          {/* SEGURANÇA */}
          <div className={styles.card}>
            <h3>Segurança</h3>
            <div className={styles.formGroup}>
              <label>
                <LuKey /> Alterar senha
              </label>
              <input type="password" placeholder="Nova senha" />
            </div>
            <div className={styles.formGroup}>
              <label>
                <LuShield /> 2FA (Autenticação em 2 fatores)
              </label>
              <button className={styles.btnPrimary}>Ativar</button>
            </div>
          </div>

          {/* PREFERÊNCIAS */}
          <div className={styles.card}>
            <h3>Preferências</h3>
            <div className={styles.toggle}>
              <LuMoon />
              <span>Modo escuro</span>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
