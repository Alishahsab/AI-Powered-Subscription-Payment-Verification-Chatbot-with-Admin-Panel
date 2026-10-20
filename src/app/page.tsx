import { redirect } from "next/navigation";
import CustomerEntry from "./CustomerEntry";
export default function Page() {
  if (process.env.APP_MODE === "admin") redirect("/admin");
  return <CustomerEntry />;
}
