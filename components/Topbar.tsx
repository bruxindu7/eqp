"use client";

import styles from "../app/styles/Topbar.module.css";
import Image from "next/image";
import { LuWallet, LuUser, LuLogOut } from "react-icons/lu";

export default function Topbar() {
  return (
    <header className={styles.topbar}>
      {/* LOGO */}
      <div className={styles.scannerLogo}>
        <span>
          Eqp <small>Analytics</small>
        </span>
      </div>

      {/* AÇÕES */}
      <div className={styles.actions}>
        <button className={styles.iconBtn} title="Carteira">
          <LuWallet />
        </button>
        <button className={styles.iconBtn} title="Perfil">
          <LuUser />
        </button>
        <button className={styles.iconBtn} title="Sair">
          <LuLogOut />
        </button>
      </div>
    </header>
  );
}
