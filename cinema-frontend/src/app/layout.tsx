  import { AuthProvider } from "./components/AuthContext";
  import Header from "./components/header"
  // import "./AuthContext.css";
  import "./globals.css";

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <body>
          <Header/>
          <AuthProvider>{children}</AuthProvider>
        </body>
      </html>
    );
  }