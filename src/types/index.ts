export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
}
