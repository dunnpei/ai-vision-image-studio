"use client";

import React, { useState, useEffect } from "react";
import { X, Key, ShieldCheck, Check, Server, Cpu, Sparkles } from "lucide-react";
import { UserApiKeys } from "@/types";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userKeys: UserApiKeys;
  onSaveKeys: (keys: UserApiKeys) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  userKeys,
  onSaveKeys,
}) => {
  const [openaiKey, setOpenaiKey] = useState(userKeys.openaiKey || "");
  const [baseUrl, setBaseUrl] = useState(userKeys.baseUrl || "https://api.openai.com");
  const [visionModel, setVisionModel] = useState(userKeys.visionModel || "gpt-4o");
  const [imageModel, setImageModel] = useState(userKeys.imageModel || "dall-e-3");
  const [replicateToken, setReplicateToken] = useState(userKeys.replicateToken || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setOpenaiKey(userKeys.openaiKey || "");
    setBaseUrl(userKeys.baseUrl || "https://api.openai.com");
    setVisionModel(userKeys.visionModel || "gpt-4o");
    setImageModel(userKeys.imageModel || "dall-e-3");
    setReplicateToken(userKeys.replicateToken || "");
  }, [userKeys, isOpen]);

  if (!isOpen) return null;

  // 格式化主機網址
  const cleanedBaseUrl = baseUrl.trim().replace(/\/+$/, "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKeys({
      openaiKey: openaiKey.trim(),
      baseUrl: cleanedBaseUrl || "https://api.openai.com",
      visionModel: visionModel.trim() || "gpt-4o",
      imageModel: imageModel.trim() || "dall-e-3",
      replicateToken: replicateToken.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setOpenaiKey("");
    setBaseUrl("https://api.openai.com");
    setVisionModel("gpt-4o");
    setImageModel("dall-e-3");
    setReplicateToken("");
    onSaveKeys({
      openaiKey: "",
      baseUrl: "https://api.openai.com",
      visionModel: "gpt-4o",
      imageModel: "dall-e-3",
      replicateToken: "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 背景裝飾光罩 */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* 標題頭部 */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">API 設定與模型配置</h3>
              <p className="text-xs text-slate-400">支援自訂 API 主機位置與任意指定模型代碼</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 安全提示標籤 */}
        <div className="my-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <span>
            所有設定均經由 Next.js Server Route 安全代理呼叫，金鑰僅存於您的瀏覽器本地 (LocalStorage)，嚴禁暴露於前端。
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. API 金鑰 */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              API 金鑰 (API Key) *
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
            />
          </div>

          {/* 2. API 主機位置 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>API 主機位置 (Base URL)</span>
              </label>
              <div className="flex space-x-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setBaseUrl("https://api.openai.com")}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  官方預設
                </button>
                <button
                  type="button"
                  onClick={() => setBaseUrl("https://api.bltcy.ai")}
                  className="px-1.5 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 transition"
                >
                  bltcy 中轉
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="https://api.openai.com 或 https://api.bltcy.ai"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
            />
            {/* 動態 Endpoint 預覽 */}
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              預覽：<span className="text-indigo-300">{cleanedBaseUrl || "https://api.openai.com"}</span>/v1/chat/completions
            </p>
          </div>

          {/* 3. Vision 分析模型 (自由填寫 / datalist 選項) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Vision 分析模型 (可自訂輸入任何模型 ID)</span>
              </label>
            </div>
            <input
              type="text"
              list="vision-model-list"
              placeholder="輸入如 gpt-4o, gpt-4o-mini, claude-3-5-sonnet..."
              value={visionModel}
              onChange={(e) => setVisionModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
            />
            <datalist id="vision-model-list">
              <option value="gpt-4o" />
              <option value="gpt-4o-mini" />
              <option value="gpt-4-turbo" />
              <option value="claude-3-5-sonnet" />
            </datalist>
            {/* 快速快捷鍵點選標籤 */}
            <div className="flex items-center space-x-1.5 mt-1.5 flex-wrap gap-y-1">
              <span className="text-[10px] text-slate-400">常用快捷：</span>
              {["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setVisionModel(m)}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                    visionModel === m
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 4. 圖像生成模型 (自由填寫 / datalist 選項) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>圖像生成模型 (可自由填寫例如：image-2, dall-e-3 等)</span>
              </label>
            </div>
            <input
              type="text"
              list="image-model-list"
              placeholder="輸入如 image-2, dall-e-3, dall-e-2, flux, midjourney..."
              value={imageModel}
              onChange={(e) => setImageModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
            />
            <datalist id="image-model-list">
              <option value="dall-e-3" />
              <option value="image-2" />
              <option value="dall-e-2" />
              <option value="flux" />
              <option value="midjourney" />
            </datalist>
            {/* 快速快捷鍵點選標籤 */}
            <div className="flex items-center space-x-1.5 mt-1.5 flex-wrap gap-y-1">
              <span className="text-[10px] text-slate-400">常用快捷：</span>
              {["dall-e-3", "image-2", "dall-e-2", "flux"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setImageModel(m)}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                    imageModel === m
                      ? "bg-pink-600 text-white font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 5. 進階選填：Replicate Token */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Replicate API Token (選填，直接呼叫 Replicate 原生 API)
            </label>
            <input
              type="password"
              placeholder="r8_..."
              value={replicateToken}
              onChange={(e) => setReplicateToken(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* 按鈕組 */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
            >
              重置設為預設
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 transition"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition shadow-lg shadow-indigo-600/30"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>已儲存設定！</span>
                  </>
                ) : (
                  <span>儲存設定</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
