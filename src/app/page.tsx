import { redirect } from "next/navigation";
import CustomerEntry from "./CustomerEntry";

/*
 * APP_MODE lets the same code deploy as separate projects:
 *   "customer" → only the chatbot (/admin returns 404)
 *   "admin"    → only the admin panel (/ redirects to /admin)
 *   unset      → both (single deployment)
 */
export default function Page() {
  if (process.env.APP_MODE === "admin") redirect("/admin");
  return <CustomerEntry />;
}
