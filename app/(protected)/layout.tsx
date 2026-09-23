import "@/app/globals.css";
import Sidebar from "../components/sidebar/sidebar";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Sidebar />
      <main>{children}</main>
    </>
  );
}
