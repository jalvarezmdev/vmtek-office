import type { InferSelectModel } from 'drizzle-orm';
import { StickyNote } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { notes } from '@/db/schema';
import { formatDateTime } from '@/lib/money';

export type NotesTabProps = {
  notes: InferSelectModel<typeof notes>[];
};

export function NotesTab({ notes: noteRows }: NotesTabProps) {
  return (
    <Card>
      <CardContent className="pt-0">
        {noteRows.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            title="No notes"
            description="Notes for this project will show up here."
          />
        ) : (
          <ul className="divide-y">
            {noteRows.map((note) => (
              <li key={note.id} className="flex flex-col gap-1 py-3">
                <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t pt-3 text-xs text-muted-foreground">
          Notes are added from the Notes page or entity forms.
        </p>
      </CardContent>
    </Card>
  );
}
