"use client";
import { useCart } from "../context/CartContext";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase";
import { doc, serverTimestamp, runTransaction } from "firebase/firestore";

export default function Cart() {
  const { cart, addToCart, decreaseFromCart, clearCart } = useCart();
  const router = useRouter();

  // 🧾 CLIENTE
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [indicaciones, setIndicaciones] = useState("");

  // 🏫 ESCUELAS
  const [schools, setSchools] = useState([
    { name: "Primaria Benito Juárez", address: "Calle 1" },
    { name: "Secundaria Técnica 5", address: "Calle 2" }
  ]);

  const [selectedSchool, setSelectedSchool] = useState("");
  const [newSchool, setNewSchool] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(null);
  const savingRef = useRef(false);

  // 🔍 Obtener escuela seleccionada
  const selectedSchoolData = schools.find(
    (s) => s.name === selectedSchool
  );

  // 🔥 AGRUPAR PRODUCTOS
  const grouped = cart.reduce((acc, item) => {
    const existing = acc.find(p => p.id === item.id);
    if (existing) existing.qty += 1;
    else acc.push({ ...item, qty: 1 });
    return acc;
  }, []);

  const total = grouped.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  // ✅ VALIDACIONES
  const isValidName = /^[a-zA-Z0-9\s]+$/.test(name);
  const isValidPhone = /^[0-9]{10,12}$/.test(phone);

  const hasSchool =
    selectedSchool && selectedSchool !== "new"
      ? Boolean(selectedSchool)
      : Boolean(newSchool && newAddress);

  const isFormValid =
    grouped.length > 0 &&
    isValidName &&
    isValidPhone &&
    hasSchool;

  // ➕ AGREGAR ESCUELA
  const addSchool = () => {
    if (newSchool && newAddress) {
      setSchools([...schools, { name: newSchool, address: newAddress }]);
      setSelectedSchool(newSchool);
      setNewSchool("");
      setNewAddress("");
    }
  };

  // 🔥 GUARDAR PEDIDO EN FIRESTORE
  const saveOrder = async () => {
    if (savingRef.current) return null;
    if (savedOrderId) return savedOrderId;
    // marcar síncronamente para evitar múltiples llamadas desde clics rápidos
    savingRef.current = true;
    setIsSaving(true);

    const address = selectedSchoolData?.address || newAddress;
    const productsForOrder = grouped.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.qty,
      price: i.price
    }));

    try {
      const orderId = await runTransaction(db, async (tx) => {
        const counterRef = doc(db, "counters", "orders");
        const counterSnap = await tx.get(counterRef);
        let seq = 1;
        if (!counterSnap.exists()) {
          tx.set(counterRef, { seq: 1 });
          seq = 1;
        } else {
          const current = counterSnap.data().seq || 0;
          seq = current + 1;
          tx.update(counterRef, { seq });
        }

        const seqStr = String(seq).padStart(6, "0");
        // Formato legible dd/mm/aa HH:MM
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yy = String(now.getFullYear()).slice(-2);
        const HH = String(now.getHours()).padStart(2, "0");
        const MIN = String(now.getMinutes()).padStart(2, "0");
        const displayTs = `${dd}/${mm}/${yy} ${HH}:${MIN}`;

        // Los IDs de Firestore no pueden contener '/' — creamos una versión segura para el ID
        const safeTs = `${dd}-${mm}-${yy}_${HH}${MIN}`; // ej. 15-05-26_1405
        const generatedOrderId = `P${seqStr}_${safeTs}`;

        const orderRef = doc(db, "pedidos", generatedOrderId);
        const orderPayload = {
          orderId: generatedOrderId,
          numeroPedido: generatedOrderId,
          timestamp: serverTimestamp(),
          timestamp_display: displayTs,
          nombre: name,
          nombreCliente: name,
          phone,
          school: selectedSchool === "new" ? newSchool : selectedSchool,
          address,
          indicaciones,
          products: productsForOrder,
          total,
          estado: "pendiente",
          fecha: new Date()
        };

        tx.set(orderRef, orderPayload);
        return generatedOrderId;
      });

      setSavedOrderId(orderId);
      return orderId;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // 📱 ENVIAR POR WHATSAPP
  const handleWhatsApp = async () => {
    if (!isFormValid) return;

    const schoolName = selectedSchool === "new" ? newSchool : selectedSchool;

    // Construir lista de productos con formato mejorado
    const productList = grouped
      .map((item) => `  🥗 ${item.name}\n     Cantidad: x${item.qty} | Precio: $${(item.price * item.qty).toFixed(2)}`)
      .join("\n\n");

    // Obtener dirección
    const address = selectedSchoolData?.address || newAddress;

    // Obtener hora actual
    const hora = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    });

    // Construir mensaje formateado profesional
    const message = `
🍱 *MI LONCHE EXPRESS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *INFORMACIÓN DEL CLIENTE*

👤 *Nombre:* ${name}
📱 *Teléfono:* ${phone}

📍 *DETALLES DE ENTREGA*

🏫 *Escuela:* ${schoolName}
🗺️ *Dirección:* ${address}

🛍️ *PRODUCTOS ORDENADOS*

${productList}

${indicaciones ? `📝 *Notas especiales:*
${indicaciones}\n` : ""}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL A PAGAR:* $${total.toFixed(2)}
⏰ *Hora del pedido:* ${hora}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Gracias por tu pedido. Nos pondremos en contacto pronto.`;

    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);

    // Intentar guardar el pedido en Firestore; si falla, no bloquear el envío por WhatsApp
    try {
      await saveOrder();
    } catch (err) {
      console.error("Error guardando pedido en Firestore:", err);
    }

    // Abrir WhatsApp con el número del negocio
    window.open(`https://wa.me/5214427817971?text=${encodedMessage}`, "_blank");

    // Reiniciar formulario y carrito como si el cliente accediera por primera vez
    setName("");
    setPhone("");
    setIndicaciones("");
    setSelectedSchool("");
    setNewSchool("");
    setNewAddress("");
    setSavedOrderId(null);
    clearCart();

    router.push("/menu");
  };

  return (
    <div style={{ padding: 16, paddingBottom: 120, background: "#f5f5f5", minHeight: "100vh", fontFamily: "sans-serif", color: "black" }}>

      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 18 }}>🛒 Tu pedido</h2>

      {/* 🛍️ PRODUCTOS */}
      {grouped.map((item) => (
        <div key={item.id} style={{
          display: "flex",
          gap: 10,
          marginBottom: 10,
          background: "#DA291C",
          padding: 10,
          borderRadius: 12,
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
        }}>
          <img
            src={item.image}
            style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10 }}
          />

          <div style={{ flex: 1 }}>
            <b>{item.name}</b>
            <p>${item.price} x {item.qty}</p>

            <button
            onClick={() => decreaseFromCart(item.id)}
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
          <span style={{ fontWeight: "bold", minWidth: 26, textAlign: "center" }}>{item.qty}</span>
          <button
            onClick={() => addToCart(item)}
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
        </div>
      ))}

      {/* 🧾 CLIENTE */}
      <h3 style={{ fontSize: 18, fontWeight: "bold", marginTop: 24, marginBottom: 10 }}>👤 Datos del cliente</h3>

      <input
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={input}
      />
      {!isValidName && name && <p style={{ color: "red" }}>Nombre inválido</p>}

      <input
        placeholder="Celular"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={input}
      />
      {!isValidPhone && phone && <p style={{ color: "red" }}>Celular inválido</p>}

      {/* 🏫 ESCUELA */}
      <h3 style={{ fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 }}>🏫 Entrega</h3>

      <select
        value={selectedSchool}
        onChange={(e) => setSelectedSchool(e.target.value)}
        style={input}
      >
        <option value="">Selecciona escuela</option>
        {schools.map((s, i) => (
          <option key={i} value={s.name}>{s.name}</option>
        ))}
        <option value="new">+ Agregar nueva</option>
      </select>

      {/* 📍 DIRECCIÓN AUTOMÁTICA */}
      {selectedSchool && selectedSchool !== "new" && selectedSchoolData && (
        <input
          value={selectedSchoolData.address}
          disabled
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#eee"
          }}
        />
      )}

      {/* ➕ NUEVA ESCUELA */}
      {selectedSchool === "new" && (
        <>
          <input
            placeholder="Nombre escuela"
            value={newSchool}
            onChange={(e) => setNewSchool(e.target.value)}
            style={input}
          />

          <input
            placeholder="Dirección"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            style={input}
          />

          <button onClick={addSchool} style={btnAdd}>
            Guardar escuela
          </button>
        </>
      )}

      {/* 📝 INDICACIONES */}
      <h3 style={{ fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 }}>📝 Indicaciones especiales (opcional)</h3>
      <textarea
        placeholder="Ej: Sin cebolla, con extra salsa..."
        value={indicaciones}
        onChange={(e) => setIndicaciones(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontFamily: "inherit",
          resize: "vertical",
          minHeight: 80
        }}
      />

      {/* 💰 FOOTER */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        padding: 16,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>Total: ${total.toFixed(2)}</h3>

        <button
          onClick={handleWhatsApp}
          disabled={!isFormValid || isSaving}
          style={{
            width: "100%",
            padding: 14,
            background: isFormValid && !isSaving ? "#000000" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: 10,
            cursor: isFormValid ? "pointer" : "not-allowed",
            fontSize: 16,
            fontWeight: "bold"
          }}
        >
          {isSaving ? "Guardando pedido..." : "📱 Enviar pedido por WhatsApp"}
        </button>
      </div>

    </div>
  );
}

// 🎨 estilos
const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontFamily: "inherit"
};

const btnAdd = {
  width: "100%",
  padding: 10,
  background: "#000000",
  color: "white",
  border: "none",
  borderRadius: 8,
  marginBottom: 10,
  cursor: "pointer",
  fontWeight: "bold"
};