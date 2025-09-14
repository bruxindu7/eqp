"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Integracoes.module.css";
import Select, { MultiValue } from "react-select";

import { LuLink, LuCheck, LuX, LuSettings } from "react-icons/lu";

type FormDataType = {
  nome?: string;
  apiKey?: string;
  webhook?: string;
  token?: string;
  phone?: string;
  eventos?: string[];
};

const optionsEventos = [
  { value: "pix", label: "Pix Gerado" },
  { value: "aprovada", label: "Compra Aprovada" },
];

export default function IntegracoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [integracaoAtiva, setIntegracaoAtiva] = useState<{
    id: number;
    nome: string;
    status: string;
    descricao: string;
  } | null>(null);
  const [formData, setFormData] = useState<FormDataType>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setUser({ username: "bruxin" });
    }
  }, [router]);

  const integracoes = [
    {
      id: 1,
      nome: "BuckPay",
      status: "Ativo",
      descricao: "Pagamentos Pix com avisos automáticos",
    },
    {
      id: 2,
      nome: "Discord",
      status: "Ativo",
      descricao: "Webhook para notificações de vendas",
    },
    {
      id: 3,
      nome: "Telegram",
      status: "Inativo",
      descricao: "Notificações rápidas no Telegram",
    },
    {
      id: 4,
      nome: "WhatsApp",
      status: "Inativo",
      descricao: "Notificações automáticas de vendas",
    },
  ];

  const abrirModal = (int: {
    id: number;
    nome: string;
    status: string;
    descricao: string;
  }) => {
    setIntegracaoAtiva(int);
    setFormData({});
    setModalOpen(true);
  };

  const fecharModal = () => {
    setIntegracaoAtiva(null);
    setModalOpen(false);
  };

  const handleInputChange = <K extends keyof FormDataType>(
    field: K,
    value: FormDataType[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderInputs = () => {
    if (!integracaoAtiva) return null;

    switch (integracaoAtiva.nome) {
      case "BuckPay":
        return (
          <>
            <label>Chave API</label>
            <input
              type="text"
              placeholder="Digite sua chave da BuckPay"
              value={formData.apiKey || ""}
              onChange={(e) => handleInputChange("apiKey", e.target.value)}
            />
          </>
        );
      case "Discord":
        return (
          <>
            <label>Webhook URL</label>
            <input
              type="text"
              placeholder="URL do Webhook"
              value={formData.webhook || ""}
              onChange={(e) => handleInputChange("webhook", e.target.value)}
            />
          </>
        );
      case "Telegram":
        return (
          <>
            <label>Token do Bot</label>
            <input
              type="text"
              placeholder="123456:ABC-DEF..."
              value={formData.token || ""}
              onChange={(e) => handleInputChange("token", e.target.value)}
            />
          </>
        );
      case "WhatsApp":
        return (
          <>
            <label>Número WhatsApp</label>
            <input
              type="text"
              placeholder="+55 11 99999-9999"
              value={formData.phone || ""}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </>
        );
      default:
        return <p>Sem configurações adicionais.</p>;
    }
  };

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        {/* HEADER */}
        <div className={styles.header}>
          <h1>Integrações</h1>
          <p>Gerencie suas conexões com serviços externos.</p>
        </div>

        {/* LISTA DE INTEGRAÇÕES */}
        <div className={styles.integrationsGrid}>
          {integracoes.map((int) => (
            <div key={int.id} className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.integrationIcon}>
                  <LuLink />
                </div>
                <div className={styles.integrationInfo}>
                  <h3>{int.nome}</h3>
                  <p>{int.descricao}</p>
                </div>
                <span
                  className={`${styles.badge} ${
                    int.status === "Ativo"
                      ? styles.badgeSuccess
                      : styles.badgeDanger
                  }`}
                >
                  {int.status === "Ativo" ? <LuCheck /> : <LuX />} {int.status}
                </span>
              </div>

              <div className={styles.integrationActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => abrirModal(int)}
                >
                  <LuSettings /> Gerenciar
                </button>
                {int.status === "Ativo" ? (
                  <button className={styles.btnGhost}>Desconectar</button>
                ) : (
                  <button className={styles.btnGhost}>Conectar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {modalOpen && integracaoAtiva && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Gerenciar {integracaoAtiva.nome}</h2>

            <div className={styles.modalForm}>
              {/* Nome */}
              <div className={styles.formGroup}>
                <label>Nome</label>
                <input
                  type="text"
                  placeholder="Nome da integração"
                  value={formData.nome || ""}
                  onChange={(e) =>
                    handleInputChange("nome", e.target.value)
                  }
                />
              </div>

              {/* Inputs específicos */}
              <div className={styles.formGroup}>{renderInputs()}</div>

              {/* Dropdown eventos */}
              <div className={styles.formGroup}>
                <label>Eventos</label>
                <Select
                  options={optionsEventos}
                  isMulti
                  placeholder="Selecione eventos..."
                  value={optionsEventos.filter((opt) =>
                    (formData.eventos || []).includes(opt.value)
                  )}
                  onChange={(selected: MultiValue<{ value: string; label: string }>) =>
                    handleInputChange(
                      "eventos",
                      selected.map((s) => s.value)
                    )
                  }
                  classNamePrefix="react-select"
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={fecharModal}>
                Cancelar
              </button>
              <button className={styles.btnPrimary}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
