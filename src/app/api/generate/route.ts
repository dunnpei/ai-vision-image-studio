import { NextRequest, NextResponse } from "next/server";
import { GenerateApiRequest, GenerateApiResponse } from "@/types";

// 設定 Vercel 執行的最大超時時間 (單位: 秒)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body: GenerateApiRequest = await req.json();
    const { image, config, userKeys, analyzedPrompt: preAnalyzedPrompt } = body;

    if (!config) {
      return NextResponse.json<GenerateApiResponse>(
        { success: false, error: "缺少必要的生成設定 (config)" },
        { status: 400 }
      );
    }

    const { prompt, negativePrompt, aspectRatio, provider = "openai", strength = 0.75, imageCount = 1 } = config;

    // 取得 API Key（優先使用前端傳入的個人 Key，其次為伺服器環境變數）
    const openaiApiKey = userKeys?.openaiKey || process.env.OPENAI_API_KEY;
    const replicateToken = userKeys?.replicateToken || process.env.REPLICATE_API_TOKEN;

    // 取得自訂 Base URL 與模型名稱
    const rawBaseUrl = userKeys?.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com";
    const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
    const visionModel = userKeys?.visionModel || "gpt-4o";
    const imageModel = userKeys?.imageModel || "dall-e-3";

    // 根據選擇的 Provider 進行 Key 檢查
    if (provider === "openai" && !openaiApiKey) {
      return NextResponse.json<GenerateApiResponse>(
        {
          success: false,
          error: "未找到 API Key！請於右上方設定面板輸入您的個人 API Key，或在伺服器設定 OPENAI_API_KEY。",
        },
        { status: 401 }
      );
    }

    if (provider === "replicate" && !replicateToken) {
      return NextResponse.json<GenerateApiResponse>(
        {
          success: false,
          error: "未找到 Replicate API Token！請於右上方設定面板輸入您的個人 Token，或在伺服器設定 REPLICATE_API_TOKEN。",
        },
        { status: 401 }
      );
    }

    let analyzedPrompt = preAnalyzedPrompt || "";

    // -------------------------------------------------------------
    // 步驟一：多模態圖片特徵分析 (若尚未分析過才執行)
    // -------------------------------------------------------------
    if (!analyzedPrompt && image && openaiApiKey) {
      try {
        const visionApiEndpoint = `${baseUrl}/v1/chat/completions`;
        const visionResponse = await fetch(visionApiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: visionModel,
            messages: [
              {
                role: "system",
                content:
                  "你是一位資深的視覺分析大師與 AI 圖像 Prompt 專家。請深入分析使用者上傳的圖片，提煉出該圖的藝術風格、主題色彩、光影質感與核心物件特徵（注意：嚴禁描述或包含任何圖片形狀、畫布長寬比例或尺寸詞彙，如 square, 1:1, portrait, landscape, vertical, horizontal 等）。請輸出一段精準且詳細的英文風格與視覺細節描述 (Under 100 words)，適合做為 AI 繪圖模型的提示詞參考。",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "請分析此圖片的視覺特徵與藝術風格：",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: image,
                    },
                  },
                ],
              },
            ],
            max_tokens: 300,
          }),
        });

        const visionText = await visionResponse.text();
        if (visionResponse.ok && !visionText.trim().startsWith("<")) {
          try {
            const visionData = JSON.parse(visionText);
            analyzedPrompt = visionData.choices?.[0]?.message?.content?.trim() || "";
          } catch (e) {
            console.warn("Vision 解析非 JSON 格式:", visionText.slice(0, 100));
          }
        }
      } catch (visionErr) {
        console.error("Vision 分析失敗，繼續進行純提示詞生成:", visionErr);
      }
    }

    // -------------------------------------------------------------
    // 步驟二：建構最終合成提示詞 (Prompt Synthesis)
    // -------------------------------------------------------------
    let synthesizedPrompt = prompt.trim();

    if (analyzedPrompt) {
      // 徹底過濾 Vision 分析結果中可能殘留的長寬比/形狀詞彙，避免干擾指定的 aspectRatio
      const cleanedAnalyzedPrompt = analyzedPrompt
        .replace(/\b(square|1:1|aspect ratio|landscape|portrait|horizontal|vertical|wide|tall|16:9|9:16|4:3|3:4)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      if (cleanedAnalyzedPrompt) {
        synthesizedPrompt = `${synthesizedPrompt ? `${synthesizedPrompt}. ` : ""}[Style & Visual references from uploaded image: ${cleanedAnalyzedPrompt}]`;
      }
    }

    if (negativePrompt && negativePrompt.trim()) {
      synthesizedPrompt += ` [Avoid elements: ${negativePrompt.trim()}]`;
    }

    if (aspectRatio === "A4") {
      synthesizedPrompt += " [Format: ISO 216 A4 vertical poster document, 1:1.414 aspect ratio, full-bleed design, complete text inside canvas]";
    }

    if (!synthesizedPrompt.trim()) {
      return NextResponse.json<GenerateApiResponse>(
        { success: false, error: "請輸入提示詞或上傳圖片以供分析！" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // 步驟三：呼叫圖像生成 API (支援原生 A4 1024x1448 與尺寸參數)
    // -------------------------------------------------------------
    let generatedImageUrls: string[] = [];
    let revisedPromptOutput = "";

    if (provider === "openai") {
      const imageApiEndpoint = `${baseUrl}/v1/images/generations`;

      // 建立單次請求 Payload 工廠函式（固定 n:1，同時帶入所有可能的尺寸參數）
      const buildPayload = () => {
        if (aspectRatio === "A4") {
          // 同時攜帶 size: "1024x1448"、width/height 與 aspect_ratio
          // 防範中轉站 API 在缺少 size 欄位時自動補上預設 "1024x1024" (1:1)
          return {
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
          let imageSize = "1024x1024";
          if (aspectRatio === "16:9") imageSize = "1792x1024";
          if (aspectRatio === "9:16") imageSize = "1024x1792";
          return {
            model: imageModel,
            prompt: synthesizedPrompt,
            n: 1,
            size: imageSize,
            quality: "hd",
            response_format: "url",
          };
        }
      };

      // 解析所有回應，收集圖片 URL
      const allUrls: string[] = [];
      let firstRevisedPrompt = "";

      const fetchOneImage = async (index: number): Promise<void> => {
        const res = await fetch(imageApiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify(buildPayload()),
        });

        const text = await res.text();

        if (text.trim().startsWith("<")) {
          throw new Error(`API 主機 (${baseUrl}) 回傳了 HTML 錯誤網頁 (HTTP ${res.status})。請檢查主機網址、API Key 或模型 ${imageModel}。`);
        }

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`圖像 ${index + 1} 回傳非 JSON 格式：${text.slice(0, 80)}...`);
        }

        if (!res.ok) {
          throw new Error(data.error?.message || data.message || `圖像 ${index + 1} 生成失敗 (HTTP ${res.status})`);
        }

        const url = data.data?.[0]?.url || data.data?.[0]?.b64_json;
        if (!url) {
          throw new Error(`圖像 ${index + 1} API 回傳結果中未找到圖片資料。`);
        }

        allUrls.push(url);
        if (index === 0) firstRevisedPrompt = data.data?.[0]?.revised_prompt || synthesizedPrompt;
      };

      try {
        // 所有比例均採用 Promise.all 平行發送，將總耗時控制在單張時間內 (~10-12秒)，防止 Vercel 超時
        await Promise.all(
          Array.from({ length: imageCount }, (_, i) => fetchOneImage(i))
        );
      } catch (fetchErr: any) {
        return NextResponse.json<GenerateApiResponse>(
          { success: false, error: fetchErr.message || "圖像生成請求失敗" },
          { status: 500 }
        );
      }

      generatedImageUrls = allUrls;
      revisedPromptOutput = firstRevisedPrompt;
    } else if (provider === "replicate") {
      let aspect_ratio_str = "1:1";
      if (aspectRatio === "A4") aspect_ratio_str = "1:1.414"; // 原生 A4 比例
      if (aspectRatio === "16:9") aspect_ratio_str = "16:9";
      if (aspectRatio === "9:16") aspect_ratio_str = "9:16";

      const replicateVersion = "black-forest-labs/flux-schnell";

      const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${replicateToken}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          version: replicateVersion,
          input: {
            prompt: synthesizedPrompt,
            aspect_ratio: aspect_ratio_str,
            width: aspectRatio === "A4" ? 1024 : undefined,
            height: aspectRatio === "A4" ? 1448 : undefined,
            ...(image ? { image, prompt_strength: strength } : {}),
          },
        }),
      });

      const replicateText = await replicateRes.text();
      if (replicateText.trim().startsWith("<")) {
        return NextResponse.json<GenerateApiResponse>(
          { success: false, error: "Replicate API 回傳了 HTML 錯誤網頁，請檢查 Token。" },
          { status: 502 }
        );
      }

      const replicateData = JSON.parse(replicateText);

      if (!replicateRes.ok) {
        return NextResponse.json<GenerateApiResponse>(
          {
            success: false,
            error: replicateData.detail || "Replicate API 呼叫失敗",
          },
          { status: replicateRes.status }
        );
      }

      const output = replicateData.output;
      if (Array.isArray(output)) {
        generatedImageUrls = output;
      } else if (typeof output === "string") {
        generatedImageUrls = [output];
      }
      revisedPromptOutput = synthesizedPrompt;
    }

    // 將 CDN 遠端 URL 轉為 Base64 Data URL（突破 CORS 限制，讓前端可自訂下載檔名）
    const base64Urls = await Promise.all(
      generatedImageUrls.map(async (urlItem: string) => {
        if (urlItem.startsWith("data:")) return urlItem;
        try {
          const imgRes = await fetch(urlItem);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            const mimeType = imgRes.headers.get("content-type") || "image/png";
            return `data:${mimeType};base64,${base64}`;
          }
        } catch (fetchErr) {
          console.warn("後端轉 Base64 失敗，使用原始 URL:", fetchErr);
        }
        return urlItem;
      })
    );

    return NextResponse.json<GenerateApiResponse>({
      success: true,
      imageUrls: base64Urls,
      analyzedPrompt: analyzedPrompt || undefined,
      revisedPrompt: revisedPromptOutput || undefined,
    });
  } catch (err: any) {
    console.error("生成 API 發生未預期錯誤:", err);
    return NextResponse.json<GenerateApiResponse>(
      {
        success: false,
        error: err.message || "伺服器內部錯誤，請稍後再試。",
      },
      { status: 500 }
    );
  }
}
