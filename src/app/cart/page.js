"use client";
import { useCart } from "../context/CartContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS, FIRESTORE_DOCS } from "../../lib/firestoreCollections";

export default function Cart() {
  const { cart, addToCart, decreaseFromCart, clearCart } = useCart();
  const router = useRouter();

  // 🎨 Estados para interactividad de botones
  const [activeButtonId, setActiveButtonId] = useState(null);
  const [pressedButtonId, setPressedButtonId] = useState(null);
  const [wasFormValidBefore, setWasFormValidBefore] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  // 🧾 CLIENTE
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [indicaciones, setIndicaciones] = useState("");

  // 🏫 ESCUELAS
  // Inicial vacío: las escuelas se pueden añadir desde la UI
  const [schools, setSchools] = useState([]);

  const [selectedSchool, setSelectedSchool] = useState("");
  const [newSchool, setNewSchool] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(null);
  const savingRef = useRef(false);

  // 🔍 Obtener escuela seleccionada
  const selectedSchoolData = schools.find((s) => s.name === selectedSchool);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.ESCUELAS));
        const savedSchools = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSchools(savedSchools);
      } catch (error) {
        console.error("Error cargando escuelas desde Firestore:", error);
      }
    };

    loadSchools();
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      router.replace("/menu");
    }
  }, [cart, router]);

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

  const hasSchool = Boolean(selectedSchoolData);

  const isFormValid =
    grouped.length > 0 &&
    isValidName &&
    isValidPhone &&
    hasSchool;

  // ➕ AGREGAR ESCUELA
  const isNewSchoolValid = newSchool.trim().length > 0 && newAddress.trim().length > 0;

  // 🎯 LÓGICA DE DESBLOQUEO PROGRESIVO
  // Contar campos incompletos
  const incompletedFields = [
    !isValidName && name.length > 0,
    !isValidPhone && phone.length > 0,
    !hasSchool
  ].filter(Boolean).length;

  const emptyFields = [
    name.length === 0,
    phone.length === 0,
    !hasSchool
  ].filter(Boolean).length;

  const totalMissingFields = Math.max(
    (name.length === 0 ? 1 : incompletedFields > 0 && !isValidName ? 1 : 0) +
    (phone.length === 0 ? 1 : incompletedFields > 0 && !isValidPhone ? 1 : 0) +
    (!hasSchool ? 1 : 0),
    0
  );

  // Texto dinámico de progreso
  const getProgressText = () => {
    if (isFormValid) {
      return { text: "✅ Listo para enviar", color: "#22c55e" };
    }
    if (grouped.length === 0) {
      return { text: "Agrega productos a tu carrito", color: "#ef4444" };
    }
    if (!isValidName && name.length > 0) {
      return { text: "Nombre inválido", color: "#ef4444" };
    }
    if (!isValidPhone && phone.length > 0) {
      return { text: "Celular inválido (10-12 dígitos)", color: "#ef4444" };
    }
    if (name.length === 0 && phone.length === 0 && !hasSchool) {
      return { text: "Completa todos los campos", color: "#ef4444" };
    }
    if (totalMissingFields >= 2) {
      return { text: `Te falta completar ${totalMissingFields} campos 🚫`, color: "#ef4444" };
    }
    if (totalMissingFields === 1) {
      return { text: "Casi listo 🚀", color: "#eab308" };
    }
    return { text: "Completa tus datos", color: "#f97316" };
  };

  // Detectar transición de estado (bloqueado → desbloqueado)
  useEffect(() => {
    if (isFormValid && !wasFormValidBefore) {
      setWasFormValidBefore(true);
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 400);
      return () => clearTimeout(timer);
    }
    if (!isFormValid && wasFormValidBefore) {
      setWasFormValidBefore(false);
    }
  }, [isFormValid, wasFormValidBefore]);

  // 🎨 ESTILOS DINÁMICOS PARA BOTONES
  const baseButtonStyle = {
    transition: "all 0.2s ease",
    cursor: "pointer",
    fontWeight: "bold"
  };

  // Botones +/- para cantidad
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

  // Botón "Guardar escuela"
  const getSaveSchoolButtonStyle = () => {
    const isPressed = pressedButtonId === "save-school";
    const isActive = activeButtonId === "save-school";
    return {
      ...baseButtonStyle,
      width: "95%",
      padding: 12,
      background: isNewSchoolValid ? "#FFC72C" : "#cccccc",
      color: isNewSchoolValid ? "#000000" : "#666666",
      border: "none",
      borderRadius: 12,
      marginBottom: 10,
      cursor: isNewSchoolValid ? "pointer" : "not-allowed",
      fontWeight: "bold",
      fontSize: 14,
      boxShadow: isNewSchoolValid && isActive ? "0 6px 12px rgba(255,199,44,0.3)" : "0 2px 6px rgba(0,0,0,0.1)",
      transform: isNewSchoolValid && isPressed ? "scale(0.95)" : isNewSchoolValid && isActive ? "scale(1.05)" : "scale(1)",
      opacity: isNewSchoolValid ? 1 : 0.6
    };
  };

  // Botón "Enviar por WhatsApp"
  const getWhatsAppButtonStyle = () => {
    const isPressed = pressedButtonId === "whatsapp";
    const isActive = activeButtonId === "whatsapp";
    const isEnabled = isFormValid && !isSaving;
    
    // Animación de transición: bloqueado → desbloqueado
    const transitionStyle = !isFormValid && !wasFormValidBefore ? {
      transform: "scale(0.9)",
      opacity: 0.6
    } : isFormValid && showPulse ? {
      animation: "pulse-unlock 0.4s ease-out"
    } : {};

    return {
      ...baseButtonStyle,
      width: "95%",
      padding: 14,
      background: isEnabled ? (isPressed ? "linear-gradient(135deg, #1a1a1a, #333333)" : isActive ? "linear-gradient(135deg, #1a1a1a, #2a2a2a)" : "linear-gradient(135deg, #000000, #1a1a1a)") : "#cccccc",
      color: "white",
      border: "none",
      borderRadius: 12,
      fontSize: 16,
      fontWeight: "bold",
      cursor: isEnabled ? "pointer" : "not-allowed",
      boxShadow: isEnabled && isActive ? "0 8px 16px rgba(0,0,0,0.4)" : isEnabled ? "0 4px 12px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
      transform: isEnabled && isPressed ? "scale(0.95)" : isEnabled && isActive ? "scale(1.05)" : isEnabled ? "scale(1)" : "scale(0.98)",
      opacity: isEnabled ? 1 : 0.6,
      transition: "all 0.3s ease-out",
      ...transitionStyle
    };
  };

  const getCancelButtonStyle = () => {
    const isPressed = pressedButtonId === "cancel";
    const isActive = activeButtonId === "cancel";
    return {
      ...baseButtonStyle,
      padding: 10,
      background: "transparent",
      color: "#111827",
      border: "1px solid #9ca3af",
      borderRadius: 12,
      fontSize: 14,
      width: "auto",
      minWidth: 120,
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: isActive ? "0 8px 16px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.08)",
      transform: isPressed ? "scale(0.95)" : isActive ? "scale(1.03)" : "scale(1)",
      transition: "all 0.2s ease"
    };
  };

  const addSchool = async () => {
    if (!isNewSchoolValid) return;

    try {
      const schoolRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.ESCUELAS), {
        name: newSchool,
        address: newAddress,
      });

      const savedSchool = {
        id: schoolRef.id,
        name: newSchool,
        address: newAddress,
      };

      setSchools((prevSchools) => [...prevSchools, savedSchool]);
      setSelectedSchool(newSchool);
      setNewSchool("");
      setNewAddress("");
    } catch (error) {
      console.error("Error guardando escuela en Firestore:", error);
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
	price: i.price,
	description: i.description || ""
	}));

    try {
      const orderId = await runTransaction(db, async (tx) => {
        const counterRef = doc(db, FIRESTORE_COLLECTIONS.CONTADORES, FIRESTORE_DOCS.ORDENES);
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

        const orderRef = doc(db, FIRESTORE_COLLECTIONS.PEDIDOS, generatedOrderId);
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
.map((item) => 
` 🥗 ${item.name}
${item.description ? `📝 ${item.description}\n ` : ""}Cantidad: x${item.qty} | Precio: $${(item.price * item.qty).toFixed(2)}`
)
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
━━━━━━━━━━━━━━━━━━━━━━

*INFORMACIÓN DEL CLIENTE*

  *Nombre:* ${name}
  *Teléfono:* ${phone}

*DETALLES DE ENTREGA*

  *Escuela:* ${schoolName}
  *Dirección:* ${address}

*PRODUCTOS ORDENADOS*

${productList}

${indicaciones ? `📝 *Notas especiales:*
${indicaciones}\n` : ""}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL A PAGAR:* $${total.toFixed(2)}
⏰ *Hora del pedido:* ${hora}
━━━━━━━━━━━━━━━━━━━

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

  const handleCancelPedido = () => {
    setShowCancelConfirmation(true);
  };

  const confirmCancelPedido = () => {
    setShowCancelConfirmation(false);
    clearCart();
    router.replace("/menu");
  };

  const closeCancelConfirmation = () => {
    setShowCancelConfirmation(false);
  };

  return (
    <div style={{ padding: 16, paddingBottom: 120, background: "#FFC72C", minHeight: "100vh", fontFamily: "sans-serif", color: "black" }}>
      {/* Inyectar animación pulse-unlock */}
      <style>{`
        @keyframes pulse-unlock {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <h2 style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>🛒 Tu pedido</h2>
        <button
          onClick={handleCancelPedido}
          onMouseEnter={() => setActiveButtonId("cancel")}
          onMouseLeave={() => {
            setActiveButtonId(null);
            setPressedButtonId(null);
          }}
          onMouseDown={() => setPressedButtonId("cancel")}
          onMouseUp={() => setPressedButtonId(null)}
          style={getCancelButtonStyle()}
        >
          Cancelar pedido
        </button>
      </div>

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
			{item.description && (
			<p style={{ fontSize: 12, margin: "4px 0" }}>
			{item.description}
			</p>)}
            <p>${item.price} x {item.qty}</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 12 }}>
              <button 
                onClick={() => decreaseFromCart(item.id)}
                onMouseEnter={() => setActiveButtonId(`dec-${item.id}`)}
                onMouseLeave={() => {
                  setActiveButtonId(null);
                  setPressedButtonId(null);
                }}
                onMouseDown={() => setPressedButtonId(`dec-${item.id}`)}
                onMouseUp={() => setPressedButtonId(null)}
                style={getIncrementButtonStyle(item.id, "dec")}
              >
                −
              </button>
              <span style={{ fontWeight: "bold", fontSize: "18px", minWidth: 40, textAlign: "center" }}>{item.qty}</span>
              <button 
                onClick={() => addToCart(item)}
                onMouseEnter={() => setActiveButtonId(`inc-${item.id}`)}
                onMouseLeave={() => {
                  setActiveButtonId(null);
                  setPressedButtonId(null);
                }}
                onMouseDown={() => setPressedButtonId(`inc-${item.id}`)}
                onMouseUp={() => setPressedButtonId(null)}
                style={getIncrementButtonStyle(item.id, "inc")}
              >
                +
              </button>
            </div>
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
      <h3 style={{ fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 }}>Entrega</h3>

      {schools.length > 0 ? (
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
      ) : (
        <button
          type="button"
          onClick={() => setSelectedSchool("new")}
          style={{
            ...input,
            width: "95%",
            display: "block",
            textAlign: "left",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          + Agregar escuela
        </button>
      )}

      {/* 📍 DIRECCIÓN AUTOMÁTICA */}
      {selectedSchool && selectedSchool !== "new" && selectedSchoolData && (
        <input
          value={selectedSchoolData.address}
          disabled
          style={{
            width: "95%",
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

          <button
            onClick={addSchool}
            disabled={!isNewSchoolValid}
            onMouseEnter={() => isNewSchoolValid && setActiveButtonId("save-school")}
            onMouseLeave={() => {
              setActiveButtonId(null);
              setPressedButtonId(null);
            }}
            onMouseDown={() => isNewSchoolValid && setPressedButtonId("save-school")}
            onMouseUp={() => setPressedButtonId(null)}
            style={getSaveSchoolButtonStyle()}
          >
            Guardar escuela
          </button>
        </>
      )}

      {/* 📝 INDICACIONES */}
      <h3 style={{ fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 }}>Indicaciones especiales (opcional)</h3>
      <textarea
        placeholder="Ej: Sin cebolla, con extra salsa..."
        value={indicaciones}
        onChange={(e) => setIndicaciones(e.target.value)}
        style={{
          width: "95%",
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

        {/* 🎯 INDICADOR DE PROGRESO */}
        <div style={{
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 8,
          color: getProgressText().color,
          transition: "color 0.3s ease",
          minHeight: 18
        }}>
          {getProgressText().text}
        </div>

        {/* BOTÓN WHATSAPP CON DESBLOQUEO PROGRESIVO */}
        <button
          onClick={handleWhatsApp}
          disabled={!isFormValid || isSaving}
          onMouseEnter={() => (isFormValid && !isSaving) && setActiveButtonId("whatsapp")}
          onMouseLeave={() => {
            setActiveButtonId(null);
            setPressedButtonId(null);
          }}
          onMouseDown={() => (isFormValid && !isSaving) && setPressedButtonId("whatsapp")}
          onMouseUp={() => setPressedButtonId(null)}
          style={getWhatsAppButtonStyle()}
        >
          {isFormValid && !isSaving ? "📱 Enviar pedido por WhatsApp 🚀" : isSaving ? "Guardando pedido..." : "Completa tus datos para enviar 🚫"}
        </button>
      </div>

      {showCancelConfirmation && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          padding: 16
        }}>
          <div style={{
            width: "100%",
            maxWidth: 400,
            background: "white",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
            textAlign: "center"
          }}>
            <p style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>¿Cancelar pedido?</p>
            <p style={{ marginBottom: 24, color: "#333" }}>
              Si confirmas, se cancelará el pedido y volverás al menú.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={closeCancelConfirmation}
                style={{
                  ...baseButtonStyle,
                  width: "45%",
                  padding: 12,
                  background: "#e5e7eb",
                  color: "#111827",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: "bold"
                }}
              >
                NO
              </button>
              <button
                onClick={confirmCancelPedido}
                style={{
                  ...baseButtonStyle,
                  width: "45%",
                  padding: 12,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontWeight: "bold"
                }}
              >
                SI
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 🎨 estilos
const input = {
  width: "95%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontFamily: "inherit"
};

const btnAdd = {
  width: "95%",
  padding: 10,
  background: "#000000",
  color: "white",
  border: "none",
  borderRadius: 8,
  marginBottom: 10,
  cursor: "pointer",
  fontWeight: "bold"
};
