import Header from "@/app/components/header/header";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import "@awakr/awake-ui/style.css";
import "@awakr/awake-ui/dark-theme.css";
import "./globals.css";
import I18nProvider from "./i18n/Provider";
import ReactQueryProvider from "./providers/RectQueryProvider/ReactQueryProvider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html suppressHydrationWarning lang="en" className="h-full antialiased">
      <body>
        <ReactQueryProvider>
          <ThemeProvider>
            <I18nProvider>
              <Header />
              {children}
            </I18nProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}