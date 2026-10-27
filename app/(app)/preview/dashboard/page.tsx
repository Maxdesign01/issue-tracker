import type { Metadata } from "next";
import { PresentationDashboard } from "@/components/dashboard/presentation-dashboard";

export const metadata: Metadata = {
  title: "Ziki Command & Front Desk — Presentation Dashboard",
  description: "Refined, presentation-ready Ziki dashboard with whimsical dot-matrix analytics and integrated Human-Agent Interaction review.",
};

export default function DashboardPreviewPage() {
  return <PresentationDashboard />;
}