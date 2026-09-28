import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_MODEL?.trim();
    if (!key || !model) throw new Error("OPENAI_API_KEY or OPENAI_MODEL is not configured");

    const raw = await request.text();
    if (raw.length > 40_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const body = JSON.parse(raw);
    const schemaName = body.response_format?.json_schema?.name;
    if (!['spoilsport_verdicts', 'film_terms'].includes(schemaName) ||
        body.response_format?.type !== 'json_schema' ||
        !Array.isArray(body.messages) || body.messages.length !== 2 ||
        body.messages[0]?.role !== 'system' || body.messages[1]?.role !== 'user' ||
        body.messages.some((message: { content?: unknown }) => typeof message.content !== 'string')) {
      return NextResponse.json({ error: "Invalid extension request" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        reasoning_effort: "none",
        max_completion_tokens: 1600,
        messages: body.messages,
        response_format: body.response_format,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Classification failed" }, { status: 500 });
  }
}
