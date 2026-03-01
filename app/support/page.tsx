import type { Metadata } from "next";
import SupportDashboard from "./SupportDashboard"; // Imports your UI

export const metadata: Metadata = {
  title: "GABS Core Ops | Tech Support",
  description: "L1/L2 Technical Support Dashboard",
};

export default function SupportPage() {
  // This simply loads your interactive dashboard inside the server shell
  return <SupportDashboard />; 
}