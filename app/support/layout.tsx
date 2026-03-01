import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GABS Core Ops | Tech Support",
  description: "L1/L2 Technical Support Dashboard",
  icons: {
    icon: "/support-icon.png", // Make sure this image is in your public folder!
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}