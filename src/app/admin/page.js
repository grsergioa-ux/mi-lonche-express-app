"use client";
export const dynamic = 'force-dynamic';

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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  FIRESTORE_COLLECTIONS,
  ACTIVE_FIRESTORE_COLLECTIONS,
} from "../../lib/firestoreCollections";

const mapSnapshotToOrders = (snapshot) =>
  snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

const formatOrderDate = (fecha) => {
  if (!fecha) return "Fecha no disponible";
  const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatOrderDay = (fecha) => {
  if (!fecha) return "Sin fecha";
  const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
  return date.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const buttonCommonStyle = {
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "#000",
  color: "white",
  fontWeight: "bold",
  fontFamily: "inherit",
  cursor: "pointer",
};

const cardCommonStyle = {
  background: "#fff",
  padding: 14,
  borderRadius: 10,
  border: "1px solid #ddd",
  color: "black",
  fontFamily: "inherit",
};

const calculateOrderMetrics = (orders) => {
  const ordersBySchool = {};
  const ordersByDay = {};
  const productCounts = {};

  orders.forEach((order) => {
    const school = order.school || "Sin escuela";
    ordersBySchool[school] = (ordersBySchool[school] || 0) + 1;

    const dayKey = formatOrderDay(order.fecha);
    ordersByDay[dayKey] = (ordersByDay[dayKey] || 0) + 1;

    if (Array.isArray(order.products)) {
      order.products.forEach((product) => {
        const productName = product.name || product.id || "Producto desconocido";
        const qty = product.quantity ?? product.qty ?? 1;
        productCounts[productName] = (productCounts[productName] || 0) + qty;
      });
    }
  });

  const topProducts = Object.entries(productCounts)
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .map(([name, count]) => ({ name, count }));

  return {
    totalOrders: orders.length,
    ordersBySchool,
    ordersByDay,
    topProducts,
  };
};

// Transformaciones para gráficas
const getOrdersBySchoolChartData = (ordersBySchool) => {
  if (!ordersBySchool) return [];
  return Object.entries(ordersBySchool).map(([school, count]) => ({
    school,
    count,
  }));
};

const getTopProductsChartData = (topProducts, limit = 8) => {
  if (!Array.isArray(topProducts)) return [];
  return topProducts.slice(0, limit).map((p) => ({ name: p.name, count: p.count }));
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.PEDIDOS, id), {
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
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.PEDIDOS, id));
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
      const colecciones = ACTIVE_FIRESTORE_COLLECTIONS;

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
    setLoading(true);
    setError("");

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.PEDIDOS),
      orderBy("fecha", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPedidos(mapSnapshotToOrders(snapshot));
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Error cargando pedidos:", snapshotError);
        setError("No se pudieron cargar los pedidos. Intenta de nuevo.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const metrics = calculateOrderMetrics(pedidos);

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif", color: "black" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 18 }}>📊 PANEL DE PEDIDOS</h1>

      {/* 🔴 BOTÓN BORRAR BD */}
      <button
        onClick={borrarBaseDatos}
        style={{
          ...buttonCommonStyle,
          background: "red",
          marginBottom: 20,
        }}
      >
        🧨 BORRAR BASE DE DATOS (SOLO PRUEBAS)
      </button>

      {loading && <p>Cargando pedidos...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12, fontWeight: "bold" }}>📈 Métricas</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <div style={{ ...cardCommonStyle, flex: 1, minWidth: 220 }}>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: "bold" }}>Pedidos totales</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>{metrics.totalOrders}</p>
            </div>

            <div style={{ ...cardCommonStyle, flex: 1, minWidth: 220 }}>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: "bold" }}>Pedidos por escuela</h3>
              {Object.keys(metrics.ordersBySchool).length === 0 ? (
                <p style={{ margin: 0 }}>Sin datos</p>
              ) : (
                Object.entries(metrics.ordersBySchool).map(([school, count]) => (
                  <p key={school} style={{ margin: 2 }}>
                    {school}: {count}
                  </p>
                ))
              )}
            </div>

            <div style={{ ...cardCommonStyle, flex: 1, minWidth: 220 }}>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: "bold" }}>Pedidos por día</h3>
              {Object.keys(metrics.ordersByDay).length === 0 ? (
                <p style={{ margin: 0 }}>Sin datos</p>
              ) : (
                Object.entries(metrics.ordersByDay).map(([day, count]) => (
                  <p key={day} style={{ margin: 2 }}>
                    {day}: {count}
                  </p>
                ))
              )}
            </div>

            <div style={{ ...cardCommonStyle, flex: 1, minWidth: 220 }}>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: "bold" }}>Productos más vendidos</h3>
              {metrics.topProducts.length === 0 ? (
                <p style={{ margin: 0 }}>Sin datos</p>
              ) : (
                metrics.topProducts.slice(0, 5).map((product) => (
                  <p key={product.name} style={{ margin: 2 }}>
                    {product.name}: {product.count}
                  </p>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Sección de gráficas */}
      {!loading && !error && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12, fontWeight: "bold" }}>📊 Visualización</h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <div style={{ ...cardCommonStyle, flex: 1, minWidth: 300, height: 360 }}>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: "bold" }}>Pedidos por escuela</h3>

              {Object.keys(metrics.ordersBySchool).length === 0 ? (
                <p>Sin datos para mostrar</p>
              ) : (
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getOrdersBySchoolChartData(metrics.ordersBySchool)} margin={{ right: 20 }}>
                      <XAxis dataKey="school" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1976d2" barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div style={{ ...cardCommonStyle, flex: 1, minWidth: 300, height: 360 }}>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: "bold" }}>Productos más vendidos</h3>

              {metrics.topProducts.length === 0 ? (
                <p>Sin datos para mostrar</p>
              ) : (
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getTopProductsChartData(metrics.topProducts)} margin={{ right: 20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ff9800" barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!loading && pedidos.length === 0 && !error && (
        <p>No hay pedidos registrados</p>
      )}

      {pedidos.map((pedido) => (
        <div
          key={pedido.id}
          style={{
            ...cardCommonStyle,
            border: "1px solid #ccc",
            padding: 18,
            marginBottom: 15,
            background:
              pedido.estado === "pendiente"
                ? "#fff3cd"
                : pedido.estado === "proceso"
                ? "#cce5ff"
                : "#d4edda",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: "bold" }}>Pedido #{pedido.numeroPedido}</h3>

          <p style={{ margin: "8px 0", fontSize: 15 }}><strong>Cliente:</strong> {pedido.nombre}</p>

          <p style={{ margin: "8px 0", fontSize: 15 }}>
            <strong>Estado:</strong>{" "}
            {pedido.estado === "pendiente"
              ? "⚪️ Pendiente"
              : pedido.estado === "proceso"
              ? "🔵 En proceso"
              : "✅ Entregado"}
          </p>

          <h3 style={{ margin: "8px 0", fontSize: 18 }}>Total: ${pedido.total}</h3>

          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {pedido.estado !== "proceso" && pedido.estado !== "entregado" && (
              <button
                onClick={() => cambiarEstado(pedido.id, "proceso")}
                style={{
                  ...buttonCommonStyle,
                  background: "#0000ff",
                  minWidth: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: "white",
                    borderRadius: "50%",
                    marginRight: 8,
                  }}
                ></span>
                En Proceso
              </button>
            )}

            {pedido.estado !== "entregado" && (
              <button
                onClick={() => cambiarEstado(pedido.id, "entregado")}
                style={{
                  ...buttonCommonStyle,
                  background: "#28a745",
                  minWidth: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: "white",
                    borderRadius: "50%",
                    marginRight: 8,
                  }}
                ></span>
                Entregado
              </button>
            )}

            <button
              onClick={() => eliminarPedido(pedido.id)}
              style={{
                ...buttonCommonStyle,
                background: "#f44336",
                minWidth: 120,
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