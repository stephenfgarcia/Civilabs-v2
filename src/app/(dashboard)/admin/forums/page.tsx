import { redirect } from "next/navigation";

// Redirect to the existing forums admin page
export default function AdminForumsPage() {
  redirect("/forums/admin");
}
