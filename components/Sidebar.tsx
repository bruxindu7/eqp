"use client";

import styles from "../app/styles/Sidebar.module.css";
import { usePathname, useRouter } from "next/navigation";
import {
  LuLayoutDashboard,
  LuBox,
  LuDatabase,
  LuMegaphone,
  LuCode,
  LuUsers,
  LuUser,
  LuLogOut,
  LuFileText,
  LuTrendingUp,
  LuSettings,
  LuWallet,
  LuBell,
} from "react-icons/lu";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;
  const handleClick = (path: string) => {
    if (isActive(path)) return;
    router.push(path);
  };

  return (
    <aside className={styles.sidebar}>
      {/* Menu principal */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>MENU</h4>

        <button
          onClick={() => handleClick("/home")}
          className={`${styles.navItem} ${isActive("/home") ? styles.active : ""}`}
        >
          <LuLayoutDashboard /> <span>Início</span>
        </button>

        <button
          onClick={() => handleClick("/dashboard")}
          className={`${styles.navItem} ${isActive("/dashboard") ? styles.active : ""}`}
        >
          <LuTrendingUp /> <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleClick("/offers")}
          className={`${styles.navItem} ${isActive("/offers") ? styles.active : ""}`}
        >
          <LuBox /> <span>Ofertas</span>
        </button>

        <button
          onClick={() => handleClick("/ads")}
          className={`${styles.navItem} ${isActive("/ads") ? styles.active : ""}`}
        >
          <LuMegaphone /> <span>Anúncios</span>
        </button>

        <button
          onClick={() => handleClick("/analytics")}
          className={`${styles.navItem} ${isActive("/analytics") ? styles.active : ""}`}
        >
          <LuTrendingUp /> <span>Analytics</span>
        </button>

        <button
          onClick={() => handleClick("/finance")}
          className={`${styles.navItem} ${isActive("/finance") ? styles.active : ""}`}
        >
          <LuWallet /> <span>Finanças</span>
        </button>

        <button
          onClick={() => handleClick("/integrations")}
          className={`${styles.navItem} ${isActive("/integrations") ? styles.active : ""}`}
        >
          <LuCode /> <span>Integrações</span>
        </button>

        {/* 🔹 NOVA ABA GRUPO */}
        <button
          onClick={() => handleClick("/group")}
          className={`${styles.navItem} ${isActive("/group") ? styles.active : ""}`}
        >
          <LuUsers /> <span>Grupo</span>
        </button>
      </div>

      {/* Conta / usuário */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>CONTA</h4>

        <button
          onClick={() => handleClick("/profile")}
          className={`${styles.navItem} ${isActive("/profile") ? styles.active : ""}`}
        >
          <LuUser /> <span>Perfil</span>
        </button>

        <button
          onClick={() => handleClick("/configurations")}
          className={`${styles.navItem} ${isActive("/configurations") ? styles.active : ""}`}
        >
          <LuSettings /> <span>Configurações</span>
        </button>

        <button onClick={() => router.push("/logout")} className={styles.navItem}>
          <LuLogOut /> <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
