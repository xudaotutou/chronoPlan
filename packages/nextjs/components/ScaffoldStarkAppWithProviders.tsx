"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { Header } from "~~/components/Header";
import { GetStarknetProvider } from "@starknet-io/get-starknet-modal";
import ClientDynamicFooter from "./scaffold-stark/ClientDynamicFooter";

// Configure QueryClient with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 429 rate limit errors
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("429")) {
          return false;
        }
        return failureCount < 2;
      },
      // Reduce network traffic
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const ScaffoldStarkApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex relative flex-col min-h-screen bg-main">
        <Header />
        <main className="flex-grow container mx-auto px-4 pb-12">
          {children}
        </main>
        <ClientDynamicFooter />
      </div>
      <Toaster position="bottom-right" />
    </>
  );
};

const LoadingPlaceholder = () => (
  <div className="min-h-screen bg-main flex items-center justify-center">
    <div className="text-center">
      <div className="loading loading-spinner loading-lg text-primary"></div>
      <p className="mt-4">Loading...</p>
    </div>
  </div>
);

export function ScaffoldStarkAppWithProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      themes={["chrono", "chrono-light"]}
      defaultTheme="chrono"
      enableSystem={false}
    >
      <QueryClientProvider client={queryClient}>
        <GetStarknetProvider>
          <ScaffoldStarkApp>{children}</ScaffoldStarkApp>
        </GetStarknetProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default ScaffoldStarkAppWithProviders;
