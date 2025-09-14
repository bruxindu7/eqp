"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Anuncios.module.css";
import {
  LuMegaphone,
  LuDollarSign,
  LuUsers,
  LuPlay,
  LuPause,
} from "react-icons/lu";

interface Anuncio {
  _id: string;
  campanha: string;
  plataforma: string;
  site: string;
  orcamento: number;
  leads: number;
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

export default function AnunciosPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [novo, setNovo] = useState({
    campanha: "",
    plataforma: "",
    site: "",
    orcamento: "",
  });

  const [showModal, setShowModal] = useState(false);

  // editar orçamento
  const [showEditModal, setShowEditModal] = useState(false);
  const [anuncioSelecionado, setAnuncioSelecionado] = useState<Anuncio | null>(
    null
  );
  const [valorAdicional, setValorAdicional] = useState("");

  // grupo vinculado no criar
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
          if (data.username) {
            setUser({ username: data.username });
            await carregarAnuncios();
            await carregarGrupos(token, data.username);
          } else {
            router.push("/login");
          }
        })
        .catch(() => router.push("/login"));
    }
  }, [router]);

  const carregarAnuncios = async () => {
    try {
      const res = await fetch("/api/ads", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Erro ao carregar anúncios");
      const data = await res.json();
      setAnuncios(data);
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
      const meusGrupos = data.filter((g) => g.members.includes(username));
      setGroups(meusGrupos);
    } catch (err) {
      console.error("❌ Erro grupos:", err);
    }
  };

  const criarAnuncio = async () => {
    if (!novo.campanha || !novo.plataforma || !novo.site || !novo.orcamento)
      return;

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...novo,
          orcamento: parseFloat(novo.orcamento),
          groupId: selectedGroup || null,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar anúncio");

      await res.json();

      setNovo({ campanha: "", plataforma: "", site: "", orcamento: "" });
      setSelectedGroup("");
      setShowModal(false);
      carregarAnuncios();
    } catch (err) {
      console.error("❌ Erro:", err);
    }
  };

  const toggleStatus = async (campanha: string, status: string) => {
    try {
      const res = await fetch(`/api/ads`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campanha,
          status: status === "Rodando" ? "Pausado" : "Rodando",
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar status");
      const atualizado = await res.json();

      setAnuncios((prev) =>
        prev.map((ad) =>
          ad.campanha === atualizado.campanha ? { ...ad, ...atualizado } : ad
        )
      );
    } catch (err) {
      console.error("❌ Erro:", err);
    }
  };

  const atualizarOrcamento = async () => {
    if (!anuncioSelecionado || !valorAdicional) return;

    try {
      const incremento = parseFloat(valorAdicional);
      if (isNaN(incremento)) {
        alert("Digite um valor válido!");
        return;
      }

      const res = await fetch(`/api/ads`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campanha: anuncioSelecionado.campanha,
          incremento,
        }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar orçamento");
      const atualizado = await res.json();

      setAnuncios((prev) =>
        prev.map((ad) =>
          ad.campanha === atualizado.campanha ? { ...ad, ...atualizado } : ad
        )
      );

      setShowEditModal(false);
      setValorAdicional("");
      setAnuncioSelecionado(null);
    } catch (err) {
      console.error("❌ Erro:", err);
    }
  };

  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>Anúncios</h1>
            <p>Gerencie suas campanhas e acompanhe resultados.</p>
          </div>

          {anuncios.length > 0 && (
            <button
              className={styles.btnCriar}
              onClick={() => setShowModal(true)}
            >
              + Criar outro anúncio
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: "#888" }}>Carregando...</p>
        ) : anuncios.length === 0 ? (
          <div className={styles.emptyGrid}>
            <div className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.integrationIcon}>
                  <LuMegaphone />
                </div>
                <div>
                  <h3 className={styles.integrationTitle}>Anúncios</h3>
                  <p className={styles.integrationDesc}>
                    Crie sua primeira campanha e acompanhe o desempenho.
                  </p>
                </div>
              </div>
              <div className={styles.integrationActions}>
                <button
                  className={styles.btnCriar}
                  onClick={() => setShowModal(true)}
                >
                  + Criar Anúncio
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {anuncios.map((anuncio) => (
              <div key={anuncio._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <h3>{anuncio.campanha}</h3>
                  <span
                    className={`${styles.status} ${
                      anuncio.status === "Rodando"
                        ? styles.rodando
                        : styles.pausado
                    }`}
                  >
                    {anuncio.status}
                  </span>
                </div>

                <p className={styles.plataforma}>{anuncio.plataforma}</p>

                <div className={styles.infoRow}>
                  <LuUsers className={styles.icon} />
                  {anuncio.groupId ? (
                    <span>
                      Grupo:{" "}
                      {groups.find((g) => g._id === anuncio.groupId)?.name ||
                        "Não encontrado"}
                    </span>
                  ) : (
                    <span>Sem grupo vinculado</span>
                  )}
                </div>

                <div className={styles.infoRow}>
                  <LuDollarSign className={styles.icon} />
                  <span>Orçamento: {money(anuncio.orcamento)}</span>
                </div>

                <div className={styles.infoRow}>
                  <LuUsers className={styles.icon} />
                  <span>Leads: {anuncio.leads}</span>
                </div>

                <div className={styles.actionsRow}>
                  {anuncio.status === "Rodando" && (
                    <button
                      className={styles.btnAcao}
                      onClick={() => {
                        setAnuncioSelecionado(anuncio);
                        setShowEditModal(true);
                      }}
                    >
                      Gerenciar
                    </button>
                  )}
                  <button
                    className={styles.btnAcao}
                    onClick={() =>
                      toggleStatus(anuncio.campanha, anuncio.status)
                    }
                  >
                    {anuncio.status === "Rodando" ? (
                      <>
                        <LuPause /> Pausar
                      </>
                    ) : (
                      <>
                        <LuPlay /> Ativar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL CRIAR */}
        {showModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Criar Novo Anúncio</h3>
              <input
                type="text"
                placeholder="Nome da campanha"
                value={novo.campanha}
                onChange={(e) =>
                  setNovo({ ...novo, campanha: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Plataforma (ex: Facebook Ads)"
                value={novo.plataforma}
                onChange={(e) =>
                  setNovo({ ...novo, plataforma: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Site (ex: freefire)"
                value={novo.site}
                onChange={(e) => setNovo({ ...novo, site: e.target.value })}
              />
              <input
                type="number"
                placeholder="Orçamento (R$)"
                value={novo.orcamento}
                onChange={(e) =>
                  setNovo({ ...novo, orcamento: e.target.value })
                }
              />

              {/* Dropdown grupo */}
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
                          setIsDropdownOpen(false);
                        }}
                      >
                        {g.image && (
                          <img
                            src={g.image}
                            alt={g.name}
                            className={styles.groupIcon}
                          />
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
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button className={styles.btnConfirmar} onClick={criarAnuncio}>
                  Criar Anúncio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR ORÇAMENTO */}
        {showEditModal && anuncioSelecionado && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowEditModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Gerenciar Orçamento</h3>
              <p>
                Campanha: <b>{anuncioSelecionado.campanha}</b>
              </p>
              <p>
                Orçamento atual:{" "}
                <b>{money(anuncioSelecionado.orcamento)}</b>
              </p>

              <input
                type="number"
                placeholder="Adicionar valor (R$)"
                value={valorAdicional}
                onChange={(e) => setValorAdicional(e.target.value)}
              />

              <div className={styles.modalActions}>
                <button
                  className={styles.btnCancelar}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnConfirmar}
                  onClick={atualizarOrcamento}
                >
                  Atualizar Orçamento
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
