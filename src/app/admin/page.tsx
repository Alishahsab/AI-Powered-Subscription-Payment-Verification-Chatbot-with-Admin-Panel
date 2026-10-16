import { notFound } from "next/navigation";
import AdminEntry from "./AdminEntry";

// hidden entirely on the customer-only deployment (see APP_MODE in app/page.tsx)
export default function Page() {
  if (process.env.APP_MODE === "customer") notFound();
  return <AdminEntry />;
}
