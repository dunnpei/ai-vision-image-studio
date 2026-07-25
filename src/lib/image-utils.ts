/**
 * 前端圖片處理工具
 */

/**
 * 將 File 物件轉為 Base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 自動檢測圖片容量並使用 Canvas 進行前端壓縮
 */
export async function compressImageIfNeeded(
  file: File,
  maxSizeMB: number = 10,
  maxDimension: number = 2048
): Promise<{ base64: string; isCompressed: boolean; originalSize: number; newSize: number }> {
  const originalSize = file.size;
  const sizeMB = originalSize / (1024 * 1024);

  const base64Data = await fileToBase64(file);

  if (sizeMB <= maxSizeMB) {
    return {
      base64: base64Data,
      isCompressed: false,
      originalSize,
      newSize: originalSize,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Data;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Canvas 上下文取得失敗"));
      }

      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
      const approxNewSize = Math.round((compressedBase64.length * 3) / 4);

      resolve({
        base64: compressedBase64,
        isCompressed: true,
        originalSize,
        newSize: approxNewSize,
      });
    };
    img.onerror = (err) => reject(err);
  });
}

/**
 * 零後製裁切：100% 原汁原味呈現 AI 原生生成的完整畫幅與內容，確保 0% 內容被切掉
 */
export async function cropToA4Ratio(imageUrl: string): Promise<string> {
  // 直接回傳 AI 原生圖像，不做任何後製裁切或變形，100% 保留圖片頂部與底部所有細節
  return imageUrl;
}

/**
 * 觸發瀏覽器下載圖片（支援 Base64 Data URL 與遠端 URL，自訂檔名 100% 生效）
 */
export async function downloadImage(url: string, filename: string = "generated-image.png"): Promise<void> {
  try {
    let blobUrl: string;

    if (url.startsWith("data:")) {
      // Base64 Data URL：直接轉 Blob，自訂檔名 100% 生效
      const [header, data] = url.split(",");
      const mime = header.match(/data:(.*?);/)?.[1] || "image/png";
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      blobUrl = URL.createObjectURL(blob);
    } else {
      // 遠端 URL：嘗試 fetch 後轉 Blob
      const response = await fetch(url);
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
    }

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("下載圖片失敗:", err);
    window.open(url, "_blank");
  }
}

/**
 * 複製文字/連結至剪貼簿
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  } catch (err) {
    console.error("複製失敗:", err);
    return false;
  }
}
