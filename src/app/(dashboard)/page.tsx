import type { Metadata } from 'next';

import { ActiveProjectsWidget } from '@/components/dashboard/active-projects-widget';
import { MoneyOverviewWidget } from '@/components/dashboard/money-overview-widget';
import { OpenNegotiationsWidget } from '@/components/dashboard/open-negotiations-widget';
import { PendingPaymentsWidget } from '@/components/dashboard/pending-payments-widget';
import { PendingTasksWidget } from '@/components/dashboard/pending-tasks-widget';
import { RemindersWidget } from '@/components/dashboard/reminders-widget';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your VMWTEK Office workspace.',
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A quick overview of your business.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RemindersWidget />
        <PendingTasksWidget />
        <ActiveProjectsWidget className="md:col-span-2 xl:col-span-1" />
        <OpenNegotiationsWidget />
        <PendingPaymentsWidget />
        <MoneyOverviewWidget className="md:col-span-2 xl:col-span-1" />
      </div>
    </div>
  );
}
