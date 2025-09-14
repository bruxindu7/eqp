"use client";

import { useState } from "react";
import styles from "../styles/Login.module.css";
import { FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    codigoUnico: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Conta criada com sucesso!", { theme: "dark" });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        toast.error(data.message || "Erro ao registrar", { theme: "dark" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor", { theme: "dark" });
    }
  };

  return (
    <div className={styles.Login}>
      <ToastContainer />
      <section className={styles["hero-section"]}>
        <div className={styles["hero-wrapper"]}>
          <div
            className={`${styles["hero-content"]} ${styles["login-form-container"]}`}
          >
            <div className={styles["hero-badge"]}>
              <span className={styles["badge-dot"]} /> Criar conta
            </div>

            <h1 className={styles["hero-title"]}>
              <span className={styles["hero-highlight"]}>Flags Scanner</span>
            </h1>

            <p className={styles["hero-sub"]}>
              Crie sua conta para acessar o dashboard e recursos exclusivos.
            </p>

            <form className={styles["login-form"]} onSubmit={handleSubmit}>
              {/* Usuário */}
              <div className={styles["form-group"]}>
                <label>Usuário</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Digite seu usuário"
                  required
                />
              </div>

              {/* Email */}
              <div className={styles["form-group"]}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Digite seu email"
                  required
                />
              </div>

              {/* Senha */}
              <div className={styles["form-group"]}>
                <label>Senha</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              {/* Código único */}
              <div className={styles["form-group"]}>
                <label>Código de Convite</label>
                <input
                  type="text"
                  name="codigoUnico"
                  value={form.codigoUnico}
                  onChange={handleChange}
                  placeholder="Digite o código fornecido"
                  required
                />
              </div>

  {/* Botão */}
<div className={styles["button-group"]}>
  <button
    type="submit"
    className={`${styles.btn} ${styles["btn-primary"]} ${styles["full-width"]}`}
  >
    Criar conta
  </button>
                <hr className={styles.separator} />

                <p className={styles["signup-text"]}>
                  Já tem uma conta?{" "}
                  <a href="/login" className={styles["signup-link"]}>
                    Faça login
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
