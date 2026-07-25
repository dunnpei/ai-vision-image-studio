import { GenerateApiRequest, GenerateApiResponse } from "@/types";

/**
 * 瀏覽器直連中轉站發送圖像生成（自動備援機制：當 Vercel 觸發 10秒超時限制時自動接管）
 * 瀏覽器原生 fetch 沒有 Vercel 10秒限制，可穩定等待中轉站 20秒完成生成
 */
async function directBrowserGenerate(
  payload: GenerateApiRequest
): Promise<GenerateApiResponse> {
  try {
    const { config, userKeys, analyzedPrompt } = payload;
    const openaiApiKey = userKeys?.openaiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
    const rawBaseUrl = userKeys?.baseUrl || "https://api.openai.com";
    const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
    const imageModel = userKeys?.imageModel || "dall-e-3";

    let synthesizedPrompt = config.prompt.trim();

    if (analyzedPrompt) {
      const cleaned = analyzedPrompt
        .replace(/\b(square|1:1|aspect ratio|landscape|portrait|horizontal|vertical|wide|tall|16:9|9:16|4:3|3:4)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      if (cleaned) {
        synthesizedPrompt = `${synthesizedPrompt ? `${synthesizedPrompt}. ` : ""}[Style & Visual references from uploaded image: ${cleaned}]`;
      }
    }

    if (config.negativePrompt && config.negativePrompt.trim()) {
      synthesizedPrompt += ` [Avoid elements: ${config.negativePrompt.trim()}]`;
    }

    if (config.aspectRatio === "A4") {
      synthesizedPrompt += " [Format: ISO 216 A4 vertical poster document, 1:1.414 aspect ratio, full-bleed design, complete text inside canvas]";
    }

    const endpoint = `${baseUrl}/v1/images/generations`;
    let bodyData: any;

    if (config.aspectRatio === "A4") {
      bodyData = {
        model: imageModel,
        prompt: synthesizedPrompt,
        n: 1,
        size: "1024x1448",
        width: 1024,
        height: 1448,
        aspect_ratio: "1:1.414",
        quality: "hd",
        response_format: "url",
      };
    } else {
      let sizeStr = "1024x1024";
      if (config.aspectRatio === "16:9") sizeStr = "1792x1024";
      if (config.aspectRatio === "9:16") sizeStr = "1024x1792";
      bodyData = {
        model: imageModel,
        prompt: synthesizedPrompt,
        n: 1,
        size: sizeStr,
        quality: "hd",
        response_format: "url",
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(bodyData),
    });

    const text = await response.text();
    if (text.trim().startsWith("<")) {
      return { success: false, error: `中轉站 API 直連失敗 (HTTP ${response.status})。請檢查 API Key 或 Base URL。` };
    }

    const data = JSON.parse(text);
    if (!response.ok) {
      return { success: false, error: data.error?.message || data.message || `生成失敗 (HTTP ${response.status})` };
    }

    const url = data.data?.[0]?.url || data.data?.[0]?.b64_json;
    if (!url) {
      return { success: false, error: "API 回傳結果中未找到圖片 URL" };
    }

    return {
      success: true,
      imageUrls: [url],
      revisedPrompt: data.data?.[0]?.revised_prompt || synthesizedPrompt,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "直連中轉站請求失敗",
    };
  }
}

/**
 * 發送圖像生成 API 請求至 Next.js Server-side Route
 * 當偵測到 Vercel FUNCTION_INVOCATION_TIMEOUT 超時時，自動無縫切換為前端直連中轉站
 */
export async function generateImageApi(
  payload: GenerateApiRequest
): Promise<GenerateApiResponse> {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    // 防禦性自動接管：當 Vercel 觸發 10秒 Serverless 超時或回傳 HTML 超時頁面時，自動轉為瀏覽器直連
    if (
      responseText.includes("FUNCTION_INVOCATION_TIMEOUT") ||
      (response.status === 504 || response.status === 502) ||
      (responseText.trim().startsWith("<") && responseText.includes("Vercel"))
    ) {
      console.warn("偵測到 Vercel Serverless 超時，自動切換為前端瀏覽器直連中轉站...");
      return await directBrowserGenerate(payload);
    }

    // 若為其他 HTML 錯誤
    if (responseText.trim().startsWith("<")) {
      return {
        success: false,
        error: `伺服器或中轉站回傳了 HTML 網頁 (HTTP ${response.status})。請檢查 API Key、API 主機網址 (${payload.userKeys?.baseUrl || "https://api.openai.com"}) 或模型名稱。`,
      };
    }

    let data: GenerateApiResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      return {
        success: false,
        error: `無法解析 API 回傳結果：${responseText.slice(0, 100)}...`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP 錯誤：${response.status}`,
      };
    }

    return data;
  } catch (error: any) {
    console.warn("API 請求發生錯誤，嘗試切換前端直連...", error);
    return await directBrowserGenerate(payload);
  }
}

/**
 * 發送 Vision 分析請求至獨立 /api/analyze 端點
 * 快速於 2 秒內完成圖像風格特徵提取
 */
export async function analyzeImageApi(
  image: string,
  userKeys?: Record<string, any>
): Promise<{ success: boolean; analyzedPrompt?: string; error?: string }> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, userKeys }),
    });
    const text = await response.text();
    if (text.trim().startsWith("<")) {
      return { success: false, error: "Vision 分析 API 回傳 HTML 錯誤" };
    }
    return JSON.parse(text);
  } catch (err: any) {
    return { success: false, error: err.message || "Vision 分析失敗" };
  }
}
