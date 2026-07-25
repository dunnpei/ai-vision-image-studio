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
    // 步驟一：多模態圖片特徵分析 (Vision Model: 自訂模型或 gpt-4o)
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
                  "你是一位資深的視覺分析大師與 AI 圖像 Prompt 專家。請深入分析使用者上傳的圖片，提煉出該圖的藝術風格、構圖、主題色彩、光影質感與核心物件特徵。請輸出一段精準且詳細的英文風格描述 (Under 100 words)，適合做為 AI 繪圖模型 (DALL-E 3 / Stable Diffusion) 的提示詞參考。",
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

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          analyzedPrompt = visionData.choices?.[0]?.message?.content?.trim() || "";
        } else {
          console.warn("Vision API 回傳非 200，將跳過原圖分析:", await visionResponse.text());
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

    if (!synthesizedPrompt.trim()) {
      return NextResponse.json<GenerateApiResponse>(
        { success: false, error: "請輸入提示詞或上傳圖片以供分析！" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // 步驟三：呼叫圖像生成 API
    // -------------------------------------------------------------
    let generatedImageUrls: string[] = [];
    let revisedPromptOutput = "";

    if (provider === "openai") {
      // 尺寸與比例適配 (精準 A4 比例 1 : 1.414)
      let imageSize: string = "1024x1024";
      if (aspectRatio === "A4") imageSize = "1024x1448"; // 真正 ISO 216 A4 比例 (1024x1448)
      if (aspectRatio === "16:9") imageSize = "1792x1024";
      if (aspectRatio === "9:16") imageSize = "1024x1792";

      const imageApiEndpoint = `${baseUrl}/v1/images/generations`;

      const dalleResponse = await fetch(imageApiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: imageModel,
          prompt: synthesizedPrompt,
          n: 1,
          size: imageSize,
          quality: "hd",
          response_format: "url",
        }),
      });

      const dalleData = await dalleResponse.json();

      if (!dalleResponse.ok) {
        return NextResponse.json<GenerateApiResponse>(
          {
            success: false,
            error: dalleData.error?.message || `${imageModel} 圖像生成失敗 (${dalleResponse.status})`,
          },
          { status: dalleResponse.status }
        );
      }

      generatedImageUrls = dalleData.data.map((item: any) => item.url || item.b64_json);
      revisedPromptOutput = dalleData.data[0]?.revised_prompt || synthesizedPrompt;
    } else if (provider === "replicate") {
      let aspect_ratio_str = "1:1";
      if (aspectRatio === "A4") aspect_ratio_str = "3:4";
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
            ...(image ? { image, prompt_strength: strength } : {}),
          },
        }),
      });

      const replicateData = await replicateRes.json();

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
      } else {
        return NextResponse.json<GenerateApiResponse>(
          { success: false, error: "Replicate 回傳了非預期的圖片格式" },
          { status: 500 }
        );
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
