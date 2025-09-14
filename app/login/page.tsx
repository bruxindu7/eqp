"use client";

import { useState } from "react";
import styles from "../styles/Login.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

    if (res.ok) {
  if (data.token) localStorage.setItem("token", data.token);
  if (data.username) localStorage.setItem("username", data.username);
  if (data.email) localStorage.setItem("email", data.email);
  if (data.role) localStorage.setItem("role", data.role);

await fetch("/api/activities", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: data.username, // 🔑 já funciona mesmo sem userId
    type: "login",
    message: "Login realizado com sucesso",
  }),
});


  toast.success("Login realizado com sucesso!", {
    position: "top-right",
    autoClose: 3000,
    theme: "dark",
  });

  setTimeout(() => {
    window.location.href = "/home";
  }, 1500);
      } else {
        toast.error(data.message || "Erro no login", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
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
              <span className={styles["badge-dot"]} /> Bem-vindo de volta
            </div>

            <h1 className={styles["hero-title"]}>
              <span className={styles["hero-highlight"]}>Eqp Analytics - Login</span>
            </h1>

            <p className={styles["hero-sub"]}>
              Faça login para acessar o dashboard e recursos exclusivos.
            </p>

            <form className={styles["login-form"]} onSubmit={handleSubmit}>
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

              <div className={styles["button-group"]}>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles["btn-primary"]} ${styles["full-width"]}`}
                >
                  Entrar
                </button>

                <hr className={styles.separator} />

                <p className={styles["signup-text"]}>
                  Não tem uma conta?{" "}
                  <a href="/register" className={styles["signup-link"]}>
                    Cadastre-se
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
