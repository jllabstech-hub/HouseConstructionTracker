import { redirect } from "next/navigation";

export default function LabourExpensesPage() {
  redirect("/expenses?type=LABOUR");
}
