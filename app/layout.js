import "./globals.css";

export const metadata = {
  title: "BIZPILOT AI | Turn Business Data Into Your Next Best Move",
  description: "Multi-agent AI business assistant that turns your data into an actionable plan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
