import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { genre, theme, description, videoLength, sequelContext, musicDescription } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sceneCount = Math.max(5, Math.min(12, Math.round(videoLength / 10)));

    const systemPrompt = `You are a professional story writer for faceless content videos. You create compelling, vivid narration scripts broken into scenes. Each scene should be 8-12 seconds of narration (roughly 20-30 words). Generate exactly ${sceneCount} scenes.

For each scene, provide:
1. "narration" - the voiceover text (vivid, engaging, conversational)
2. "imagePrompt" - a detailed visual description for AI image generation (cinematic, dramatic lighting, no text in image)
3. "durationSeconds" - how long this scene should last (8-12 seconds)

Return a JSON object using the tool provided.`;

    const userPrompt = `Genre: ${genre}
Theme: ${theme}
Description: ${description}
Target video length: ${videoLength} seconds
Background music mood: ${musicDescription || "dramatic and atmospheric"}
${sequelContext ? `This is a SEQUEL. Previous story context: ${sequelContext}\nContinue the story from where it left off.` : ""}

Create a compelling ${genre} story with exactly ${sceneCount} scenes. Total narration time should be approximately ${videoLength} seconds.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_story",
              description: "Create a story with scenes for video generation",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Catchy story title" },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        narration: { type: "string" },
                        imagePrompt: { type: "string" },
                        durationSeconds: { type: "number" },
                      },
                      required: ["narration", "imagePrompt", "durationSeconds"],
                    },
                  },
                  summary: { type: "string", description: "Brief story summary for sequels" },
                },
                required: ["title", "scenes", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_story" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Failed to generate story");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No story generated");

    const story = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(story), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-story error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
