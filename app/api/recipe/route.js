import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured." }, { status: 500 });
  }

  try {
    const { ingredients, time } = await request.json();
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "First line must be the recipe name, followed by the recipe details.",
          },
          {
            role: "user",
            content: `Create a recipe using: ${ingredients} in ${time} minutes.`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "Groq request failed." }, { status: response.status });
    }

    return NextResponse.json({ text: data.choices?.[0]?.message?.content || "" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to generate a recipe." }, { status: 500 });
  }
}