import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Vision & Image Studio - 基於大模型的多模態圖像生成與處理工作台",
  description:
    "串接 OpenAI GPT-4o Vision 與 DALL-E 3 / Replicate API，提供圖片上傳分析、提示詞優化、多模態重繪與高清下載功能。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="bg-mesh min-h-screen text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
