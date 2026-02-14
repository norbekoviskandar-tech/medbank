import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppProvider from "@/context/AppContext";
import ThemeWrapper from "@/components/ThemeWrapper";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata = {
  title: "IskyMD | The Precision Standard in Medical Education",
  description: "The clinical mastery suite engineered for excellence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} ${jetbrains.variable} antialiased`}
        suppressHydrationWarning
      >
        <AppProvider>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
