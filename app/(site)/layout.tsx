import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollManager } from "@/components/anim/scroll-manager";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollManager />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
