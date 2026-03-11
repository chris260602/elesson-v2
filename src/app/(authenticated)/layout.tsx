import AppHeader from "@/components/custom-ui/shared/AppHeader";
import { AppSidebar } from "@/components/custom-ui/shared/AppSidebar";
import PermissionHandler from "@/components/handler/PermissionHandler";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CustomAppProvider } from "@/providers/CustomAppProvider";
import TanstackProvider from "@/providers/tanstackProvider";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <TanstackProvider>
      <CustomAppProvider>
        <PermissionHandler />
        <div className="w-full">
        <SidebarProvider style={{ "--sidebar-width": "280px" } as React.CSSProperties}>
            <AppSidebar />
            <main className="w-full overflow-auto bg-[linear-gradient(to_bottom_right,_#f5f3ff,_#eff6ff,_#e0e7ff)] dark:bg-none dark:bg-neutral-800">
              <AppHeader />
              <div className="w-full mx-auto p-5">{children}</div>
            </main>
          </SidebarProvider>
        </div>
        
         
      </CustomAppProvider>
    </TanstackProvider>
  );
}
