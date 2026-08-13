import type { Metadata } from 'next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your VMWTEK Office workspace.',
};

const widgetTitles = [
  'Reminders',
  'Pending payments',
  'Active projects',
  'Open negotiations',
  'Money overview',
  'Pending tasks',
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A quick overview of your business. Widgets are coming soon.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {widgetTitles.map((title) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}
