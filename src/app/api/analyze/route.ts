import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, userKeys } = body;

    if (!image) {
      return NextResponse.json({ success: false, error: "未提供圖片資料" }, { status: 400 });
    }

    const openaiApiKey = userKeys?.openaiKey || process.env.OPENAI_API_KEY;
    const rawBaseUrl = userKeys?.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com";
    const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
    const visionModel = userKeys?.visionModel || "gpt-4o";

    if (!openaiApiKey) {
      return NextResponse.json({ success: false, error: "未找到 API Key" }, { status: 401 });
    }

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
    if (visionText.trim().startsWith("<")) {
      return NextResponse.json({ success: false, error: "Vision API 回傳 HTML 錯誤網頁" }, { status: 502 });
    }

    const visionData = JSON.parse(visionText);
    const analyzedPrompt = visionData.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({
      success: true,
      analyzedPrompt,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Vision 分析失敗" }, { status: 500 });
  }
}
