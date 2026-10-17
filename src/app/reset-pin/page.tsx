import { notFound } from "next/navigation";
import ResetPinEntry from "./ResetPinEntry";

export default function Page() {
  if (process.env.APP_MODE === "admin") notFound();
  return <ResetPinEntry />;
}
