import { redirect } from "next/navigation";

export default function MaterialExpensesPage() {
  redirect("/expenses?type=MATERIAL");
}
