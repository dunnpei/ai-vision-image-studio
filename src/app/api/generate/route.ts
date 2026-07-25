import { NextRequest, NextResponse } from "next/server";
import { GenerateApiRequest, GenerateApiResponse } from "@/types";

// 設定 Vercel 執行的最大超時時間 (單位: 秒)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body: GenerateApiRequest = await req.json();
    const { image, config, userKeys } = body;

    if (!config) {
      return NextResponse.json<GenerateApiResponse>(
        { success: false, error: "缺少必要的生成設定 (config)" },
        { status: 400 }
      );
    }

    const { prompt, negativePrompt, aspectRatio, provider = "openai", strength = 0.75 } = config;

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

    let analyzedPrompt = "";

    // -------------------------------------------------------------
    // 步驟一：多模態圖片特徵分析 (Vision Model)
    // -------------------------------------------------------------
    if (image && openaiApiKey) {
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
                  "你是一位資深的視覺分析大師與 AI 圖像 Prompt 專家。請深入分析使用者上傳的圖片，提煉出該圖的藝術風格、構圖、主題色彩、光影質感與核心物件特徵。請輸出一段精準且詳細的英文風格描述 (Under 100 words)，適合做為 AI 繪圖模型的提示詞參考。",
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
      synthesizedPrompt = `${synthesizedPrompt ? `${synthesizedPrompt}. ` : ""}[Style & Visual references from uploaded image: ${analyzedPrompt}]`;
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
      // 尺寸與比例適配
      const imageApiEndpoint = `${baseUrl}/v1/images/generations`;

      let requestPayload: any;

      if (aspectRatio === "A4") {
        // A4 比例：完全不傳 size 欄位，僅傳 width/height
        // gpt-image-2 遇到 size 與 width/height 並存時，優先採用 size 而忽略 width/height
        // 因此必須徹底移除 size，讓模型直接依照 width:1024, height:1448 生成精準 A4 圖片
        requestPayload = {
          model: imageModel,
          prompt: synthesizedPrompt,
          n: 1,
          width: 1024,
          height: 1448,
          quality: "hd",
          response_format: "url",
        };
      } else {
        // 其他標準比例：使用白名單 size 字串
        let imageSize = "1024x1024";
        if (aspectRatio === "16:9") imageSize = "1792x1024";
        if (aspectRatio === "9:16") imageSize = "1024x1792";

        requestPayload = {
          model: imageModel,
          prompt: synthesizedPrompt,
          n: 1,
          size: imageSize,
          quality: "hd",
          response_format: "url",
        };
      }

      const dalleResponse = await fetch(imageApiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      const responseText = await dalleResponse.text();

      if (responseText.trim().startsWith("<")) {
        return NextResponse.json<GenerateApiResponse>(
          {
            success: false,
            error: `API 主機 (${baseUrl}) 回傳了 HTML 錯誤網頁 (HTTP ${dalleResponse.status})。請檢查主機網址、API Key 或該中轉站是否支援模型 ${imageModel}。`,
          },
          { status: 502 }
        );
      }

      let dalleData: any;
      try {
        dalleData = JSON.parse(responseText);
      } catch (parseErr) {
        return NextResponse.json<GenerateApiResponse>(
          {
            success: false,
            error: `中轉站 API 回傳非 JSON 格式：${responseText.slice(0, 100)}...`,
          },
          { status: 500 }
        );
      }

      if (!dalleResponse.ok) {
        return NextResponse.json<GenerateApiResponse>(
          {
            success: false,
            error: dalleData.error?.message || dalleData.message || `${imageModel} 圖像生成失敗 (HTTP ${dalleResponse.status})`,
          },
          { status: dalleResponse.status }
        );
      }

      if (!dalleData.data || !Array.isArray(dalleData.data) || dalleData.data.length === 0) {
        return NextResponse.json<GenerateApiResponse>(
          {
            success: false,
            error: `API 回傳結果中未找到圖片資料。`,
          },
          { status: 500 }
        );
      }

      generatedImageUrls = dalleData.data.map((item: any) => item.url || item.b64_json);
      revisedPromptOutput = dalleData.data[0]?.revised_prompt || synthesizedPrompt;
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

    return NextResponse.json<GenerateApiResponse>({
      success: true,
      imageUrls: generatedImageUrls,
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
