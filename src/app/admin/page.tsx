import { notFound } from "next/navigation";
import AdminEntry from "./AdminEntry";

export default function Page() {
  if (process.env.APP_MODE === "customer") notFound();
  return <AdminEntry />;
}
