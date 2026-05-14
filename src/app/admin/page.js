"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "pedidos", id), {
        estado: nuevoEstado,
      });
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };

  const eliminarPedido = async (id) => {
    const confirmar = confirm("¿Seguro que deseas eliminar este pedido?");
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "pedidos", id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // 🔥 NUEVA FUNCIÓN: BORRAR TODA LA BASE DE DATOS
  const borrarBaseDatos = async () => {
    const confirmacion1 = confirm("⚠️ ¿Seguro que deseas borrar TODOS los datos?");
    if (!confirmacion1) return;

    const confirmacion2 = confirm("🚨 Esta acción no se puede deshacer. ¿Continuar?");
    if (!confirmacion2) return;

    try {
      const colecciones = ["pedidos", "escuelas"];

      for (const col of colecciones) {
        const snapshot = await getDocs(collection(db, col));

        const promesas = snapshot.docs.map((d) =>
          deleteDoc(doc(db, col, d.id))
        );

        await Promise.all(promesas);
      }

      alert("✅ Base de datos borrada correctamente");
    } catch (error) {
      console.error("Error al borrar datos:", error);
      alert("❌ Error al borrar la base de datos");
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, "pedidos"),
      orderBy("fecha", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPedidos(lista);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>📊 PANEL DE PEDIDOS</h1>

      {/* 🔴 BOTÓN BORRAR BD */}
      <button
        onClick={borrarBaseDatos}
        style={{
          background: "red",
          color: "white",
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          border: "none",
          fontWeight: "bold",
        }}
      >
        🧨 BORRAR BASE DE DATOS (SOLO PRUEBAS)
      </button>

      {pedidos.length === 0 && (
        <p>No hay pedidos registrados</p>
      )}

      {pedidos.map((pedido) => (
        <div
          key={pedido.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 10,
            padding: 15,
            marginBottom: 15,
            background:
              pedido.estado === "pendiente"
                ? "#fff3cd"
                : pedido.estado === "proceso"
                ? "#cce5ff"
                : "#d4edda",
          }}
        >
          <h3>Pedido #{pedido.numeroPedido}</h3>

          <p><strong>Cliente:</strong> {pedido.nombre}</p>

          <p>
            <strong>Estado:</strong>{" "}
            {pedido.estado === "pendiente"
              ? "⚪️ Pendiente"
              : pedido.estado === "proceso"
              ? "🔵 En proceso"
              : "✅ Entregado"}
          </p>

          <h3>Total: ${pedido.total}</h3>

          <div style={{ marginTop: 10 }}>
            {pedido.estado !== "proceso" && pedido.estado !== "entregado" && (
              <button
                onClick={() => cambiarEstado(pedido.id, "proceso")}
                style={{ marginLeft: 10 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: "blue",
                    borderRadius: "50%",
                    marginRight: 5,
                  }}
                ></span>
                En Proceso
              </button>
            )}

            {pedido.estado !== "entregado" && (
              <button
                onClick={() => cambiarEstado(pedido.id, "entregado")}
                style={{ marginLeft: 10 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: "green",
                    borderRadius: "50%",
                    marginRight: 5,
                  }}
                ></span>
                Entregado
              </button>
            )}

            <button
              onClick={() => eliminarPedido(pedido.id)}
              style={{
                marginLeft: 10,
                color: "black",
              }}
            >
              ❌ Eliminar
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}