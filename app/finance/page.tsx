"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Finance.module.css";
import { LuWallet, LuTrendingUp, LuChevronDown } from "react-icons/lu";

interface Venda {
  _id: string;
  transactionId: string;
  sourceSite: string;
  totalAmount: number;
  netAmount: number;
  status: string; 
  createdAt: string;
}

export default function FinancePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);
  const [filtro, setFiltro] = useState("Todos");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pagina, setPagina] = useState(1);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const porPagina = 9;

  // 🔹 Busca user real no /api/me
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
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
            carregarVendas(); // só carrega vendas depois que o user foi validado
          } else {
            router.push("/login");
          }
        })
        .catch(() => router.push("/login"));
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
      const data = await res.json();
      setVendas(data);
    } catch (err) {
      console.error("❌ Erro:", err);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const mapStatus = (status: string) => {
    switch (status) {
      case "paid":
        return "Aprovada";
      case "pending":
        return "Pendente";
      case "failed":
        return "Reprovada";
      default:
        return status;
    }
  };

  // Filtra vendas
  const vendasFiltradas =
    filtro === "Todos" ? vendas : vendas.filter((v) => mapStatus(v.status) === filtro);

  // Paginação
  const totalPaginas = Math.ceil(vendasFiltradas.length / porPagina);
  const inicio = (pagina - 1) * porPagina;
  const fim = inicio + porPagina;
  const vendasPagina = vendasFiltradas.slice(inicio, fim);

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        {/* HEADER */}
        <div className={styles.header}>
          <h1>Finanças</h1>
          <p>Veja suas vendas e aprovações em tempo real.</p>
        </div>

        {/* KPIs */}
        <div className={styles.kpis}>
          {/* Total aprovado */}
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.iconGreen}`}>
              <LuWallet />
            </div>
            <div>
              <p>Total Aprovado</p>
              <h2>
                {money(
                  vendas
                    .filter((v) => v.status === "paid")
                    .reduce((acc, v) => acc + v.totalAmount, 0)
                )}
              </h2>
            </div>
          </div>

          {/* Vendas pendentes */}
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
              <LuWallet />
            </div>
            <div>
              <p>Vendas Pendentes</p>
              <h2>
                {money(
                  vendas
                    .filter((v) => v.status === "pending")
                    .reduce((acc, v) => acc + v.totalAmount, 0)
                )}
              </h2>
            </div>
          </div>

        {/* Total vendas */}
<div className={styles.kpiCard}>
  <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
    <LuTrendingUp />
  </div>
  <div>
    <p>Total Vendas</p>
    <h2>
      {vendas.filter((v) => v.status === "paid").length}
    </h2>
  </div>
</div>
</div>

        {/* LISTA DE VENDAS */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3>Últimas Vendas</h3>

            {/* Dropdown custom */}
            <div className={styles.dropdown} ref={dropdownRef}>
              <button
                className={`${styles.dropdownBtn} ${open ? styles.open : ""}`}
                onClick={() => setOpen(!open)}
              >
                {filtro} <LuChevronDown className={styles.chevron} />
              </button>
              {open && (
                <ul className={styles.dropdownMenu}>
                  {["Todos", "Aprovada", "Pendente", "Reprovada"].map((opcao) => (
                    <li
                      key={opcao}
                      className={filtro === opcao ? styles.activeItem : ""}
                      onClick={() => {
                        setFiltro(opcao);
                        setPagina(1);
                        setOpen(false);
                      }}
                    >
                      {opcao}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Site</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {vendasPagina.map((venda) => (
                <tr key={venda._id}>
                  <td>{venda.sourceSite}</td>
                  <td>{money(venda.totalAmount)}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        venda.status === "paid"
                          ? styles.badgeSuccess
                          : venda.status === "pending"
                          ? styles.badgePending
                          : styles.badgeDanger
                      }`}
                    >
                      {mapStatus(venda.status)}
                    </span>
                  </td>
                  <td>{new Date(venda.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i + 1}
                  className={`${styles.pageBtn} ${pagina === i + 1 ? styles.activePage : ""}`}
                  onClick={() => setPagina(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
