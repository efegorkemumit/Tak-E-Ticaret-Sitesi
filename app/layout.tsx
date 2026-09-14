import type { Metadata } from "next";
import { Newsreader, Public_Sans, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/lib/cart/cart-context";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

/*
 * PLACEHOLDER tipografi — final marka fontu OPEN #2 (bkz. docs/DESIGN_DIRECTION.md,
 * docs/OPEN_QUESTIONS.md #2). Bu çift, "Açık Alan" yönünün display/body ayrımını
 * (ince/yüksek kontrastlı sakin serif + orta ağırlık sans) karşılamak için
 * seçilmiş geçici bir seçimdir. Marka kimliği netleşince yalnızca bu iki font
 * tanımı değişir; --font-display/--font-body token isimleri (app/globals.css)
 * sabit kalır, component'ler etkilenmez.
 */
const displayFont = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal"],
});

const bodyFont = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Marka kimliğinden bağımsız teknik/monospace ihtiyaç (ör. kod, sipariş no) —
// "Açık Alan" tasarım kararının bir parçası değildir, değiştirilmedi.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// PLACEHOLDER metadata — marka adı OPEN #1, final başlık/açıklama marka kimliği
// netleşince güncellenecektir.
export const metadata: Metadata = {
  title: "[Marka Adı] — Takı Mağazası (Geliştirme)",
  description: "Takı e-ticaret sitesi — geliştirme aşaması, henüz nihai içerik değildir.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${displayFont.variable} ${bodyFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ToastProvider>
          <CartProvider>
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
