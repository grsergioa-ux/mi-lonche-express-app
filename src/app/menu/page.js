"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function Menu() {
  const router = useRouter();

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

  return (
    <div style={{ fontFamily: "sans-serif", background: "#DA291C", minHeight: "100vh",borderRadius: "8px" }}>
      
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
            width={70}
            height={80}
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
              style={{
                background: "#000000",
                color: "white",
                border: "none",
                padding: "10px 14px",
                borderRadius: "8px",
                cursor: "pointer"
              }}
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
                  style={{
                    background: "#000000",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    width: "100%",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  Agregar
                </button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 10
                  }}
                >
                  <button
                    onClick={() => decreaseFromCart(p.id)}
                    style={{
                      background: "#000000",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: "pointer"
                    }}
                  >
                    -
                  </button>

                  <span style={{ fontWeight: "bold" }}>{getQuantity(p.id)}</span>

                  <button
                    onClick={() => addToCart(p)}
                    style={{
                      background: "#000000",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: "pointer"
                    }}
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