import "@/app/globals.css";
import Sidebar from "../components/sidebar/sidebar";
import Header from "../components/header/header";
// import '@developmentsnil/awake-ui/style.css';

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <Sidebar />
      <main>{children}</main>
    </>
  );
}
