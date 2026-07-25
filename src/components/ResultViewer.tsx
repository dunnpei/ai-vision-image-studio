"use client";

import React, { useState, useRef } from "react";
import { Download, Copy, Check, Sparkles, Eye, Columns, Cpu, Server } from "lucide-react";
import { downloadImage, copyToClipboard } from "@/lib/image-utils";

interface ResultViewerProps {
  originalImage: string | null;
  generatedImageUrl: string;
  analyzedPrompt?: string;
  revisedPrompt?: string;
  prompt: string;
  usedModel?: string;
  usedBaseUrl?: string;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  originalImage,
  generatedImageUrl,
  analyzedPrompt,
  revisedPrompt,
  prompt,
  usedModel,
  usedBaseUrl,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeTab, setActiveTab] = useState<"slider" | "generated" | "original">("generated");
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleDownload = () => {
    downloadImage(generatedImageUrl, `ai-generated-${Date.now()}.png`);
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(generatedImageUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyPrompt = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  // 對比滑塊事件 handlers
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-white/10 space-y-5">
      {/* 工具控制頭部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">AI 生成成果展現</h2>
          {usedModel && (
            <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-xs font-mono text-indigo-300 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>模型: {usedModel}</span>
            </span>
          )}
        </div>

        {/* 檢視模式切換 */}
        <div className="flex items-center space-x-2">
          {originalImage && (
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => setActiveTab("generated")}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === "generated" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                生成圖
              </button>
              <button
                onClick={() => setActiveTab("slider")}
                className={`px-3 py-1 rounded-lg flex items-center space-x-1 transition ${
                  activeTab === "slider" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Before/After 對比</span>
              </button>
              <button
                onClick={() => setActiveTab("original")}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === "original" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                原圖
              </button>
            </div>
          )}

          {/* 下載與複製 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/60 transition"
              title="複製圖片連結"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? "已複製" : "複製連結"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition"
            >
              <Download className="w-4 h-4" />
              <span>高清下載</span>
            </button>
          </div>
        </div>
      </div>

      {/* 圖片展示主區域 */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[350px] flex items-center justify-center">
        {/* 切換一：單純生成圖 */}
        {activeTab === "generated" && (
          <div className="relative w-full flex items-center justify-center p-2">
            <img
              src={generatedImageUrl}
              alt="AI Generated Result"
              className="max-h-[600px] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

        {/* 切換二：單純原圖 */}
        {activeTab === "original" && originalImage && (
          <div className="relative w-full flex items-center justify-center p-2">
            <img
              src={originalImage}
              alt="Original Reference"
              className="max-h-[600px] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

        {/* 切換三：Before/After 對比滑軌 */}
        {activeTab === "slider" && originalImage && (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-full h-[480px] select-none cursor-ew-resize overflow-hidden"
          >
            {/* 底圖：生成圖 (After) */}
            <img
              src={generatedImageUrl}
              alt="After Generated"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-500/40 text-[11px] font-bold text-indigo-300 backdrop-blur z-10">
              AFTER (使用 {usedModel || "AI"} 生成)
            </div>

            {/* 上層圖：原圖 (Before, 經由 Clip 裁切) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={originalImage}
                alt="Before Original"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: containerRef.current?.getBoundingClientRect().width || "100%" }}
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-700 text-[11px] font-bold text-slate-300 backdrop-blur">
                BEFORE (原始圖片)
              </div>
            </div>

            {/* 中間分隔滑軌與手把 */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl font-bold text-xs">
                ↔
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 特徵分析與 Prompt 詳情資訊卡 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* GPT-4o Vision 分析 Prompt */}
        {analyzedPrompt && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Vision 特徵分析描述</span>
              </span>
              <button
                onClick={() => handleCopyPrompt(analyzedPrompt)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>複製</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              "{analyzedPrompt}"
            </p>
          </div>
        )}

        {/* 最終執行 Prompt / Revised Prompt */}
        <div className={`p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 ${!analyzedPrompt ? "md:col-span-2" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>生成提示詞 (Revised Prompt)</span>
            </span>
            <button
              onClick={() => handleCopyPrompt(revisedPrompt || prompt)}
              className="text-[11px] text-slate-400 hover:text-purple-300 flex items-center space-x-1"
            >
              <Copy className="w-3 h-3" />
              <span>複製</span>
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            {revisedPrompt || prompt}
          </p>
        </div>
      </div>
    </div>
  );
};
