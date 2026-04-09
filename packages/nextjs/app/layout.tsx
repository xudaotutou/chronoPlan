import type { Metadata } from "next";
import { ScaffoldStarkAppWithProviders } from "~~/components/ScaffoldStarkAppWithProviders";
import "~~/styles/globals.css";

export const metadata: Metadata = {
  title: "ChronoPlan",
  description: "Time-Weighted Average Mass Meeting Schedule System",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='none' stroke='%23c4a762' stroke-width='4'/><circle cx='50' cy='50' r='35' fill='none' stroke='%23c4a762' stroke-width='2' opacity='0.5'/><line x1='50' y1='50' x2='50' y2='20' stroke='%23c4a762' stroke-width='3' stroke-linecap='round'/><line x1='50' y1='50' x2='70' y2='50' stroke='%23c4a762' stroke-width='2' stroke-linecap='round'/><circle cx='50' cy='50' r='4' fill='%23c4a762'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="chrono" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ScaffoldStarkAppWithProviders>
          {children}
        </ScaffoldStarkAppWithProviders>
      </body>
    </html>
  );
}
