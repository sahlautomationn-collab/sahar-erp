import { Tajawal } from "next/font/google";
import "./globals.css";
import "toastify-js/src/toastify.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
});

export const metadata = {
  title: "SAHAR ERP",
  description: "Restaurant Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${tajawal.variable} font-sans bg-[#121212] text-gray-100 antialiased overflow-x-hidden`}>
        {/* كان هنا فيه <LanguageProvider> وإحنا شيلناه خلاص 
           دلوقتي بنعرض الـ children مباشرة 
        */}
        {children}
      </body>
    </html>
  );
}