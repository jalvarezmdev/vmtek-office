import { NotFoundContent } from '@/components/not-found-content';

export const metadata = {
  title: 'Page not found',
};

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <NotFoundContent />
    </div>
  );
}
