import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const headerWidths = ['w-24', 'w-20', 'w-16', 'w-20', 'w-16'];
const cellWidths = ['w-24', 'w-32', 'w-16', 'w-20', 'w-24'];

export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      <Card>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                {headerWidths.map((width) => (
                  <TableHead key={width}>
                    <Skeleton className={`h-4 ${width}`} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, row) => (
                <TableRow key={row}>
                  {cellWidths.map((width, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className={`h-4 ${width}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
