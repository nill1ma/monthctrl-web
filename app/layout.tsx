import Header from "@/app/components/header/header";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import "@developmentsnil/awake-ui/style.css";
import "./globals.css";
import I18nProvider from "./i18n/Provider";
import ReactQueryProvider from "./providers/RectQueryProvider/ReactQueryProvider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html suppressHydrationWarning lang="en" className="h-full antialiased">
      <body>
        <ReactQueryProvider>
          <ThemeProvider>
            <I18nProvider locale="en">
              <Header />
              {children}
            </I18nProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}