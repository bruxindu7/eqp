"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Finance.module.css";
import { LuWallet, LuTrendingUp, LuChevronDown, LuEye } from "react-icons/lu";

interface Venda {
  _id: string;
  transactionId: string;
  sourceSite: string;
  totalAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
  buyer?: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
}

export default function FinancePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);

  // Filtros
  const [filtro, setFiltro] = useState("Todos");
  const [filtroSite, setFiltroSite] = useState("Todos");

  // Dropdowns abertos
  const [openStatus, setOpenStatus] = useState(false);
  const [openSite, setOpenSite] = useState(false);

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendaModal, setVendaModal] = useState<Venda | null>(null);

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
            carregarVendas();
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

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.dropdown}`)) {
        setOpenStatus(false);
        setOpenSite(false);
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
      default:
        return status;
    }
  };

  // 🔹 Filtragem por status
  const vendasFiltradasStatus =
    filtro === "Todos" ? vendas : vendas.filter((v) => mapStatus(v.status) === filtro);

  // 🔹 Lista de sites
  const sites = Array.from(new Set(vendas.map((v) => v.sourceSite)));

  // 🔹 Filtragem final por site
  const vendasFiltradas = vendasFiltradasStatus.filter((v) =>
    filtroSite === "Todos" ? true : v.sourceSite === filtroSite
  );

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
  <div className={styles.kpiCard}>
    <div className={`${styles.kpiIcon} ${styles.iconGreen}`}>
      <LuWallet />
    </div>
    <div>
      <p>Total Aprovado</p>
      <h2>
        {money(
          vendasFiltradas
            .filter((v) => v.status === "paid")
            .reduce((acc, v) => acc + v.totalAmount, 0)
        )}
      </h2>
    </div>
  </div>

  <div className={styles.kpiCard}>
    <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
      <LuWallet />
    </div>
    <div>
      <p>Vendas Pendentes</p>
      <h2>
        {money(
          vendasFiltradas
            .filter((v) => v.status === "pending")
            .reduce((acc, v) => acc + v.totalAmount, 0)
        )}
      </h2>
    </div>
  </div>

  <div className={styles.kpiCard}>
    <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
      <LuTrendingUp />
    </div>
    <div>
      <p>Total Vendas</p>
      <h2>{vendasFiltradas.filter((v) => v.status === "paid").length}</h2>
    </div>
  </div>
</div>

        {/* LISTA DE VENDAS */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3>Últimas Vendas</h3>

            <div style={{ display: "flex", gap: "10px" }}>
              {/* Dropdown Status */}
              <div className={styles.dropdown}>
                <button
                  className={`${styles.dropdownBtn} ${openStatus ? styles.open : ""}`}
                  onClick={() => {
                    setOpenStatus(!openStatus);
                    setOpenSite(false); // fecha o outro
                  }}
                >
                  {filtro} <LuChevronDown className={styles.chevron} />
                </button>
                {openStatus && (
                  <ul className={styles.dropdownMenu}>
                    {["Todos", "Aprovada", "Pendente"].map((opcao) => (
                      <li
                        key={opcao}
                        className={filtro === opcao ? styles.activeItem : ""}
                        onClick={() => {
                          setFiltro(opcao);
                          setOpenStatus(false);
                        }}
                      >
                        {opcao}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Dropdown Sites */}
              <div className={styles.dropdown}>
                <button
                  className={`${styles.dropdownBtn} ${openSite ? styles.open : ""}`}
                  onClick={() => {
                    setOpenSite(!openSite);
                    setOpenStatus(false); // fecha o outro
                  }}
                >
                  {filtroSite === "Todos" ? "Todos os sites" : filtroSite}{" "}
                  <LuChevronDown className={styles.chevron} />
                </button>
                {openSite && (
                  <ul className={styles.dropdownMenu}>
                    <li
                      className={filtroSite === "Todos" ? styles.activeItem : ""}
                      onClick={() => {
                        setFiltroSite("Todos");
                        setOpenSite(false);
                      }}
                    >
                      Todos os sites
                    </li>
                    {sites.map((site) => (
                      <li
                        key={site}
                        className={filtroSite === site ? styles.activeItem : ""}
                        onClick={() => {
                          setFiltroSite(site);
                          setOpenSite(false);
                        }}
                      >
                        {site}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Site</th>
                <th>Comprador</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {vendasFiltradas.map((venda) => (
                <tr key={venda._id}>
                  <td>{venda.sourceSite}</td>
                  <td>{venda.buyer?.name || "—"}</td>
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
                  <td>
                    {new Date(venda.createdAt).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(venda.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <button
                      className={styles.eyeBtn}
                      onClick={() => setVendaModal(venda)}
                      title="Ver detalhes"
                    >
                      <LuEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* MODAL */}
          {vendaModal && (
            <div className={styles.modalOverlay} onClick={() => setVendaModal(null)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3>Detalhes da Venda</h3>

                <div className={styles.buyerInfo}>
                  <p>
                    <strong>Nome:</strong> {vendaModal.buyer?.name || "—"}
                  </p>
                  <p>
                    <strong>Email:</strong> {vendaModal.buyer?.email || "—"}
                  </p>
                  <hr />
                  <p>
                    <strong>Valor:</strong> {money(vendaModal.totalAmount)}
                  </p>
                  <p>
                    <strong>Status:</strong> {mapStatus(vendaModal.status)}
                  </p>
                  <p>
                    <strong>Data:</strong>{" "}
                    {new Date(vendaModal.createdAt).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(vendaModal.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.btnCancelar} onClick={() => setVendaModal(null)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
