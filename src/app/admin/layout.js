'use client';
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#121212]">
      <Sidebar />
      
      {/* تثبيت الهامش يسار (ml-20) لأن السايد بار دائماً شمال */}
      <main className="flex-1 ml-20 p-6 w-full transition-all duration-300">
        {children}
      </main>
    </div>
  );
}