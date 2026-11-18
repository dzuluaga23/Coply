import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export const instant = false;

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getUserContext();

  if (!ctx) redirect("/ingresar");
  if (!ctx.family) redirect("/bienvenida");

  return (
    <SidebarProvider>
      <AppSidebar
        familyName={ctx.family.name}
        profile={ctx.profile}
        role={ctx.role}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium">{ctx.family.name}</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
