"use client";

import React, { useState } from "react";
import { History, Trash2, Download, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { HistoryItem } from "@/types";
import { downloadImage } from "@/lib/image-utils";

interface HistoryGalleryProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const currentItems = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    if (validPage > 1) setCurrentPage(validPage - 1);
  };

  const handleNextPage = () => {
    if (validPage < totalPages) setCurrentPage(validPage + 1);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
      {/* 標題與分頁資訊 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">歷史生成畫廊 ({history.length})</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-medium text-slate-400 border border-slate-700">
            第 {validPage} / {totalPages} 頁 (每頁 {ITEMS_PER_PAGE} 張)
          </span>
        </div>

        <button
          onClick={onClearHistory}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 transition self-end sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清空紀錄</span>
        </button>
      </div>

      {/* 畫廊網格 (10張/頁: 2列 x 5欄) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {currentItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg flex flex-col justify-between"
          >
            {/* 圖片區域 */}
            <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
              <img
                src={item.generatedImageUrl}
                alt={item.prompt}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              {/* 比例標籤 */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-semibold text-slate-300 border border-slate-700">
                {item.aspectRatio}
              </div>

              {/* 單圖獨立刪除按鈕 (右上角 hover 或靜態顯示) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteHistoryItem(item.id);
                }}
                className="absolute top-2 right-2 p-1 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 transition opacity-80 group-hover:opacity-100 shadow-md"
                title="刪除此圖片"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 底部資訊 */}
            <div className="p-2 space-y-1">
              <p className="text-[11px] text-slate-200 line-clamp-2 font-medium leading-tight">
                {item.prompt}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <button
                  type="button"
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

      {/* 分頁控制列 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={validPage === 1}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              validPage === 1
                ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一頁</span>
          </button>

          {/* 頁碼顯示按鈕組 */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                  pageNum === validPage
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={validPage === totalPages}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              validPage === totalPages
                ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <span>下一頁</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
