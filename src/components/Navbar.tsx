"use client";

import React from "react";
import { Sparkles, Key, History, Image as ImageIcon } from "lucide-react";
import { UserApiKeys } from "@/types";

interface NavbarProps {
  onOpenApiKeyModal: () => void;
  onScrollToHistory: () => void;
  userKeys: UserApiKeys;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenApiKeyModal,
  onScrollToHistory,
  userKeys,
}) => {
  const hasCustomKey = Boolean(userKeys.openaiKey || userKeys.replicateToken);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo 與標題 */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950/80 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              AI Vision & Image Studio
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              多模態圖文分析與高品質圖像生成工作台
            </p>
          </div>
        </div>

        {/* 右側按鈕區域 */}
        <div className="flex items-center space-x-3">
          {/* 歷史紀錄捷徑 */}
          <button
            onClick={onScrollToHistory}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 transition"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">歷史紀錄</span>
          </button>

          {/* API Key 設定按鈕 */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              hasCustomKey
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
                : "bg-indigo-950/50 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{hasCustomKey ? "自訂 Key 已啟用" : "設定 API Key"}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasCustomKey ? "bg-emerald-400 animate-ping" : "bg-indigo-400"
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
