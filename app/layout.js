import "./globals.css";

export const metadata = {
  title: "Loadhalla — AI Dispatch Assistant",
  description: "AI-powered missed call recovery for trucking carriers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
