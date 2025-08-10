import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Miden Web App",
  description: "A Miden blockchain wallet application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Disable MetaMask injection to prevent unwanted Ethereum connection attempts */}
        <meta name="metamask:disable" content="true" />
        <meta name="ethereum:disable" content="true" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Disable MetaMask and Ethereum providers to prevent unwanted connection attempts
              if (typeof window !== 'undefined') {
                // Remove any existing Ethereum providers
                if (window.ethereum) {
                  delete window.ethereum;
                }
                // Remove any existing web3 providers
                if (window.web3) {
                  delete window.web3;
                }
                // Prevent MetaMask from injecting
                Object.defineProperty(window, 'ethereum', {
                  get: function() { return undefined; },
                  set: function() { return undefined; },
                  configurable: false
                });
                
                // Suppress MetaMask-related console errors
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('MetaMask') || message.includes('Failed to connect to MetaMask')) {
                    // Suppress MetaMask errors
                    return;
                  }
                  // Call original console.error for other errors
                  originalConsoleError.apply(console, args);
                };
              }
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
