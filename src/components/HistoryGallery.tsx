"use client";

import React from "react";
import { History, Trash2, Download, ExternalLink, Calendar } from "lucide-react";
import { HistoryItem } from "@/types";
import { downloadImage } from "@/lib/image-utils";

interface HistoryGalleryProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return (
      <div className="w-full glass-panel rounded-2xl p-6 text-center border border-white/10">
        <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
          <History className="w-8 h-8 opacity-40" />
          <p className="text-sm font-medium">尚無歷史生成紀錄</p>
          <p className="text-xs">發揮創意，開始您的第一次 AI 圖像生成吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
      {/* 標題與清空按鈕 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">歷史生成畫廊 ({history.length})</h2>
        </div>
        <button
          onClick={onClearHistory}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清空紀錄</span>
        </button>
      </div>

      {/* 畫廊網格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg"
          >
            {/* 圖片區域 */}
            <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
              <img
                src={item.generatedImageUrl}
                alt={item.prompt}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              {/* 比例與原圖標籤 */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-semibold text-slate-300 border border-slate-700">
                {item.aspectRatio}
              </div>
              {item.originalImage && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-indigo-950/80 text-[10px] font-semibold text-indigo-300 border border-indigo-500/40">
                  Img2Img
                </div>
              )}
            </div>

            {/* 底部資訊 */}
            <div className="p-2.5 space-y-1">
              <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                {item.prompt}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(item.generatedImageUrl, `history-${item.id}.png`);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="下載"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
