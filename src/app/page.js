"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot
} from "firebase/firestore";

export default function Home() {
  const [comentarios, setComentarios] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [escuela, setEscuela] = useState("");
  const [nuevaEscuela, setNuevaEscuela] = useState("");
  const [escuelas, setEscuelas] = useState([]);
  const [direccionEscuela, setDireccionEscuela] = useState("");
  const [cantidades, setCantidades] = useState({});

  // 🔄 Reiniciar
  const reiniciarApp = () => {
    setPedido({});
    setComentarios("");
    setNombre("");
    setTelefono("");
    setEscuela("");
    setNuevaEscuela("");
    setDireccionEscuela("");
  };

  // 🔥 Cargar escuelas en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "escuelas"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => doc.data());
      setEscuelas(lista);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 Autollenado de dirección
  useEffect(() => {
    if (escuela === "otra") {
      setNuevaEscuela("");
      setDireccionEscuela("");
      return;
    }

    if (escuela) {
      const encontrada = escuelas.find((e) => e.nombre === escuela);
      if (encontrada) {
        setDireccionEscuela(encontrada.direccion || "");
      }
    }
  }, [escuela, escuelas]);

  const menu = [
    { id: 1, nombre: "Lonche Clásico", precio: 60, imagen: "/images/Lonche_Clasico.png" },
    { id: 2, nombre: "Lonche Saludable", precio: 80, imagen: "/images/Lonche_Saludable.png" },
    { id: 3, nombre: "Lonche Premium", precio: 100, imagen: "/images/Lonche_Premium.png" }
  ];

  const generarNumeroPedido = () => {
    const fecha = new Date();
    return `A${fecha.getHours()}${fecha.getMinutes()}${fecha.getSeconds()}`;
  };

  const generarMensaje = (numeroPedido, escuelaFinal, direccionFinal, pedidoDetallado) => {
    let mensaje = `*Nuevo Pedido - Mi Lonche Express*\n`;
    mensaje += `Pedido: #${numeroPedido}\n\n`;
    mensaje += `Escuela: ${escuelaFinal}\n`;
    mensaje += `Dirección: ${direccionFinal}\n\n`;

    pedidoDetallado.forEach((p) => {
      mensaje += `• ${p.nombre} x ${p.cantidad} = $${p.subtotal}\n`;
    });

    mensaje += `\nTotal: $${total}\n`;

    if (comentarios) {
      mensaje += `\nComentarios: ${comentarios}\n`;
    }

    mensaje += "\nEntregar en escuela";

    return encodeURIComponent(mensaje);
  };

const generarResumenPedido = (pedidoDetallado, escuelaFinal, direccionFinal) => {
  let resumen = `Pedido para confirmar:\n\n`;
  resumen += `Nombre: ${nombre}\n`;
  resumen += `Tel: ${telefono}\n\n`;
  resumen += `Escuela: ${escuelaFinal}\n`;
  resumen += `Dirección: ${direccionFinal}\n\n`;

  pedidoDetallado.forEach((p) => {
    resumen += `• ${p.nombre} x ${p.cantidad} = $${p.subtotal}\n`;
  });

  resumen += `\nTotal: $${total}\n`;

  if (comentarios) {
    resumen += `\nComentarios: ${comentarios}\n`;
  }

  return resumen;
};

  const confirmarPedido = async () => {
  const pedidoDetallado = menu
    .map((producto) => {
      const cantidad = cantidades[producto.id] || 0;

      return {
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal: producto.precio * cantidad,
      };
    })
    .filter((item) => item.cantidad > 0);

  // VALIDACIÓN PRODUCTOS
  if (pedidoDetallado.length === 0) {
    alert("Selecciona al menos un lonche");
    return;
  }

  // VALIDACIÓN TELÉFONO
  const esMexico = /^[0-9]{10}$/.test(telefono);
  const esUSA = /^1[0-9]{10}$/.test(telefono);

  if (!nombre || !telefono)
    return alert("Escriba su nombre y celular");

  if (!esMexico && !esUSA)
    return alert("Número válido: MX (10 dígitos) o USA (1 + 10 dígitos)");

  if (!escuela)
    return alert("Selecciona una escuela");

  if (escuela === "otra" && (!nuevaEscuela || !direccionEscuela))
    return alert("Completa nueva escuela");

  const numeroPedido = generarNumeroPedido();

  const total = pedidoDetallado.reduce(
    (acc, item) => acc + item.subtotal,
    0
  );

  let escuelaFinalTemp = escuela === "otra" ? nuevaEscuela : escuela;
  let direccionFinalTemp = direccionEscuela;

  const resumen = generarResumenPedido(
    pedidoDetallado,
    escuelaFinalTemp,
    direccionFinalTemp
  );

  const confirmado = confirm(resumen);
  if (!confirmado) return;

  try {
    let escuelaFinal = escuela;
    let direccionFinal = "";

    if (escuela === "otra") {
      escuelaFinal = nuevaEscuela;
      direccionFinal = direccionEscuela;

      await addDoc(collection(db, "escuelas"), {
        nombre: nuevaEscuela,
        direccion: direccionEscuela,
      });
    } else {
      direccionFinal = direccionEscuela;
    }

    await addDoc(collection(db, "pedidos"), {
      numeroPedido,
      nombre,
      telefono,
      escuela: escuelaFinal,
      direccionEscuela: direccionFinal,
      pedido: pedidoDetallado,
      comentarios,
      total,
      estado: "pendiente",
      fecha: new Date(),
    });

    const mensaje = generarMensaje(
      numeroPedido,
      escuelaFinal,
      direccionFinal,
      pedidoDetallado
    );

    const telefonoNegocio = "5214272071175";

    const urlApp = `whatsapp://send?phone=${telefonoNegocio}&text=${mensaje}`;
    const urlWeb = `https://wa.me/${telefonoNegocio}?text=${mensaje}`;

    window.location.href = urlApp;

    setTimeout(() => {
      window.location.href = urlWeb;
    }, 1500);

  } catch (error) {
    console.error(error);
    alert("Error al guardar pedido");
  }
};

const incrementar = (id) => {
  setCantidades((prev) => ({
    ...prev,
    [id]: (prev[id] || 0) + 1,
  }));
};

const disminuir = (id) => {
  setCantidades((prev) => ({
    ...prev,
    [id]: Math.max((prev[id] || 0) - 1, 0),
  }));
};

const total = menu.reduce((acc, producto) => {
const cantidad = cantidades[producto.id] || 0;
return acc + cantidad * producto.precio;
}, 0);

  return (
    <main style={{ padding: 20 }}>
      <h1>🍱 PEDIR LONCHE ESCOLAR</h1>

      <input
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <input
        placeholder="Celular - MX 10 Digítos o USA 11 Dígitos 1+10)"
        value={telefono}
        onChange={(e) => {
          let valor = e.target.value.replace(/\D/g, "");
          if (valor.length > 11) return;
          setTelefono(valor);
        }}
        inputMode="numeric"
        maxLength={11}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <select
        value={escuela}
        onChange={(e) => setEscuela(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      >
        <option value="">Seleccione escuela</option>
        {escuelas.map((esc, i) => (
          <option key={i} value={esc.nombre}>
            {esc.nombre}
          </option>
        ))}
        <option value="otra">Nueva escuela</option>
      </select>

      {/* Escuela existente */}
      {escuela && escuela !== "otra" && (
        <>
          <input value={escuela} readOnly style={{ width: "100%", marginBottom: 10, background: "#eee" }} />
          <input value={direccionEscuela} readOnly style={{ width: "100%", marginBottom: 10, background: "#eee" }} />
        </>
      )}

      {/* Nueva escuela */}
      {escuela === "otra" && (
        <>
          <input
            placeholder="Nombre de la Nueva Escuela"
            value={nuevaEscuela}
            onChange={(e) => setNuevaEscuela(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <input
            placeholder="Dirección de la Nueva Escuela"
            value={direccionEscuela}
            onChange={(e) => setDireccionEscuela(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
        </>
      )}

      
        <div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: 15,
    flexWrap: "wrap",
  }}
>
  {menu.map((producto) => {
    const cantidad = cantidades[producto.id] || 0;

    return (
      <div
        key={producto.id}
        style={{
          border: "1px solid #ccc",
          borderRadius: 12,
          padding: 12,
          width: 140,
          textAlign: "center",
          background: "#fff",
        }}
      >
        {/* IMAGEN */}
        <img
          src={producto.imagen}
          alt={producto.nombre}
          style={{
            width: "100%",
            borderRadius: 10,
            marginBottom: 8,
          }}
        />

        {/* NOMBRE */}
        <h4 style={{ margin: "5px 0" }}>
          {producto.nombre}
        </h4>

        {/* PRECIO */}
        <p style={{ margin: "5px 0" }}>
          ${producto.precio}
        </p>

        {/* CONTROLES */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            marginTop: 10,
          }}
        >
          <button onClick={() => disminuir(producto.id)}>-</button>

          <span>{cantidad}</span>

          <button onClick={() => incrementar(producto.id)}>+</button>
        </div>
      </div>
    );
  })}
</div>

<textarea
  placeholder="Comentarios (ej: sin picante, sin mayonesa, etc.)"
  value={comentarios}
  onChange={(e) => setComentarios(e.target.value)}
  style={{
    width: "100%",
    marginTop: 15,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8
  }}
/>

      <h2>Total: ${total}</h2>

      <p>Tu pedido se enviará por WhatsApp 📲</p>
      <p>NOTA IMPORTANTE: En iPhone deberá autorizar abrir otra ventana 📲</p>
      <button
        onClick={confirmarPedido}
        style={{
          marginTop: 20,
          padding: 15,
          background: "#25D366",
          color: "white",
          border: "none",
          borderRadius: 10,
          width: "100%",
          fontSize: 16,
          fontWeight: "bold"
        }}
      >
        CONFIRMAR Y ENVIAR POR WHATSAPP
      </button>
    </main>
  );
}