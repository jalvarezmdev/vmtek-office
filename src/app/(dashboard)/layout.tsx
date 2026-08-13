import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader user={session.user} />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
