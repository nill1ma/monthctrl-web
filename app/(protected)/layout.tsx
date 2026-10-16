import "@/app/globals.css";
import Sidebar from "../components/sidebar/sidebar";
import ChatWidget from "../components/chat/ChatWidget";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Sidebar />
      <main>{children}</main>
      <ChatWidget />
    </>
  );
}
