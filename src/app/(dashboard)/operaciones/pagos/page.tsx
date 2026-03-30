import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminPagosPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Reportes de Pago (PayFinal)</h2>
      <p className="text-muted-foreground">Cálculo automatizado de remuneraciones integrando sueldo base y la tabla de Producción (Bonos).</p>

      <Card>
        <CardHeader>
          <CardTitle>Periodo: Enero 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conductor</TableHead>
                <TableHead>Sueldo Base</TableHead>
                <TableHead>Total Bonos</TableHead>
                <TableHead className="text-right">PayFinal Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Egon Cardenas</TableCell>
                <TableCell>$600,000</TableCell>
                <TableCell>$185,000</TableCell>
                <TableCell className="text-right font-bold text-primary">$785,000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Enrique Castro</TableCell>
                <TableCell>$600,000</TableCell>
                <TableCell>$210,000</TableCell>
                <TableCell className="text-right font-bold text-primary">$810,000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Felipe Andrade</TableCell>
                <TableCell>$600,000</TableCell>
                <TableCell>$90,000</TableCell>
                <TableCell className="text-right font-bold text-primary">$690,000</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
