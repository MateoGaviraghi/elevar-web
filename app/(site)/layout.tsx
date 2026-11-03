import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollManager } from "@/components/anim/scroll-manager";
import { WhatsAppFab } from "@/components/common/whatsapp";
import { SmoothScroll } from "@/components/anim/smooth-scroll";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { VolverArriba } from "@/components/anim/volver-arriba";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <ScrollManager />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <VolverArriba />
      <WhatsAppFab />
      <CartDrawer />
    </>
  );
}
