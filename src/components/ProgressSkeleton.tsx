"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Cpu, Eye, Palette, CheckCircle2 } from "lucide-react";

interface ProgressSkeletonProps {
  hasOriginalImage: boolean;
}

export const ProgressSkeleton: React.FC<ProgressSkeletonProps> = ({ hasOriginalImage }) => {
  const [progress, setProgress] = useState(10);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { label: "初始化 AI 繪圖引擎...", icon: Cpu },
    ...(hasOriginalImage ? [{ label: "GPT-4o Vision 正深入分析圖片藝術風格...", icon: Eye }] : []),
    { label: "正在發送提示詞與神經網路渲染...", icon: Palette },
    { label: "微調畫面色彩與細節高畫質輸出...", icon: Sparkles },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92; // 保持在 92% 直到 API 回傳完成
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return next > 92 ? 92 : next;
      });
    }, 800);

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [steps.length]);

  const CurrentIcon = steps[stepIndex]?.icon || Sparkles;

  return (
    <div className="w-full glass-panel rounded-2xl p-6 border border-indigo-500/30 shadow-2xl flex flex-col items-center justify-center space-y-6">
      {/* 脈衝發光中央動畫區 */}
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl bg-slate-900/90 border border-indigo-500/20 overflow-hidden flex items-center justify-center">
        {/* Shimmer 流光效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-shimmer" />

        {/* 動態光環 */}
        <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-500 opacity-20 blur-xl animate-pulse-glow" />

        <div className="relative z-10 flex flex-col items-center space-y-3 p-4 text-center">
          <div className="p-3.5 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 text-indigo-300 animate-bounce">
            <CurrentIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-slate-200">
            {steps[stepIndex]?.label}
          </span>
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
            {progress}%
          </span>
        </div>
      </div>

      {/* 自訂進度條 */}
      <div className="w-full max-w-md space-y-2">
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 步驟清單點 */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center space-x-1 transition ${
                idx <= stepIndex ? "text-indigo-300 font-medium" : "text-slate-600"
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  idx <= stepIndex ? "text-indigo-400" : "text-slate-700"
                }`}
              />
              <span className="hidden sm:inline">Step {idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
