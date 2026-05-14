export const metadata = {
  title: "Mi Lonche Express",
  description: "Pedidos escolares"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
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