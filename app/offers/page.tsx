"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Ofertas.module.css";
import {
  LuTrendingUp,
  LuUsers,
  LuPlay,
  LuPause,
  LuSettings,
  LuDollarSign,   // 💰 bruto
  LuWallet        // 👛 líquido
} from "react-icons/lu";


interface Oferta {
  _id: string;
  nome: string;
  site: string;
  vendas: number;
  receitaBruta: number;
  lucro: number;
  status: string;
  groupId?: string;
}

interface Group {
  _id: string;
  name: string;
  image: string;
  status: string;
  members: string[];
}

export default function OfertasPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [nova, setNova] = useState({ nome: "", site: "" });
  const [showModal, setShowModal] = useState(false);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // modal de gerenciar grupo
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (!data.username) {
            router.push("/login");
            return;
          }
          setUser({ username: data.username });
          await carregarOfertas();
          await carregarGrupos(token, data.username);
        });
    }
  }, [router]);

  const carregarOfertas = async () => {
    try {
      const res = await fetch("/api/ofertas", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao carregar ofertas");
      const data = await res.json();
      setOfertas(data);
    } catch (err) {
      console.error("❌ Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const carregarGrupos = async (token: string, username: string) => {
    try {
      const res = await fetch("/api/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar grupos");
      const data: Group[] = await res.json();
      // só grupos em que o user é membro
      const meusGrupos = data.filter((g) => g.members.includes(username));
      setGroups(meusGrupos);
    } catch (err) {
      console.error("❌ Erro grupos:", err);
    }
  };

  const criarOferta = async () => {
    if (!nova.nome || !nova.site) return;

    try {
      const res = await fetch("/api/ofertas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(nova),
      });

      if (!res.ok) throw new Error("Erro ao salvar oferta");
      await res.json();

      setNova({ nome: "", site: "" });
      setShowModal(false);
      carregarOfertas();
    } catch (err) {
      console.error("❌ Erro:", err);
    }
  };

  const toggleStatus = async (nome: string, status: string) => {
    try {
      const res = await fetch(`/api/ofertas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          status: status === "Ativa" ? "Pausada" : "Ativa",
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar status");
      const atualizado = await res.json();

      setOfertas((prev) =>
        prev.map((oferta) =>
          oferta.nome === atualizado.nome ? { ...oferta, ...atualizado } : oferta
        )
      );
    } catch (err) {
      console.error("❌ Erro:", err);
    }
  };

  const vincularGrupo = async () => {
    if (!selectedOferta || !selectedGroup) return;
    try {
      const res = await fetch("/api/ofertas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: selectedOferta.nome,
          groupId: selectedGroup,
        }),
      });
      if (!res.ok) throw new Error("Erro ao vincular grupo");
      const atualizado = await res.json();

      setOfertas((prev) =>
        prev.map((o) =>
          o._id === atualizado._id ? { ...o, ...atualizado } : o
        )
      );
      setShowGroupModal(false);
      setSelectedGroup("");
      setSelectedOferta(null);
    } catch (err) {
      console.error("❌ Erro vincular grupo:", err);
    }
  };

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>Ofertas</h1>
            <p>Gerencie suas ofertas e acompanhe resultados.</p>
          </div>

          {ofertas.length > 0 && (
            <button
              className={styles.btnCriar}
              onClick={() => setShowModal(true)}
            >
              + Criar outra oferta
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: "#888" }}>Carregando...</p>
        ) : ofertas.length === 0 ? (
          <div className={styles.emptyGrid}>
            <div className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.integrationIcon}>
                  <LuTrendingUp />
                </div>
                <div>
                  <h3 className={styles.integrationTitle}>Ofertas</h3>
                  <p className={styles.integrationDesc}>
                    Crie sua primeira oferta e acompanhe o desempenho.
                  </p>
                </div>
              </div>
              <div className={styles.integrationActions}>
                <button
                  className={styles.btnCriar}
                  onClick={() => setShowModal(true)}
                >
                  + Criar Oferta
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {ofertas.map((oferta) => (
              <div key={oferta._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <h3>{oferta.nome}</h3>
                  <span
                    className={`${styles.status} ${
                      oferta.status === "Ativa" ? styles.ativa : styles.pausada
                    }`}
                  >
                    {oferta.status}
                  </span>
                </div>

{/* Grupo ou vendas */}
<div className={styles.infoRow}>
  <LuUsers className={styles.icon} />
  {oferta.groupId ? (
    <span>
      Grupo:{" "}
      {groups.find((g) => g._id === oferta.groupId)?.name || "Não encontrado"}
    </span>
  ) : (
    <span>Vendas: {oferta.vendas}</span>
  )}
</div>

{/* Receita bruta */}
<div className={styles.infoRow}>
  <LuDollarSign className={styles.icon} />
  <span>Receita bruta: R$ {oferta.receitaBruta?.toFixed(2) || "0.00"}</span>
</div>

{/* Lucro líquido */}
<div className={styles.infoRow}>
  <LuWallet className={styles.icon} />
  <span>Lucro líquido: R$ {oferta.lucro?.toFixed(2) || "0.00"}</span>
</div>




                <div className={styles.actionsRow}>
                  <button
                    className={styles.btnAcao}
                    onClick={() => toggleStatus(oferta.nome, oferta.status)}
                  >
                    {oferta.status === "Ativa" ? (
                      <>
                        <LuPause /> Pausar
                      </>
                    ) : (
                      <>
                        <LuPlay /> Ativar
                      </>
                    )}
                  </button>
                  <button
                    className={styles.btnAcao}
                    onClick={() => {
                      setSelectedOferta(oferta);
                      setShowGroupModal(true);
                    }}
                  >
                    <LuSettings /> Gerenciar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Criar */}
        {showModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Criar Nova Oferta</h3>
              <input
                type="text"
                placeholder="Nome da oferta"
                value={nova.nome}
                onChange={(e) => setNova({ ...nova, nome: e.target.value })}
              />
              <input
                type="text"
                placeholder="Site (ex: freefire)"
                value={nova.site}
                onChange={(e) => setNova({ ...nova, site: e.target.value })}
              />

              <div className={styles.modalActions}>
                <button
                  className={styles.btnCancelar}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button className={styles.btnConfirmar} onClick={criarOferta}>
                  Criar Oferta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Vincular Grupo */}
        {showGroupModal && selectedOferta && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowGroupModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Gerenciar Oferta: {selectedOferta.nome}</h3>
              <p>Selecione o grupo para vincular:</p>
          <div className={styles.dropdown}>
  <button
    type="button"
    className={styles.dropdownBtn}
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  >
    {selectedGroup
      ? groups.find((g) => g._id === selectedGroup)?.name
      : "Selecione um grupo"}
  </button>

  {isDropdownOpen && (
    <ul className={styles.dropdownMenu}>
      {groups.map((g) => (
        <li
          key={g._id}
          className={`${styles.dropdownItem} ${
            selectedGroup === g._id ? styles.activeItem : ""
          }`}
          onClick={() => {
            setSelectedGroup(g._id);
            setIsDropdownOpen(false); // fecha quando seleciona
          }}
        >
          {g.image && (
            <img src={g.image} alt={g.name} className={styles.groupIcon} />
          )}
          {g.name}
        </li>
      ))}
    </ul>
  )}
</div>

              <div className={styles.modalActions}>
                <button
                  className={styles.btnCancelar}
                  onClick={() => setShowGroupModal(false)}
                >
                  Cancelar
                </button>
                <button className={styles.btnConfirmar} onClick={vincularGrupo}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
