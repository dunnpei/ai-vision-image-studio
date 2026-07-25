import { GenerateApiRequest, GenerateApiResponse } from "@/types";

/**
 * 發送圖像生成 API 請求至 Next.js Server-side Route
 * 具備強健的 HTML 錯誤頁面防禦與 JSON 解析保護
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

    // 防禦性檢查：若回傳為 HTML 網頁 (以 <!DOCTYPE 或 <html 開頭)
    if (responseText.trim().startsWith("<")) {
      return {
        success: false,
        error: `伺服器或中轉站回傳了 HTML 網頁而非 JSON (HTTP ${response.status})。請檢查 API Key、API 主機網址 (${payload.userKeys?.baseUrl || "https://api.openai.com"}) 或模型名稱是否正確。`,
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
    return {
      success: false,
      error: error.message || "網路傳輸失敗，請檢查連線與 API 金鑰。",
    };
  }
}
