"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, AlertTriangle, FileCheck } from "lucide-react";
import { compressImageIfNeeded } from "@/lib/image-utils";

interface ImageUploaderProps {
  image: string | null;
  onImageChange: (base64: string | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ image, onImageChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("請選擇有效的圖片檔案 (PNG, JPG, WEBP)！");
      return;
    }

    try {
      setIsCompressing(true);
      setCompressionInfo(null);

      const result = await compressImageIfNeeded(file, 10);
      onImageChange(result.base64);

      if (result.isCompressed) {
        const origMB = (result.originalSize / (1024 * 1024)).toFixed(1);
        const newMB = (result.newSize / (1024 * 1024)).toFixed(1);
        setCompressionInfo(`原檔 (${origMB}MB) 已自動前端壓縮至 (${newMB}MB)`);
      }
    } catch (err) {
      console.error("圖片處理失敗:", err);
      alert("圖片讀取或壓縮失敗，請換一張試試！");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onImageChange(null);
    setCompressionInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
          <ImageIcon className="w-4 h-4 text-indigo-400" />
          <span>參考圖片上傳 (Optional Image-to-Image / Vision)</span>
        </label>
        {image && (
          <span className="text-[11px] font-medium text-emerald-400 flex items-center space-x-1">
            <FileCheck className="w-3.5 h-3.5" />
            <span>圖片已載入</span>
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {!image ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
            isDragging
              ? "border-indigo-400 bg-indigo-950/40 scale-[1.01]"
              : "border-slate-700/70 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/70"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition duration-300">
              {isCompressing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {isCompressing
                  ? "圖片壓縮與解析中..."
                  : "點擊上傳 或 將圖片拖曳至此"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                支援 PNG, JPG, WEBP（大於 10MB 自動前端壓縮）
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden glass-panel border border-indigo-500/30 group">
          {/* 圖片預覽區域 */}
          <div className="relative h-56 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src={image}
              alt="Uploaded Reference"
              className="max-h-full max-w-full object-contain transition group-hover:scale-105 duration-300"
            />
            {/* 遮罩按鈕組 */}
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold shadow-lg backdrop-blur"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重新上傳</span>
              </button>
              <button
                onClick={handleRemove}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg backdrop-blur"
              >
                <Trash2 className="w-4 h-4" />
                <span>刪除圖片</span>
              </button>
            </div>
          </div>

          {/* 壓縮資訊提醒 */}
          {compressionInfo && (
            <div className="px-3.5 py-2 bg-amber-950/40 border-t border-amber-500/20 text-[11px] text-amber-300 flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{compressionInfo}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
