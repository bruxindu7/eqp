"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../../styles/GroupManage.module.css";
import Select from "react-select";
import {
  LuUsers,
  LuMegaphone,
  LuPause,
  LuPlay,
  LuDollarSign,
} from "react-icons/lu";

interface Oferta {
  _id: string;
  nome: string;
  site: string;
  status: string;
  vendas: number;
  valorTotal?: number;
  valorLiquido?: number;
}

interface Group {
  _id: string;
  name: string;
  image: string;
  members: string[];
  status: string;
  ofertas?: Oferta[];
}

export default function GroupManagePage() {
  const router = useRouter();
  const { id } = useParams(); // esse id é o nome do grupo
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const [acaoSelecionada, setAcaoSelecionada] = useState<string | null>(null);
  const [novoMembro, setNovoMembro] = useState("");
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<
    { value: string; label: string }[]
  >([]);

  const [showModal, setShowModal] = useState(false);
  const [membroSelecionado, setMembroSelecionado] = useState<string | null>(
    null
  );
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<
    string | null
  >(null);
  const [percentual, setPercentual] = useState("");

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    carregarGrupo();
  }, [id, router]);

  useEffect(() => {
    if (acaoSelecionada === "adicionar") {
      carregarUsuarios();
    }
  }, [acaoSelecionada]);

  const carregarGrupo = async () => {
    try {
      const res = await fetch(`/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setGroup(data);
    } catch (err) {
      console.error("❌ Erro grupo:", err);
    } finally {
      setLoading(false);
    }
  };

  const carregarUsuarios = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar usuários");
      const data = await res.json();

      const membrosAtuais = new Set(group?.members || []);
      const disponiveis = data
        .filter((u: any) => !membrosAtuais.has(u.username))
        .map((u: any) => ({ value: u.username, label: u.username }));

      setUsuariosDisponiveis(disponiveis);
    } catch (err) {
      console.error("❌ Erro ao carregar usuários:", err);
    }
  };

  const salvarPercentual = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let body: any = {};

    if (acaoSelecionada === "adicionar") {
      body = { action: "adicionar", membro: novoMembro };
    }

    if (acaoSelecionada === "remover") {
      body = { action: "remover", membro: membroSelecionado };
    }

    if (acaoSelecionada === "percentual") {
      body = {
        action: "percentual",
        membro: membroSelecionado,
        campanhaId: campanhaSelecionada,
        percentual,
      };
    }

    const res = await fetch(`/api/groups/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      await carregarGrupo();
      setShowModal(false);
      setAcaoSelecionada(null);
      setMembroSelecionado(null);
      setNovoMembro("");
      setCampanhaSelecionada(null);
      setPercentual("");
    } else {
      const err = await res.json();
      console.error("❌ Erro ao salvar:", err);
      alert("Erro: " + (err.error || "Não foi possível atualizar o grupo"));
    }
  };

  if (loading)
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );

  if (!group) return <p style={{ color: "#888" }}>Grupo não encontrado</p>;

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.groupHeader}>
            {group?.image ? (
              <img
                src={group.image}
                alt={group?.name || "Grupo"}
                className={styles.groupAvatar}
              />
            ) : (
              <div className={styles.groupPlaceholder}>
                {(group?.name?.charAt(0).toUpperCase()) || "?"}
              </div>
            )}
            <div>
              <h1>{group?.name || "Sem nome"}</h1>
              <p>
                {(group?.members?.length ?? 0)} membros •{" "}
                {(group?.ofertas?.length ?? 0)} campanhas vinculadas
              </p>
            </div>
          </div>
        </div>

        {/* MEMBROS */}
        <h2 style={{ marginBottom: "10px" }}>Membros</h2>
        {(group?.members?.length ?? 0) === 0 ? (
          <div className={styles.emptyGrid}>
            <div className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.integrationIcon}>
                  <LuUsers />
                </div>
                <div>
                  <h3 className={styles.integrationTitle}>Nenhum membro</h3>
                  <p className={styles.integrationDesc}>
                    Adicione membros para começar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <h3>Gerenciar membros</h3>
                <span
                  className={`${styles.status} ${
                    group?.status === "Ativo"
                      ? styles.rodando
                      : styles.pausado
                  }`}
                >
                  {group?.status || "Desconhecido"}
                </span>
              </div>
              <p className={styles.plataforma}>
                Configure os percentuais de participação por campanha
              </p>
              <div className={styles.actionsRow}>
                <button
                  className={styles.btnAcao}
                  onClick={() => setShowModal(true)}
                >
                  <LuUsers /> Abrir Gerenciamento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CAMPANHAS */}
        <h2 style={{ margin: "20px 0 10px" }}>Campanhas vinculadas</h2>
        {!group?.ofertas || group.ofertas.length === 0 ? (
          <div className={styles.emptyGrid}>
            <div className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.integrationIcon}>
                  <LuMegaphone />
                </div>
                <div>
                  <h3 className={styles.integrationTitle}>Sem campanhas</h3>
                  <p className={styles.integrationDesc}>
                    Nenhuma campanha vinculada a este grupo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {group.ofertas.map((o) => (
              <div key={o._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <h3>{o.nome}</h3>
                  <span
                    className={`${styles.status} ${
                      o.status === "Ativa" ? styles.rodando : styles.pausado
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <LuUsers className={styles.icon} />
                  <span>Vendas: {o.vendas}</span>
                </div>

                <div className={styles.infoRow}>
                  <LuDollarSign className={styles.icon} />
                  <span>
                    Valor líquido: R$ {o.valorLiquido?.toFixed(2) || "0.00"}
                  </span>
                </div>

                <div className={styles.actionsRow}>
                  <button className={styles.btnAcao}>
                    {o.status === "Ativa" ? (
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

        {/* MODAL GERENCIAR MEMBROS */}
        {showModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Gerenciar membros</h3>

              {/* Tipo de ação */}
              <div className={styles.formGroup}>
                <label>Ação</label>
                <Select
                  options={[
                    { value: "percentual", label: "Alterar Percentual" },
                    { value: "adicionar", label: "Adicionar Membro" },
                    { value: "remover", label: "Remover Membro" },
                  ]}
                  placeholder="Selecione uma ação..."
                  onChange={(selected) =>
                    setAcaoSelecionada(selected?.value || null)
                  }
                  classNamePrefix="react-select"
                />
              </div>

              {/* Se a ação for alterar percentual */}
              {acaoSelecionada === "percentual" && (
                <>
                  <div className={styles.formGroup}>
                    <label>Membro</label>
                    <Select
                      options={(group?.members || []).map((m) => ({
                        value: m,
                        label: m,
                      }))}
                      placeholder="Selecione um membro..."
                      onChange={(selected) =>
                        setMembroSelecionado(selected?.value || null)
                      }
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Campanha</label>
                    <Select
                      options={(group?.ofertas || []).map((o) => ({
                        value: o._id,
                        label: o.nome,
                      }))}
                      placeholder="Selecione uma campanha..."
                      onChange={(selected) =>
                        setCampanhaSelecionada(selected?.value || null)
                      }
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Percentual (%)</label>
                    <input
                      type="number"
                      placeholder="Digite a %"
                      value={percentual}
                      onChange={(e) => setPercentual(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Se a ação for adicionar */}
              {acaoSelecionada === "adicionar" && (
                <div className={styles.formGroup}>
                  <label>Novo membro</label>
                  <Select
                    options={usuariosDisponiveis}
                    placeholder="Selecione um usuário..."
                    onChange={(selected) =>
                      setNovoMembro(selected?.value || "")
                    }
                    classNamePrefix="react-select"
                  />
                </div>
              )}

              {/* Se a ação for remover */}
              {acaoSelecionada === "remover" && (
                <div className={styles.formGroup}>
                  <label>Membro</label>
                  <Select
                    options={(group?.members || []).map((m) => ({
                      value: m,
                      label: m,
                    }))}
                    placeholder="Selecione o membro para remover..."
                    onChange={(selected) =>
                      setMembroSelecionado(selected?.value || null)
                    }
                    classNamePrefix="react-select"
                  />
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  className={styles.btnCancelar}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnConfirmar}
                  onClick={salvarPercentual}
                >
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
