export interface DashboardSummary {
  totalBooks: number;
  totalCopies: number;
  electronicBooks: number;
  activeReaders: number;
  issuedToday: number;
  returnedToday: number;
  overdueLoans: number;
  mostBorrowedBook: { bookId: string; title: string; borrowCount: number } | null;
  mostActiveReader: { readerId: string; fullName: string; borrowCount: number } | null;
}
