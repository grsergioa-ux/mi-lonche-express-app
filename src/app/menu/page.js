"use client";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function Menu() {
  const router = useRouter();

  const products = [
    {
      id: 1,
      name: "Hamburguesa Clásica",
      price: 89,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
    },
    {
      id: 2,
      name: "Hot Dog Especial",
      price: 59,
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349"
    },
    {
      id: 3,
      name: "Papas con Queso",
      price: 49,
      image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
    }
  ];

  const { cart, addToCart, decreaseFromCart } = useCart();

  const getQuantity = (id) => {
    return cart.filter(item => item.id === id).length;
  };

  return (
    <div style={{ fontFamily: "sans-serif", background: "#f5f5f5", minHeight: "100vh" }}>
      
      {/* Header */}
      <div
        style={{
          background: "#d62828",
          color: "white",
          padding: "16px",
          fontSize: "20px",
          fontWeight: "bold",
          position: "sticky",
          top: 0,
          display: "flex",
          justifyContent: "space-between",
          cursor: "pointer"
        }}
        onClick={() => router.push("/cart")}
      >
        <span>Mi Lonche Express 🍔</span>
        <span>🛒 {cart.length}</span>
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
              background: "white"
            }}
          >
            
            {/* 🖼️ IMAGEN */}
            <img
              src={p.image}
              alt={p.name}
              style={{
                width: 80,
                height: 80,
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
                    background: "#f77f00",
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
                  <button onClick={() => decreaseFromCart(p.id)}>
                    -
                  </button>

                  <span>{getQuantity(p.id)}</span>

                  <button onClick={() => addToCart(p)}>
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