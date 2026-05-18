"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "../context/CartContext";

export default function Menu() {
  const router = useRouter();
  const [activeButtonId, setActiveButtonId] = useState(null);
  const [pressedButtonId, setPressedButtonId] = useState(null);

  const products = [
    {
      id: 1,
      name: "Lonche Clásico",
      price: 50,
      image: "/images/Lonche_Clasico.jpg"
    },
    {
      id: 2,
      name: "Lonche Saludable",
      price: 75,
      image: "/images/Lonche_Saludable.jpg"
    },
    {
      id: 3,
      name: "Lonche Premium",
      price: 100,
      image: "/images/Lonche_Premium.jpg"
    }
  ];

  const { cart, addToCart, decreaseFromCart } = useCart();

  const getQuantity = (id) => {
    return cart.filter(item => item.id === id).length;
  };

  // Estilos base para botones
  const baseButtonStyle = {
    transition: "all 0.2s ease",
    cursor: "pointer",
    fontWeight: "bold"
  };

  // Estilo botón "Agregar"
  const getAddButtonStyle = (id) => ({
    ...baseButtonStyle,
    background: "#000000",
    color: "white",
    border: "none",
    padding: "12px 16px",
    width: "100%",
    borderRadius: "12px",
    boxShadow: activeButtonId === id ? "0 8px 16px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
    transform: pressedButtonId === id ? "scale(0.95)" : activeButtonId === id ? "scale(1.05)" : "scale(1)"
  });

  // Estilo botón "Ir al carrito"
  const getCheckoutButtonStyle = (id) => ({
    ...baseButtonStyle,
    background: pressedButtonId === id ? "linear-gradient(135deg, #1a1a1a, #333333)" : activeButtonId === id ? "linear-gradient(135deg, #1a1a1a, #2a2a2a)" : "linear-gradient(135deg, #000000, #1a1a1a)",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: "12px",
    boxShadow: activeButtonId === id ? "0 6px 14px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.25)",
    transform: pressedButtonId === id ? "scale(0.95)" : activeButtonId === id ? "scale(1.05)" : "scale(1)"
  });

  // Estilo botones +/-
  const getIncrementButtonStyle = (id, type) => {
    const isPressed = pressedButtonId === `${id}-${type}`;
    const isActive = activeButtonId === `${id}-${type}`;
    return {
      ...baseButtonStyle,
      background: isActive ? "#222222" : "#000000",
      color: "white",
      border: "none",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      boxShadow: isActive ? "0 4px 10px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.2)",
      transform: isPressed ? "scale(0.9)" : isActive ? "scale(1.1)" : "scale(1)"
    };
  };

  // Estilo cantidad
  const getQuantityStyle = {
    fontWeight: "bold",
    fontSize: "18px",
    minWidth: "40px",
    textAlign: "center",
    transition: "transform 0.2s ease"
  };

  return (
    <div style={{ fontFamily: "sans-serif", background: "#DA291C", minHeight: "100vh", borderRadius: "8px" }}>
      
      {/* Header */}
      <div
        style={{
          background: "#FFFFFF",
          color: "black",
          padding: "16px",
          fontSize: "20px",
          fontWeight: "bold",
          position: "sticky",
          top: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer"
        }}
        onClick={() => router.push("/cart")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src="/icon-192.png"
            alt="Icono Mi Lonche"
            width={60}
            height={70}
            style={{ borderRadius: 8 }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontWeight: "bold" }}>Mi Lonche Express</span>
            <span style={{ fontSize: 14 }}>Fine Bites & Catering</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>🛒 {cart.length}</span>
          {cart.length > 0 && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                router.push("/cart");
              }}
              onMouseEnter={() => setActiveButtonId("checkout")}
              onMouseLeave={() => {
                setActiveButtonId(null);
                setPressedButtonId(null);
              }}
              onMouseDown={() => setPressedButtonId("checkout")}
              onMouseUp={() => setPressedButtonId(null)}
              style={getCheckoutButtonStyle("checkout")}
            >
              Ir al Carrito
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div
        style={{
          padding: "16px",
          display: "grid",
          gap: "16px"
        }}
      >
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              marginBottom: 15,
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 10,
              display: "flex",
              gap: 15,
              alignItems: "center",
              background: "#FFC72C"
            }}
          >
            
            {/* 🖼️ IMAGEN */}
            <img
              src={p.image}
              alt={p.name}
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                borderRadius: 10
              }}
            />

            {/* 📦 INFO */}
            <div style={{ flex: 1 }}>
              <h3>{p.name}</h3>
              <p style={{ fontWeight: "bold" }}>${p.price}</p>

              {getQuantity(p.id) === 0 ? (
                <button
                  onClick={() => addToCart(p)}
                  onMouseEnter={() => setActiveButtonId(`add-${p.id}`)}
                  onMouseLeave={() => {
                    setActiveButtonId(null);
                    setPressedButtonId(null);
                  }}
                  onMouseDown={() => setPressedButtonId(`add-${p.id}`)}
                  onMouseUp={() => setPressedButtonId(null)}
                  style={getAddButtonStyle(`add-${p.id}`)}
                >
                  Agregar
                </button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 10,
                    gap: "12px"
                  }}
                >
                  <button
                    onClick={() => decreaseFromCart(p.id)}
                    onMouseEnter={() => setActiveButtonId(`dec-${p.id}`)}
                    onMouseLeave={() => {
                      setActiveButtonId(null);
                      setPressedButtonId(null);
                    }}
                    onMouseDown={() => setPressedButtonId(`dec-${p.id}`)}
                    onMouseUp={() => setPressedButtonId(null)}
                    style={getIncrementButtonStyle(p.id, "dec")}
                  >
                    −
                  </button>

                  <span style={getQuantityStyle}>{getQuantity(p.id)}</span>

                  <button
                    onClick={() => addToCart(p)}
                    onMouseEnter={() => setActiveButtonId(`inc-${p.id}`)}
                    onMouseLeave={() => {
                      setActiveButtonId(null);
                      setPressedButtonId(null);
                    }}
                    onMouseDown={() => setPressedButtonId(`inc-${p.id}`)}
                    onMouseUp={() => setPressedButtonId(null)}
                    style={getIncrementButtonStyle(p.id, "inc")}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}