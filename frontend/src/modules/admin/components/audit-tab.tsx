import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAuditLogs } from "@/modules/admin/api/admin-api";

export function AuditTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", "logs"],
    queryFn: () => listAuditLogs({ page: "1", pageSize: "50" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kim</TableHead>
          <TableHead>Amal</TableHead>
          <TableHead>Nima</TableHead>
          <TableHead>Vaqt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.data.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{log.actor?.full_name ?? "—"}</TableCell>
            <TableCell>
              <Badge variant="outline">{log.action}</Badge>
            </TableCell>
            <TableCell>{log.entity_table}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
