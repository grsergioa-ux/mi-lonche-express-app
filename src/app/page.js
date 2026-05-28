"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "welcomeSeen";

export default function Home() {
  const router = useRouter();

  /**
   * ready:
   *   null  → aún verificando localStorage (evita SSR / parpadeo)
   *   false → primera visita, mostrar bienvenida
   *   true  → ya la vio antes, redirigir a /menu
   */
  const [ready, setReady] = useState(null);

  useEffect(() => {
    // localStorage solo existe en el cliente; este bloque nunca corre en SSR
    if (localStorage.getItem(STORAGE_KEY)) {
      router.replace("/menu"); // replace para no dejar la welcome en el historial
    } else {
      setReady(false); // primera visita → mostrar pantalla
    }
  }, [router]);

  const handleEntendido = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    router.push("/menu");
  };

  // Mientras verificamos, mostramos fondo rojo sin contenido (sin parpadeo blanco)
  if (ready !== false) {
    return <div style={{ minHeight: "100vh", background: "#DA291C" }} />;
  }

  return (
    <>
      {/* Keyframe de fade-in — inyectado inline para no depender de archivos externos */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .welcome-card {
          animation: fadeSlideIn 0.6s ease both;
        }
        .welcome-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .welcome-btn:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          background: #1a1a1a !important;
        }
        .welcome-btn:active {
          transform: scale(0.96);
        }
      `}</style>

      {/* Fondo rojo — igual que menu/page.js */}
      <div
        style={{
          minHeight: "100vh",
          background: "#DA291C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Tarjeta central — amarillo igual que las cards del menú */}
        <div
          className="welcome-card"
          style={{
            background: "#FFC72C",
            borderRadius: "20px",
            padding: "40px 32px",
            maxWidth: "380px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: "24px" }}>
            <Image
              src="/icon-512.png"
              alt="Logo Mi Lonche Express"
              width={120}
              height={120}
              style={{ borderRadius: "16px", objectFit: "contain" }}
              priority
            />
          </div>

          {/* Título */}
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "bold",
              color: "#000000",
              margin: "0 0 8px 0",
              lineHeight: 1.2,
            }}
          >
            Bienvenido a
          </h1>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#DA291C",
              margin: "0 0 12px 0",
              lineHeight: 1.2,
            }}
          >
            Mi Lonche Express
          </h2>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "14px",
              color: "#333333",
              margin: "0 0 32px 0",
              lineHeight: 1.5,
            }}
          >
            Fine Bites &amp; Catering — pedidos escolares frescos y deliciosos.
          </p>

          {/* Botón Entendido */}
          <button
            className="welcome-btn"
            onClick={handleEntendido}
            style={{
              background: "#000000",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              padding: "14px 0",
              width: "100%",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </>
  );
}

