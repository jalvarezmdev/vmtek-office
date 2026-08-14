import { NotFoundContent } from '@/components/not-found-content';

export const metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center p-4">
      <NotFoundContent />
    </div>
  );
}
