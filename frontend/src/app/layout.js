import { Inter } from "next/font/google";
import { ToastNotification } from "@/components/core/ToastNotification";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-app",
});

export const metadata = {
  title: "SOLUM ESL Stock",
  description: "Kelola stok artikel dan nyalakan LED label ESL SOLUM",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <ToastNotification />
      </body>
    </html>
  );
};

export default RootLayout;
