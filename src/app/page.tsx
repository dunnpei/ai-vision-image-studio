"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { ImageUploader } from "@/components/ImageUploader";
import { ControlPanel } from "@/components/ControlPanel";
import { ProgressSkeleton } from "@/components/ProgressSkeleton";
import { ResultViewer } from "@/components/ResultViewer";
import { HistoryGallery } from "@/components/HistoryGallery";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { GenerateApiResponse, GenerationConfig, HistoryItem, UserApiKeys } from "@/types";
import { cropToA4Ratio, downloadImage } from "@/lib/image-utils";
import { generateImageApi, analyzeImageApi } from "@/lib/api-client";
import { Sparkles, AlertCircle, Wand2 } from "lucide-react";

export default function Home() {
  // 圖片上傳狀態
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // 參數配置狀態
  const [config, setConfig] = useState<GenerationConfig>({
    prompt: "",
    negativePrompt: "",
    aspectRatio: "A4",
    numOutputs: 1,
    imageCount: 1,
    strength: 0.75,
    provider: "openai",
  });

  // 使用者自訂 Key 狀態
  const [userKeys, setUserKeys] = useState<UserApiKeys>({
    openaiKey: "",
    replicateToken: "",
    baseUrl: "https://api.openai.com",
    visionModel: "gpt-4o",
    imageModel: "dall-e-3",
  });

  // API 執行與結果狀態
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imageUrls: string[];  // 支援多張圖片
    analyzedPrompt?: string;
    revisedPrompt?: string;
    usedModel?: string;
    usedBaseUrl?: string;
  } | null>(null);

  // 歷史紀錄狀態
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // 初始化時讀取 LocalStorage
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem("ai_studio_user_keys");
      if (savedKeys) setUserKeys(JSON.parse(savedKeys));

      const savedHistory = localStorage.getItem("ai_studio_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.error("讀取 LocalStorage 失敗:", e);
    }
  }, []);

  // 儲存 Key 至 LocalStorage
  const handleSaveKeys = (keys: UserApiKeys) => {
    setUserKeys(keys);
    try {
      localStorage.setItem("ai_studio_user_keys", JSON.stringify(keys));
    } catch (e) {
      console.error("寫入 LocalStorage 失敗:", e);
    }
  };

  // 處理清空歷史紀錄
  const handleClearHistory = () => {
    if (confirm("確定要清空所有歷史生成紀錄嗎？")) {
      setHistory([]);
      localStorage.removeItem("ai_studio_history");
    }
  };

  // 處理單圖獨立刪除歷史紀錄
  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("ai_studio_history", JSON.stringify(updated));
      } catch (e) {
        console.error("寫入 LocalStorage 失敗:", e);
      }
      return updated;
    });
  };

  // 發送生成請求（兩階段架構：步驟一獨立 Vision 分析 ~2s，步驟二平行生圖 ~8s，100% 避開 Vercel 超時）
  const handleGenerate = async () => {
    if (!config.prompt.trim() && !uploadedImage) {
      setApiError("請輸入提示詞 (Prompt) 或上傳參考圖片！");
      return;
    }

    setApiError(null);
    setIsGenerating(true);
    setResult(null);

    const activeModel = config.provider === "openai" ? (userKeys.imageModel || "dall-e-3") : "flux-schnell";
    const activeBaseUrl = userKeys.baseUrl || "https://api.openai.com";

    try {
      let visionAnalyzedPrompt = "";

      // 步驟一：若有上傳參考圖，先獨立執行 Vision 分析 (~2秒完成)
      if (uploadedImage) {
        const analyzeRes = await analyzeImageApi(uploadedImage, userKeys);
        if (analyzeRes.success && analyzeRes.analyzedPrompt) {
          visionAnalyzedPrompt = analyzeRes.analyzedPrompt;
        }
      }

      // 步驟二：前端同時發出 N 個獨立生圖請求 (每個請求固定 n:1，單獨佔用 ~8秒 Serverless 實例，100% 不超時)
      const singleConfig: GenerationConfig = { ...config, imageCount: 1 };
      const requests = Array.from({ length: config.imageCount }, () =>
        generateImageApi({
          image: uploadedImage,
          config: singleConfig,
          userKeys,
          analyzedPrompt: visionAnalyzedPrompt || undefined,
        })
      );

      const responses = await Promise.all(requests);
      setIsGenerating(false);

      const allUrls: string[] = [];
      let firstRevised: string | undefined;

      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        if (!res.success || !res.imageUrls?.length) {
          setApiError(res.error || `圖像 ${i + 1} 生成失敗。`);
          return;
        }
        allUrls.push(...res.imageUrls);
        if (i === 0) firstRevised = res.revisedPrompt;
      }

      const newResult = {
        imageUrls: allUrls,
        analyzedPrompt: visionAnalyzedPrompt || undefined,
        revisedPrompt: firstRevised,
        usedModel: activeModel,
        usedBaseUrl: activeBaseUrl,
      };

      setResult(newResult);

      const newItems: HistoryItem[] = allUrls.map((url, idx) => ({
        id: `${Date.now()}-${idx}`,
        timestamp: Date.now(),
        originalImage: uploadedImage,
        generatedImageUrl: url,
        prompt: config.prompt || "無文字提示詞 (從圖片分析)",
        aspectRatio: config.aspectRatio,
        analyzedPrompt: visionAnalyzedPrompt || undefined,
      }));

      const updatedHistory = [...newItems, ...history];
      setHistory(updatedHistory);
      try {
        localStorage.setItem("ai_studio_history", JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("儲存歷史紀錄失敗:", e);
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err: any) {
      setIsGenerating(false);
      setApiError(err.message || "生成過程發生未預期錯誤，請稍後再試。");
    }
  };

  // 選取歷史紀錄載入結果
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setUploadedImage(item.originalImage || null);
    setConfig((prev) => ({
      ...prev,
      prompt: item.prompt,
      aspectRatio: item.aspectRatio,
    }));
    setResult({
      imageUrls: [item.generatedImageUrl],
      analyzedPrompt: item.analyzedPrompt,
      usedModel: userKeys.imageModel || "dall-e-3",
    });
    resultRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 導覽頁頭 */}
      <Navbar
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onScrollToHistory={scrollToHistory}
        userKeys={userKeys}
      />

      {/* 主內容區塊 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner 標語 */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI 大語言模型 + Vision 多模態串接</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-300 tracking-tight">
            創造、重繪與衍生無限視覺靈感
          </h2>
          <p className="text-sm text-slate-400">
            上傳圖片自動分析視覺特徵，結合 AI 提示詞引擎，即刻生成畫質卓越的專屬圖像。
          </p>
        </div>

        {/* 錯誤警示條 */}
        {apiError && (
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-sm text-rose-200 flex items-start space-x-3 shadow-xl">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block text-rose-300">生成過程發生錯誤：</span>
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="text-xs bg-rose-900/60 hover:bg-rose-800 px-3 py-1 rounded-lg text-rose-100 underline transition"
            >
              檢查 Key / 主機設定
            </button>
          </div>
        )}

        {/* 雙欄控制與輸入網格 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 左欄：圖片上傳 (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <ImageUploader image={uploadedImage} onImageChange={setUploadedImage} />
          </div>

          {/* 右欄：提示詞與參數 (7 cols) */}
          <div className="lg:col-span-7">
            <ControlPanel
              config={config}
              onChangeConfig={setConfig}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              hasUploadedImage={Boolean(uploadedImage)}
              userKeys={userKeys}
            />
          </div>
        </div>

        {/* 生成結果展示 / 載入進度區域 */}
        <div ref={resultRef} className="pt-4">
          {isGenerating && (
            <ProgressSkeleton hasOriginalImage={Boolean(uploadedImage)} />
          )}

          {!isGenerating && result && (
            <ResultViewer
              originalImage={uploadedImage}
              imageUrls={result.imageUrls}
              analyzedPrompt={result.analyzedPrompt}
              revisedPrompt={result.revisedPrompt}
              prompt={config.prompt}
              usedModel={result.usedModel}
              usedBaseUrl={result.usedBaseUrl}
            />
          )}
        </div>

        {/* 歷史紀錄畫廊區域 */}
        <div ref={historyRef} className="pt-6">
          <HistoryGallery
            history={history}
            onSelectHistory={handleSelectHistoryItem}
            onClearHistory={handleClearHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
          />
        </div>
      </main>

      {/* 頁尾 */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-slate-500 glass-panel mt-12">
        <p>© 2026 AI Vision & Image Studio. Powered by Next.js & OpenAI / Replicate.</p>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        userKeys={userKeys}
        onSaveKeys={handleSaveKeys}
      />
    </div>
  );
}
