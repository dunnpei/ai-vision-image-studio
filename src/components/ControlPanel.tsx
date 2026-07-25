"use client";

import React from "react";
import { Sliders, Sparkles, AlertCircle, RectangleHorizontal as AspectRatioIcon, Layers, Zap, Server, Cpu } from "lucide-react";
import { AspectRatio, ApiProvider, GenerationConfig, UserApiKeys } from "@/types";

interface ControlPanelProps {
  config: GenerationConfig;
  onChangeConfig: (newConfig: GenerationConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasUploadedImage: boolean;
  userKeys: UserApiKeys;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onChangeConfig,
  onGenerate,
  isGenerating,
  hasUploadedImage,
  userKeys,
}) => {
  const aspectRatios: { label: string; value: AspectRatio; iconRatio: string }[] = [
    { label: "A4 (2K高畫質)", value: "A4", iconRatio: "w-3.5 h-5" },
    { label: "1:1 (正方形)", value: "1:1", iconRatio: "w-4 h-4" },
    { label: "16:9 (寬螢幕)", value: "16:9", iconRatio: "w-5 h-3" },
    { label: "9:16 (直向海報)", value: "9:16", iconRatio: "w-3 h-5" },
  ];

  const handleUpdate = <K extends keyof GenerationConfig>(
    key: K,
    value: GenerationConfig[K]
  ) => {
    onChangeConfig({ ...config, [key]: value });
  };

  const activeImageModel = userKeys.imageModel || "dall-e-3";
  const activeBaseUrl = userKeys.baseUrl || "https://api.openai.com";

  return (
    <div className="space-y-5 glass-panel rounded-2xl p-5 border border-white/10">
      {/* 區塊標題 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">提示詞與參數配置</h2>
        </div>
        {hasUploadedImage && (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-[11px] font-medium text-indigo-300 border border-indigo-500/30">
            Vision 分析中 ({userKeys.visionModel || "gpt-4o"})
          </span>
        )}
      </div>

      {/* 正向提示詞 (Positive Prompt) */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>正向提示詞 (Positive Prompt) *</span>
          <span className="text-[11px] text-slate-400 font-normal">詳細描述能帶來更高質量的畫面</span>
        </label>
        <textarea
          rows={3}
          value={config.prompt}
          onChange={(e) => handleUpdate("prompt", e.target.value)}
          placeholder="例如：一隻在雨中漫步的賽博朋克風格黑貓，霓虹燈光倒影，高品質，8K 解析度..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
        />
      </div>

      {/* 負向提示詞 (Negative Prompt) */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          負向提示詞 (Negative Prompt)
        </label>
        <input
          type="text"
          value={config.negativePrompt}
          onChange={(e) => handleUpdate("negativePrompt", e.target.value)}
          placeholder="避免出現的元素：模糊、多餘的手指、低畫質、文字浮水印..."
          className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
      </div>

      {/* API 提供者選擇 */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>生成模型引擎 (Provider Engine)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* OpenAI 相容 API (動態讀取自訂模型與主機) */}
          <button
            type="button"
            onClick={() => handleUpdate("provider", "openai")}
            className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-start transition ${
              config.provider === "openai"
                ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                : "bg-slate-900/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center space-x-1.5 font-semibold text-indigo-300">
              <Cpu className="w-3.5 h-3.5" />
              <span>OpenAI / 相容 API</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-1">
              模型：{activeImageModel}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-full mt-0.5">
              主機：{activeBaseUrl}
            </span>
          </button>

          {/* Replicate 原生 API */}
          <button
            type="button"
            onClick={() => handleUpdate("provider", "replicate")}
            className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-start transition ${
              config.provider === "replicate"
                ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                : "bg-slate-900/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center space-x-1.5 font-semibold text-indigo-300">
              <Server className="w-3.5 h-3.5" />
              <span>Replicate 原生 API</span>
            </div>
            <span className="text-[11px] text-purple-300 font-mono mt-1">
              模型：flux-schnell
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              支援精確 Img2Img 重繪
            </span>
          </button>
        </div>
      </div>

      {/* 圖片比例選擇 */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
          <AspectRatioIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>圖片比例 (Aspect Ratio)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.value}
              type="button"
              onClick={() => handleUpdate("aspectRatio", ratio.value)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition ${
                config.aspectRatio === ratio.value
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className={`border border-current rounded-sm ${ratio.iconRatio}`} />
              <span>{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Image-to-Image 重繪強度 Slider (當有圖片時顯示) */}
      {hasUploadedImage && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>原圖影響權重 (Image-to-Image Strength)</span>
            </label>
            <span className="text-xs font-bold text-indigo-400">{config.strength}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={config.strength}
            onChange={(e) => handleUpdate("strength", parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0.1 (微調風格)</span>
            <span>0.5 (平衡)</span>
            <span>1.0 (大幅重繪)</span>
          </div>
        </div>
      )}

      {/* 生成按鈕 */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className={`w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white flex items-center justify-center space-x-2 transition shadow-xl ${
          isGenerating
            ? "bg-slate-800 cursor-not-allowed opacity-75"
            : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-[0.99] shadow-indigo-600/30"
        }`}
      >
        <Sparkles className={`w-5 h-5 ${isGenerating ? "animate-spin text-indigo-400" : ""}`} />
        <span>
          {isGenerating ? `AI 正在使用 ${activeImageModel} 生成中...` : `使用 ${activeImageModel} 開始生成`}
        </span>
      </button>
    </div>
  );
};
