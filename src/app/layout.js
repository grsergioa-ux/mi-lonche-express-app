export const metadata = {
  title: "Mi Lonche Express",
  description: "Pedidos escolares"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

import { CartProvider } from "./context/CartContext";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

<input
  style={{
    width: "100%",
    marginBottom: 10,
    padding: 12,
    fontSize: 16 // 👈 CLAVE para evitar zoom en iOS
  }}
/>