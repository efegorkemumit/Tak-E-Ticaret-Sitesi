import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/lib/cart/cart-context";
import { ToastProvider } from "@/components/ui/toast";

/**
 * VIDEO 07 WAVE B-1 — public storefront'un kendi layout'u. Kök `app/layout.tsx`'ten
 * taşındı (`SiteHeader`/`SiteFooter`/`CartProvider`/`ToastProvider`); bu route
 * group (`(storefront)`) URL'e yansımaz — `/urunler` hâlâ `/urunler`'dir.
 * `app/admin/**` bu layout'un DIŞINDA kalır (kardeş bir route), bu yüzden
 * admin sayfaları artık bu public chrome'u hiç görmez.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </CartProvider>
    </ToastProvider>
  );
}
