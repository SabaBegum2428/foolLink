import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "FoodLink - Real-time Food Redistribution",
  description: "Connecting Donors, NGO / Receivers, and Volunteers to combat hunger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Nav />
          <main className="container">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
