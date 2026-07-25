import { GenerateApiRequest, GenerateApiResponse } from "@/types";

/**
 * 發送圖像生成 API 請求至 Next.js Server-side Route
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

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP 錯誤：${response.status}`,
      };
    }

    return data as GenerateApiResponse;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "網路傳輸失敗，請檢查連線與 API 金鑰。",
    };
  }
}
