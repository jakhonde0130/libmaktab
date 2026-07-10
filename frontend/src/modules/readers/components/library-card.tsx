import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarcodeDisplay } from "@/components/shared/barcode-display";
import { QrCodeDisplay } from "@/components/shared/qr-code-display";
import type { Reader } from "@/modules/readers/types/reader";

export function LibraryCardDialog({
  reader,
  open,
  onOpenChange,
}: {
  reader: Reader;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Kutubxona kartasi</DialogTitle>
        </DialogHeader>
        <div id="library-card-print" className="mx-auto w-80 rounded-xl border-2 p-5 text-center">
          <p className="text-xs font-semibold uppercase text-muted-foreground">ILMS Kutubxonasi</p>
          <p className="mt-2 text-lg font-semibold">{reader.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {reader.reader_category === "student" ? "O'quvchi" : reader.reader_category}
            {reader.class ? ` — ${reader.class.name}-sinf` : ""}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <QrCodeDisplay value={reader.library_card_barcode} size={100} />
          </div>
          <div className="mt-3 flex justify-center">
            <BarcodeDisplay value={reader.library_card_barcode} height={40} />
          </div>
        </div>
        <Button className="print:hidden" onClick={() => window.print()}>
          <Printer className="size-4" />
          Chop etish
        </Button>
      </DialogContent>
    </Dialog>
  );
}
