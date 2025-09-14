"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import styles from "../styles/Groups.module.css";
import { LuUsers } from "react-icons/lu";
import Select, { MultiValue } from "react-select";

interface Group {
  _id: string;
  name: string;
  image: string;
  members: string[];
  status?: string;
}

interface User {
  _id: string;
  username: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState({
    name: "",
    image: "",
    members: [] as string[],
  });
  const [showModal, setShowModal] = useState(false);

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
          setUser({ username: data.username });
          carregarGrupos();  // só depois de pegar o user
          carregarUsuarios();
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }
}, [router]);

const carregarGrupos = async () => {
  try {
    const res = await fetch("/api/groups", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error("Erro ao carregar grupos");
    const data = await res.json();
    setGroups(data);
  } catch (err) {
    console.error("❌ Erro:", err);
  } finally {
    setLoading(false);
  }
};

  const carregarUsuarios = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Erro ao carregar usuários");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("❌ Erro usuários:", err);
    }
  };

  const criarGrupo = async () => {
    if (!novo.name) return;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(novo),
      });

      if (!res.ok) throw new Error("Erro ao salvar grupo");

      setNovo({ name: "", image: "", members: [] });
      setShowModal(false);
      carregarGrupos();
    } catch (err) {
      console.error("❌ Erro:", err);
    }
  };

  return (
    <div className={styles.page}>
      <Topbar />
      <Sidebar />

      <main className={styles.main}>
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h1>Grupos</h1>
            <p>Gerencie grupos, membros e campanhas vinculadas.</p>
          </div>

          {groups.length > 0 && (
            <button
              className={styles.btnCriar}
              onClick={() => setShowModal(true)}
            >
              + Criar outro grupo
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: "#888" }}>Carregando...</p>
        ) : groups.length === 0 ? (
          <div className={styles.emptyGrid}>
            <div className={styles.integrationCard}>
              <div className={styles.integrationHeader}>
                <div className={styles.integrationIcon}>
                  <LuUsers />
                </div>
                <div>
                  <h3 className={styles.integrationTitle}>Grupos</h3>
                  <p className={styles.integrationDesc}>
                    Crie seu primeiro grupo e adicione membros.
                  </p>
                </div>
              </div>
              <div className={styles.integrationActions}>
                <button
                  className={styles.btnCriar}
                  onClick={() => setShowModal(true)}
                >
                  + Criar Grupo
                </button>
              </div>
            </div>
          </div>
   ) : (
<div className={styles.grid}>
  {groups.map((group) => (
    <div key={group._id} className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.groupHeader}>
          {group.image ? (
            <img
              src={group.image}
              alt={group.name}
              className={styles.groupImage}
            />
          ) : (
            <LuUsers className={styles.icon} />
          )}
          <h3>{group.name}</h3>
        </div>

        <span
          className={`${styles.status} ${
            group.status === "Ativo" ? styles.rodando : styles.pausado
          }`}
        >
          {group.status}
        </span>
      </div>

{/* quantidade de membros com ícone */}
<div className={styles.membersRow}>
  <LuUsers className={styles.icon} />
  <span>{group.members.length} membros</span>
</div>

<div className={styles.actionsRow}>
  <button
    className={styles.btnAcao}
    onClick={() => router.push(`/group/${encodeURIComponent(group.name)}`)}
  >
    Gerenciar
  </button>
</div>

    </div>
  ))}
</div>

)}


        {/* MODAL CRIAR GRUPO */}
        {showModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Criar Novo Grupo</h3>

              <div className={styles.formGroup}>
                <label>Nome do grupo</label>
                <input
                  type="text"
                  placeholder="Digite o nome do grupo"
                  value={novo.name}
                  onChange={(e) => setNovo({ ...novo, name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Imagem do grupo</label>
                <input
                  type="text"
                  placeholder="URL da imagem"
                  value={novo.image}
                  onChange={(e) => setNovo({ ...novo, image: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Membros do grupo</label>
                <Select
                  options={users.map((u) => ({
                    value: u.username,
                    label: u.username,
                  }))}
                  isMulti
                  placeholder="Selecione membros..."
                  value={novo.members.map((m) => ({ value: m, label: m }))}
                  onChange={(
                    selected: MultiValue<{ value: string; label: string }>
                  ) =>
                    setNovo({
                      ...novo,
                      members: selected.map((s) => s.value),
                    })
                  }
                  classNamePrefix="react-select"
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.btnCancelar}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button className={styles.btnConfirmar} onClick={criarGrupo}>
                  Criar Grupo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
