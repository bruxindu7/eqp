"use client";

import styles from "./Home.module.css";
import Link from "next/link";
import { useState } from "react";
import {
  FaShieldAlt,
  FaBrain,
  FaMicroscope,
  FaTools,
  FaChevronDown,
  FaArrowRight,
  FaUsers,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function HomePage() {
  const services = [
    {
      icon: <FaChartLine size={24} />,
      title: "Consultoria em Analytics",
      desc: "Transforme dados brutos em insights estratégicos com nossa consultoria especializada em Business Intelligence e Data Analytics.",
      tags: ["Dashboard executivo", "KPIs personalizados", "Análise de performance"],
    },
    {
      icon: <FaUsers size={24} />,
      title: "Consultoria Estratégica",
      desc: "Consultores sênior especializados em transformação digital e governança de dados para empresas de todos os portes.",
      tags: ["Estratégia data-driven", "Roadmap personalizado", "Mentoria executiva"],
    },
    {
      icon: <FaShieldAlt size={24} />,
      title: "Segurança da Informação",
      desc: "Proteja seus dados e sistemas com soluções de cibersegurança de última geração.",
      tags: ["Proteção avançada", "Monitoramento 24/7", "Resposta a incidentes"],
    },
  ];

  const [index, setIndex] = useState(0);
  const prevSlide = () =>
    setIndex((prev) => (prev === 0 ? services.length - 1 : prev - 1));
  const nextSlide = () =>
    setIndex((prev) => (prev === services.length - 1 ? 0 : prev + 1));

  return (
    <div className={styles["scanner-container"]}>
      {/* HEADER */}
      <header className={styles["scanner-header"]}>
        <div className={styles["scanner-logo"]}>
          <span>
            Eqp <small>Analytics</small>
          </span>
        </div>

        <nav className={styles["scanner-nav"]}>
          <a href="#servicos">Serviços</a>
          <a href="#planos">Planos</a>
          <a href="#sobre">Sobre</a>
          <a href="#contato">Contato</a>
        </nav>

        <Link href="/login" className={styles["arrow-btn"]} aria-label="Abrir menu">
          <FaArrowRight size={16} />
        </Link>
      </header>

      {/* HERO */}
      <header className={styles["scanner-hero"]}>
        <div className={styles["hero-bg"]}></div>

        <div className={styles["hero-content"]}>
          <div className={styles["hero-badge"]}>
            <span className={styles["badge-dot"]} /> Mais agilidade e clareza na análise de dados
          </div>

          <h1 className={styles["hero-title"]}>
            <span className={styles["shine-line"]}>
              Eleve a segurança da sua plataforma com nosso sistema de{" "}
            </span>
            <span className={styles["hero-highlight"]}>detecção avançada</span>
          </h1>

          <p className={styles["hero-sub"]}>
            Tecnologia de alta precisão para detecção, monitoramento e prevenção
            de atividades irregulares em tempo real.
          </p>

          <div className={styles["hero-actions"]}>
            <Link href="/login" className={`${styles.btn} ${styles["btn-primary"]}`}>
              <span>Acessar Plataforma</span>
              <span className={styles["btn-icon"]}>
                <FaArrowRight size={14} />
              </span>
            </Link>
            <a href="#servicos" className={`${styles.btn} ${styles["btn-ghost"]}`}>
              Conheça Nossos Serviços <FaArrowRight size={14} />
            </a>
          </div>

          <div className={styles["hero-showcase"]}>
            <div className={styles["showcase-card"]}>
              <div className={styles["showcase-window"]}>
                <div className={styles["window-header"]}>
                  <div className={styles["window-dots"]}>
                    <span className={`${styles.dot} ${styles.red}`}></span>
                    <span className={`${styles.dot} ${styles.yellow}`}></span>
                    <span className={`${styles.dot} ${styles.green}`}></span>
                  </div>
                  <div className={styles["window-title"]}>
                    Eqp - Analytics Platform
                  </div>
                  <div className={styles["window-status"]}>
                    <span className={styles["status-dot"]}></span> Live
                  </div>
                </div>
                <img
                  src="/laptop-2.avif"
                  alt="Analytics Platform"
                  className={styles["showcase-image"]}
                />
              </div>
            </div>
          </div>

          <div className={styles["showcase-arrow"]}>
            <FaChevronDown size={20} />
          </div>
        </div>
      </header>

      {/* SERVICES */}
      <section className={styles["services-section"]} id="servicos">
        <div className={styles["services-badge"]}>
          <span className={styles["badge-dot"]} /> Soluções Empresariais
        </div>
        <h2 className={styles["services-title"]}>Nossos Serviços</h2>
        <p className={styles["services-subtitle"]}>
          Soluções completas em análise de dados e consultoria empresarial
          para<br />
          impulsionar seu negócio
        </p>

        <div className={styles["carousel-container"]}>
          <button className={styles["carousel-btn"]} onClick={prevSlide}>
            <FaChevronLeft />
          </button>

          <div className={styles["service-card"]}>
            <div className={styles["service-icon"]}>{services[index].icon}</div>
            <h3 className={styles["service-name"]}>{services[index].title}</h3>
            <p className={styles["service-desc"]}>{services[index].desc}</p>
            <div className={styles["service-tags"]}>
              {services[index].tags.map((tag, i) => (
                <span key={i} className={styles.tag}>
                  <span className={styles["badge-dot"]} /> {tag}
                </span>
              ))}
            </div>
          </div>

          <button className={styles["carousel-btn"]} onClick={nextSlide}>
            <FaChevronRight />
          </button>
        </div>

        <div className={styles["carousel-dots"]}>
          {services.map((_, i) => (
            <span
              key={i}
              className={`${styles["dot-indicator"]} ${
                i === index ? styles.active : ""
              }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
