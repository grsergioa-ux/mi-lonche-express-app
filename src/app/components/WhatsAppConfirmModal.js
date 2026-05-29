"use client";
import { useState, useEffect, useCallback } from "react";

/**
 * WhatsAppConfirmModal
 * Modal de confirmación del pedido antes de abrir WhatsApp.
 *
 * Props:
 *  - isOpen        {boolean}   Controla visibilidad del modal
 *  - onClose       {Function}  Llamado al hacer "Editar pedido"
 *  - onConfirm     {Function}  Llamado al confirmar → ejecuta el envío real
 *  - grouped       {Array}     Productos agrupados con { id, name, qty, price, image }
 *  - total         {number}    Total del pedido
 *  - customerName  {string}    Nombre del cliente
 *  - schoolName    {string}    Nombre de la escuela/punto de entrega
 *  - whatsappMessage {string}  Texto del mensaje que se enviará por WhatsApp
 *  - isSaving      {boolean}   True mientras se guarda en Firestore
 */
export default function WhatsAppConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  grouped = [],
  total = 0,
  customerName = "",
  schoolName = "",
  whatsappMessage = "",
  isSaving = false,
}) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  // Manejar animación de entrada/salida
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setAnimatingOut(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setAnimatingOut(true);
    setTimeout(() => {
      setVisible(false);
      setAnimatingOut(false);
      onClose();
    }, 280);
  }, [onClose]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCopyMessage = async () => {
    if (!whatsappMessage) return;
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para navegadores sin soporte clipboard API
      const ta = document.createElement("textarea");
      ta.value = whatsappMessage;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* ── Estilos inyectados ── */}
      <style>{`
        @keyframes wam-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes wam-overlay-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes wam-sheet-in {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes wam-sheet-out {
          from { opacity: 1; transform: translateY(0)   scale(1);    }
          to   { opacity: 0; transform: translateY(30px) scale(0.97); }
        }
        @keyframes wam-check-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes wam-copy-success {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1);   opacity: 1; }
        }

        .wam-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.60);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
          animation: wam-overlay-in 0.25s ease forwards;
        }
        .wam-overlay.animating-out {
          animation: wam-overlay-out 0.28s ease forwards;
        }

        .wam-sheet {
          width: 100%;
          max-width: 480px;
          max-height: 90dvh;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 32px 80px rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.15);
          animation: wam-sheet-in 0.30s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .wam-sheet.animating-out {
          animation: wam-sheet-out 0.28s ease forwards;
        }

        /* ── Header ── */
        .wam-header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          padding: 20px 24px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .wam-header-icon {
          width: 44px;
          height: 44px;
          background: #25D366;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37,211,102,0.40);
        }
        .wam-header-text h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
        }
        .wam-header-text p {
          margin: 2px 0 0;
          font-size: 12px;
          color: rgba(255,255,255,0.55);
        }

        /* ── Body ── */
        .wam-body {
          overflow-y: auto;
          flex: 1;
          padding: 20px 20px 0;
          -webkit-overflow-scrolling: touch;
        }
        .wam-body::-webkit-scrollbar { width: 4px; }
        .wam-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        /* Sección */
        .wam-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #9ca3af;
          margin: 0 0 10px;
        }

        /* Resumen cliente */
        .wam-customer-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 18px;
        }
        .wam-customer-chip .avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #FFC72C, #f59e0b);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .wam-customer-chip .info strong {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }
        .wam-customer-chip .info span {
          font-size: 12px;
          color: #6b7280;
        }

        /* Productos */
        .wam-product-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 18px;
        }
        .wam-product-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 10px 14px;
          transition: border-color 0.2s;
        }
        .wam-product-row:hover { border-color: #FFC72C; }
        .wam-product-row img {
          width: 52px;
          height: 52px;
          object-fit: cover;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .wam-product-row .prod-info { flex: 1; min-width: 0; }
        .wam-product-row .prod-info strong {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wam-product-row .prod-info span {
          font-size: 12px;
          color: #6b7280;
        }
        .wam-product-row .prod-price {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .wam-qty-badge {
          background: #1a1a1a;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Total */
        .wam-total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 18px;
        }
        .wam-total-row .label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
        }
        .wam-total-row .amount {
          font-size: 22px;
          font-weight: 800;
          color: #FFC72C;
          letter-spacing: -0.5px;
        }

        /* Vista previa mensaje */
        .wam-preview-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 20px;
          position: relative;
        }
        .wam-preview-box pre {
          margin: 0;
          font-size: 11px;
          line-height: 1.55;
          color: #166534;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: "SF Mono", "Fira Code", "Courier New", monospace;
          max-height: 140px;
          overflow-y: auto;
        }
        .wam-preview-box pre::-webkit-scrollbar { width: 3px; }
        .wam-preview-box pre::-webkit-scrollbar-thumb { background: #86efac; border-radius: 3px; }

        /* Botón copiar */
        .wam-copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          background: none;
          border: 1px solid #86efac;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #16a34a;
          cursor: pointer;
          transition: all 0.2s;
          width: fit-content;
        }
        .wam-copy-btn:hover {
          background: #dcfce7;
          border-color: #4ade80;
        }
        .wam-copy-btn.success {
          border-color: #4ade80;
          background: #dcfce7;
          animation: wam-copy-success 0.3s ease;
        }

        /* ── Footer ── */
        .wam-footer {
          padding: 16px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid #f3f4f6;
          flex-shrink: 0;
          background: #ffffff;
        }

        .wam-btn-confirm {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 6px 18px rgba(37,211,102,0.35);
          letter-spacing: 0.1px;
        }
        .wam-btn-confirm:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(37,211,102,0.45);
        }
        .wam-btn-confirm:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 3px 10px rgba(37,211,102,0.25);
        }
        .wam-btn-confirm:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .wam-btn-edit {
          width: 100%;
          padding: 13px;
          background: transparent;
          color: #374151;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wam-btn-edit:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #111827;
        }
        .wam-btn-edit:active {
          transform: scale(0.98);
        }

        /* Responsive ajuste en pantallas muy pequeñas */
        @media (max-width: 380px) {
          .wam-header { padding: 16px 16px 14px; }
          .wam-body   { padding: 16px 16px 0;    }
          .wam-footer { padding: 12px 16px 18px; }
        }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className={`wam-overlay${animatingOut ? " animating-out" : ""}`}
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar pedido"
      >
        {/* ── Sheet (detiene propagación del click) ── */}
        <div
          className={`wam-sheet${animatingOut ? " animating-out" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="wam-header">
            <div className="wam-header-icon">📱</div>
            <div className="wam-header-text">
              <h2>Confirmar pedido</h2>
              <p>Revisa tu pedido antes de continuar</p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="wam-body">

            {/* Cliente + Escuela */}
            {(customerName || schoolName) && (
              <>
                <p className="wam-section-label">Datos de entrega</p>
                <div className="wam-customer-chip">
                  <div className="avatar">👤</div>
                  <div className="info">
                    <strong>{customerName || "—"}</strong>
                    <span>📍 {schoolName || "—"}</span>
                  </div>
                </div>
              </>
            )}

            {/* Productos */}
            <p className="wam-section-label">Resumen del pedido</p>
            <div className="wam-product-list">
              {grouped.map((item) => (
                <div key={item.id} className="wam-product-row">
                  {item.image && (
                    <img src={item.image} alt={item.name} loading="lazy" />
                  )}
                  <div className="prod-info">
                    <strong>{item.name}</strong>
                    <span>${item.price.toFixed(2)} c/u</span>
                  </div>
                  <span className="wam-qty-badge">x{item.qty}</span>
                  <span className="prod-price">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="wam-total-row">
              <span className="label">💰 Total a pagar</span>
              <span className="amount">${total.toFixed(2)}</span>
            </div>

            {/* Vista previa del mensaje */}
            {whatsappMessage && (
              <>
                <p className="wam-section-label">Vista previa del mensaje</p>
                <div className="wam-preview-box">
                  <pre>{whatsappMessage}</pre>
                  <button
                    type="button"
                    className={`wam-copy-btn${copied ? " success" : ""}`}
                    onClick={handleCopyMessage}
                    title="Copiar mensaje al portapapeles"
                  >
                    {copied ? "✅ ¡Copiado!" : "📋 Copiar mensaje"}
                  </button>
                </div>
              </>
            )}

          </div>

          {/* ── Footer ── */}
          <div className="wam-footer">
            <button
              type="button"
              className="wam-btn-confirm"
              onClick={onConfirm}
              disabled={isSaving}
            >
              {isSaving
                ? "⏳ Guardando pedido..."
                : "✅ Continuar → Abrir WhatsApp"}
            </button>
            <button
              type="button"
              className="wam-btn-edit"
              onClick={handleClose}
              disabled={isSaving}
            >
              ✏️ Editar pedido
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
