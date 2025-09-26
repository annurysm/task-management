import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/contexts/theme-context'
import { SocketProvider } from '@/contexts/socket-context'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Task Management - Product Design Team",
  description: "Kanban board and task management tool for product design teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
