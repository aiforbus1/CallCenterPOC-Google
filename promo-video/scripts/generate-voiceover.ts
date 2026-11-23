import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Egyptian Police Emergency Hotline 122 - Voiceover Generation Script
 *
 * Requirements:
 * 1. Configurable TTS provider via environment variables:
 *    - TTS_PROVIDER: "openrouter" | "openai" | "elevenlabs" | "placeholder" (auto-detected)
 *    - OPENROUTER_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY (read from env, never hardcoded/logged)
 *    - TTS_VOICE (default: "Aoede" for Gemini, "onyx" for OpenAI)
 * 2. Fallback to silent placeholder tracks of exact scene duration if no key is available.
 * 3. Output files to public/audio/vo/scene{1..6}.mp3
 * 4. Measure duration with ffprobe and warn if any scene budget is exceeded by >10%.
 */

// Scene Voiceover Texts & Target Timings
export interface SceneVODefinition {
  sceneId: number;
  name: string;
  targetSeconds: number;
  targetFrames: number;
  arabicText: string;
  subtitles: Array<{
    text: string;
    relativeStartRatio: number;
    relativeEndRatio: number;
  }>;
}

export const SCENE_VO_DEFINITIONS: SceneVODefinition[] = [
  {
    sceneId: 1,
    name: "problem",
    targetSeconds: 12,
    targetFrames: 360,
    arabicText:
      "فِي اللَّحَظَاتِ الحَرِجَةِ لِبَلَاغَاتِ النَّجْدَةِ، يَتَحَدَّثُ الموَاطِنُ تَحْتَ وَطْأَةِ الفَزَعِ وَاللَّهْجَةِ الدَّارِجَةِ وَضَجِيجِ الطَّرِيقِ، فَتَضِيعُ أَرْقَامٌ وَتَلْتَبِسُ مَوَاقِعُ حَيَوِيَّةٌ.",
    subtitles: [
      {
        text: "فِي اللَّحَظَاتِ الحَرِجَةِ لِبَلَاغَاتِ النَّجْدَةِ..",
        relativeStartRatio: 0.05,
        relativeEndRatio: 0.45,
      },
      {
        text: "يَتَحَدَّثُ الموَاطِنُ تَحْتَ وَطْأَةِ الفَزَعِ وَاللَّهْجَةِ الدَّارِجَةِ وَضَجِيجِ الطَّرِيقِ، فَتَضِيعُ أَرْقَامٌ وَتَلْتَبِسُ مَوَاقِعُ حَيَوِيَّةٌ.",
        relativeStartRatio: 0.48,
        relativeEndRatio: 0.95,
      },
    ],
  },
  {
    sceneId: 2,
    name: "solutionIntro",
    targetSeconds: 10,
    targetFrames: 300,
    arabicText:
      "المساعد الذكي لبلاغات طوارئ مائة واثنين وعشرين: ذَكَاءٌ اصْطِنَاعِيٌّ سِيَادِيٌّ يُعَزِّزُ مَأْمُورَ العَمَلِيَّاتِ، يَفْهَمُ اللَّهْجَةَ المِصْرِيَّةَ، وَيُوَثِّقُ أَدَقَّ تَفَاصِيلِ البَلَاغِ دُونَ خَطَأٍ أَوْ تَأْخِيرٍ.",
    subtitles: [
      {
        text: "المساعد الذكي لبلاغات طوارئ 122: ذَكَاءٌ اصْطِنَاعِيٌّ سِيَادِيٌّ يُعَزِّزُ مَأْمُورَ العَمَلِيَّاتِ، يَفْهَمُ اللَّهْجَةَ المِصْرِيَّةَ، وَيُوَثِّقُ أَدَقَّ تَفَاصِيلِ البَلَاغِ دُونَ خَطَأٍ أَوْ تَأْخِيرٍ.",
        relativeStartRatio: 0.05,
        relativeEndRatio: 0.95,
      },
    ],
  },
  {
    sceneId: 3,
    name: "liveDemo",
    targetSeconds: 33,
    targetFrames: 990,
    arabicText:
      "بِمُجَرَّدِ اتِّصَالِ الموَاطِنِ، تُحَوِّلُ مَنْظُومَةُ التَّفْرِيغِ الصَّوْتِيِّ اللَّحْظِيِّ الكَلَامَ إِلَى نَصٍّ مُبَاشِرٍ. وَهُنَا يَتَدَخَّلُ المُصَحِّحُ اللُّغَوِيُّ الذَّكِيُّ لِضَبْطِ الأَخْطَاءِ الصَّوْتِيَّةِ دُونَ إِضَافَةِ أَيِّ وَقَائِعَ. وَإِذَا شُوِّهَتِ الكَلِمَاتُ كَقَوْلِ المَتَّصِلِ «مَشْغَرَة»، يَتَعَرَّفُ المُطَابِقُ الدَّلَالِيُّ فَوْرًا عَلَى نَوْعِ الحَادِثِ كَـ «مُشَاجَرَة». وَإِنْ غَمُضَ المَعْنَى، فَالـمَنْظُومَةُ لَا تُغْلِقُ الخَطَّ أَبَدًا، بَلْ تَسْتَوْضِحُ بِلَبَاقَةٍ لِإِتْمَامِ البَلَاغِ.",
    subtitles: [
      {
        text: "بِمُجَرَّدِ اتِّصَالِ الموَاطِنِ، تُحَوِّلُ مَنْظُومَةُ التَّفْرِيغِ الصَّوْتِيِّ اللَّحْظِيِّ الكَلَامَ إِلَى نَصٍّ مُبَاشِرٍ.",
        relativeStartRatio: 0.02,
        relativeEndRatio: 0.28,
      },
      {
        text: "يَتَدَخَّلُ المُصَحِّحُ اللُّغَوِيُّ الذَّكِيُّ لِضَبْطِ الأَخْطَاءِ الصَّوْتِيَّةِ دُونَ إِضَافَةِ أَيِّ وَقَائِعَ.",
        relativeStartRatio: 0.3,
        relativeEndRatio: 0.55,
      },
      {
        text: "وَإِذَا شُوِّهَتِ الكَلِمَاتُ كَقَوْلِ المَتَّصِلِ «مَشْغَرَة»، يَتَعَرَّفُ المُطَابِقُ الدَّلَالِيُّ فَوْرًا عَلَى نَوْعِ الحَادِثِ كَـ «مُشَاجَرَة».",
        relativeStartRatio: 0.57,
        relativeEndRatio: 0.78,
      },
      {
        text: "وَإِنْ غَمُضَ المَعْنَى، فَالـمَنْظُومَةُ لَا تُغْلِقُ الخَطَّ أَبَدًا، بَلْ تَسْتَوْضِحُ بِلَبَاقَةٍ لِإِتْمَامِ البَلَاغِ.",
        relativeStartRatio: 0.8,
        relativeEndRatio: 0.98,
      },
    ],
  },
  {
    sceneId: 4,
    name: "questionTree",
    targetSeconds: 17,
    targetFrames: 510,
    arabicText:
      "تَبْدَأُ كُلُّ مُكَالَمَةٍ بِأَرْبَعَةِ أَسْئِلَةٍ جَوْهَرِيَّةٍ: الاسْمُ، الهَاتِفُ، المَوْقِعُ المُفَصَّلُ، وَنَوْعُ البَلَاغِ. ثُمَّ تَنْطَلِقُ شَجَرَةُ اسْتِفْسَارَاتٍ مُنَظَّمَةٍ تُغَطِّي عِشْرِينَ سِينَارْيُو عَمَلَيَاتِيًّا تَتَوَزَّعُ عَبْرَ خَمْسَةِ مَحَاوِرَ رَئِيسِيَّةٍ، مُوَجِّهَةً مَأْمُورَ النَّجْدَةِ خَطْوَةً بِخَطْوَةٍ.",
    subtitles: [
      {
        text: "تَبْدَأُ كُلُّ مُكَالَمَةٍ بِأَرْبَعَةِ أَسْئِلَةٍ جَوْهَرِيَّةٍ: الاسْمُ، الهَاتِفُ، المَوْقِعُ المُفَصَّلُ، وَنَوْعُ البَلَاغِ.",
        relativeStartRatio: 0.03,
        relativeEndRatio: 0.45,
      },
      {
        text: "ثُمَّ تَنْطَلِقُ شَجَرَةُ اسْتِفْسَارَاتٍ مُنَظَّمَةٍ تُغَطِّي عِشْرِينَ سِينَارْيُو عَمَلَيَاتِيًّا تَتَوَزَّعُ عَبْرَ خَمْسَةِ مَحَاوِرَ رَئِيسِيَّةٍ.",
        relativeStartRatio: 0.48,
        relativeEndRatio: 0.97,
      },
    ],
  },
  {
    sceneId: 5,
    name: "trustAndSafety",
    targetSeconds: 18,
    targetFrames: 540,
    arabicText:
      "الأَمْنُ وَالشَّفَافِيَّةُ فِي صُلْبِ المَنْظُومَةِ: النَّصُّ الخَامُ يَظَلُّ مَحْفُوظًا بِجَانِبِ النَّصِّ المُصَحَّحِ، وَالتَّحَقُّقُ الآلِيُّ يَرْصُدُ أَيَّ تَغْيِيرٍ فِي الأَرْقَامِ كَإِشْعَارٍ لِلْمُرَاجَعَةِ البَشَرِيَّةِ. عَزْلٌ تَامٌّ لِكَلَامِ المُتَّصِلِ يَمْنَعُ أَيَّ اخْتِرَاقٍ، وَمَأْمُورُ العَمَلِيَّاتِ هُوَ صَاحِبُ القَرَارِ دَائِمًا.",
    subtitles: [
      {
        text: "الأَمْنُ وَالشَّفَافِيَّةُ فِي صُلْبِ المَنْظُومَةِ: النَّصُّ الخَامُ يَظَلُّ مَحْفُوظًا، وَالتَّحَقُّقُ الآلِيُّ يَرْصُدُ أَيَّ تَغْيِيرٍ فِي الأَرْقَامِ.",
        relativeStartRatio: 0.03,
        relativeEndRatio: 0.48,
      },
      {
        text: "عَزْلٌ تَامٌّ لِكَلَامِ المُتَّصِلِ يَمْنَعُ أَيَّ اخْتِرَاقٍ، وَمَأْمُورُ العَمَلِيَّاتِ هُوَ صَاحِبُ القَرَارِ دَائِمًا.",
        relativeStartRatio: 0.52,
        relativeEndRatio: 0.97,
      },
    ],
  },
  {
    sceneId: 6,
    name: "closing",
    targetSeconds: 10,
    targetFrames: 300,
    arabicText:
      "جَاهِزُونَ لِلتَّشْغِيلِ التَّجْرِيبِيِّ فِي غُرْفَةِ عَمَلِيَّاتِ شُرْطَةِ النَّجْدَةِ، لِخِدْمَةِ أَمْنِ الوَطَنِ وَحِمَايَةِ الموَاطِنِ فِي كُلِّ لَحْظَةٍ.",
    subtitles: [
      {
        text: "جَاهِزُونَ لِلتَّشْغِيلِ التَّجْرِيبِيِّ فِي غُرْفَةِ عَمَلِيَّاتِ شُرْطَةِ النَّجْدَةِ، لِخِدْمَةِ أَمْنِ الوَطَنِ وَحِمَايَةِ الموَاطِنِ.",
        relativeStartRatio: 0.05,
        relativeEndRatio: 0.95,
      },
    ],
  },
];

// Helper to load environment variables from multiple potential locations
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const potentialPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(process.cwd(), "promo-video", ".env"),
  ];

  for (const envPath of potentialPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
            if (key && !env[key]) {
              env[key] = val;
            }
          }
        }
      } catch {
        // Silently continue
      }
    }
  }
  return env;
}

// Measure exact audio duration using ffprobe
function getAudioDuration(filePath: string): number {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const output = execSync(cmd, { encoding: "utf-8" }).trim();
    const duration = parseFloat(output);
    return isNaN(duration) ? 0 : duration;
  } catch (err) {
    console.error(`Error probing duration for ${filePath}:`, err);
    return 0;
  }
}

// Generate silent placeholder audio file using ffmpeg
function generateSilentAudio(durationSec: number, outputPath: string) {
  const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSec} -q:a 2 -acodec libmp3lame "${outputPath}"`;
  execSync(cmd, { stdio: "ignore" });
}

// Convert PCM buffer (24kHz 16-bit mono) to MP3 using ffmpeg
function pcmToMp3(pcmBuffer: Buffer, outputPath: string) {
  const tempPcmPath = outputPath.replace(/\.mp3$/, ".pcm");
  fs.writeFileSync(tempPcmPath, pcmBuffer);
  try {
    const cmd = `ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${tempPcmPath}" -c:a libmp3lame -q:a 2 "${outputPath}"`;
    execSync(cmd, { stdio: "ignore" });
  } finally {
    if (fs.existsSync(tempPcmPath)) {
      fs.unlinkSync(tempPcmPath);
    }
  }
}

// OpenRouter Speech Synthesis
async function synthesizeOpenRouter(
  text: string,
  apiKey: string,
  model: string = "google/gemini-3.8-flash-lite-tts",
  voice: string = "Charon"
): Promise<{ buffer: Buffer; format: "pcm" | "mp3" }> {
  const isGemini = model.toLowerCase().includes("gemini");
  const responseFormat = isGemini ? "pcm" : "mp3";

  const payload = {
    model,
    input: text,
    voice,
    response_format: responseFormat,
  };

  const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/callcenter-poc-egypt",
      "X-Title": "CallCenterPOC-EgyptianPolice122",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter TTS failed (${response.status}): ${errorText.slice(0, 150)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    format: responseFormat,
  };
}

// OpenAI Speech Synthesis
async function synthesizeOpenAI(
  text: string,
  apiKey: string,
  model: string = "tts-1",
  voice: string = "onyx"
): Promise<Buffer> {
  const payload = {
    model,
    input: text,
    voice,
    response_format: "mp3",
  };

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS failed (${response.status}): ${errorText.slice(0, 150)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ElevenLabs Speech Synthesis
async function synthesizeElevenLabs(
  text: string,
  apiKey: string,
  voiceId: string
): Promise<Buffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorText.slice(0, 150)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function main() {
  console.log("=================================================================");
  console.log("🎙️  Egyptian Police Hotline (122) - Voiceover Generation Pipeline");
  console.log("=================================================================\n");

  const env = loadEnv();
  const outputDir = path.resolve(process.cwd(), "public", "audio", "vo");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Determine TTS provider
  let provider = (env.TTS_PROVIDER || "").toLowerCase();
  const openRouterKey = env.OPENROUTER_API_KEY || "";
  const openAIKey = env.OPENAI_API_KEY || "";
  const elevenLabsKey = env.ELEVENLABS_API_KEY || "";
  const elevenLabsVoiceId = env.ELEVENLABS_VOICE_ID || "";

  if (!provider) {
    if (openRouterKey && openRouterKey.length > 10) {
      provider = "openrouter";
    } else if (openAIKey && openAIKey.length > 10) {
      provider = "openai";
    } else if (elevenLabsKey && elevenLabsVoiceId) {
      provider = "elevenlabs";
    } else {
      provider = "placeholder";
    }
  }

  console.log(`[Config] Selected TTS Provider: ${provider}`);

  if (provider === "placeholder") {
    console.warn(
      "\n⚠️  [NOTICE] No active TTS provider API key found in environment variables."
    );
    console.warn("   To enable real Arabic voiceover generation, configure one of:");
    console.warn("   - OPENROUTER_API_KEY (Recommended: voice 'Aoede', model 'google/gemini-3.8-flash-lite-tts')");
    console.warn("   - OPENAI_API_KEY (Voice: 'onyx' or 'alloy', model 'tts-1')");
    console.warn("   - ELEVENLABS_API_KEY & ELEVENLABS_VOICE_ID");
    console.warn("   Proceeding with high-precision silent placeholder audio tracks of exact scene durations.\n");
  }

  const results: Array<{
    sceneId: number;
    name: string;
    targetSeconds: number;
    measuredSeconds: number;
    diffSeconds: number;
    diffPercent: number;
    budgetExceeded: boolean;
    outputPath: string;
  }> = [];

  for (const scene of SCENE_VO_DEFINITIONS) {
    const filename = `scene${scene.sceneId}.mp3`;
    const outputPath = path.join(outputDir, filename);
    console.log(`\n▶ Processing Scene ${scene.sceneId}: ${scene.name} (Budget: ${scene.targetSeconds}s)...`);

    let synthesized = false;

    if (provider === "openrouter" && openRouterKey) {
      const model = env.OPENROUTER_TTS_MODEL || "google/gemini-3.8-flash-lite-tts";
      const voice = env.TTS_VOICE || "Charon";
      try {
        console.log(`  Synthesizing with OpenRouter (${model}, voice: ${voice})...`);
        const { buffer, format } = await synthesizeOpenRouter(scene.arabicText, openRouterKey, model, voice);
        if (format === "pcm") {
          pcmToMp3(buffer, outputPath);
        } else {
          fs.writeFileSync(outputPath, buffer);
        }
        synthesized = true;
        console.log(`  ✓ Successfully synthesized and saved to ${filename}`);
      } catch (err: any) {
        console.warn(`  ⚠️  OpenRouter synthesis failed: ${err.message}`);
        console.warn(`     Falling back to silent placeholder for Scene ${scene.sceneId}.`);
      }
    } else if (provider === "openai" && openAIKey) {
      const voice = env.TTS_VOICE || "onyx";
      try {
        console.log(`  Synthesizing with OpenAI (voice: ${voice})...`);
        const buffer = await synthesizeOpenAI(scene.arabicText, openAIKey, "tts-1", voice);
        fs.writeFileSync(outputPath, buffer);
        synthesized = true;
        console.log(`  ✓ Successfully synthesized and saved to ${filename}`);
      } catch (err: any) {
        console.warn(`  ⚠️  OpenAI synthesis failed: ${err.message}`);
        console.warn(`     Falling back to silent placeholder for Scene ${scene.sceneId}.`);
      }
    } else if (provider === "elevenlabs" && elevenLabsKey && elevenLabsVoiceId) {
      try {
        console.log(`  Synthesizing with ElevenLabs...`);
        const buffer = await synthesizeElevenLabs(scene.arabicText, elevenLabsKey, elevenLabsVoiceId);
        fs.writeFileSync(outputPath, buffer);
        synthesized = true;
        console.log(`  ✓ Successfully synthesized and saved to ${filename}`);
      } catch (err: any) {
        console.warn(`  ⚠️  ElevenLabs synthesis failed: ${err.message}`);
        console.warn(`     Falling back to silent placeholder for Scene ${scene.sceneId}.`);
      }
    }

    if (!synthesized) {
      // Fallback: generate silent audio matching exact target duration
      generateSilentAudio(scene.targetSeconds, outputPath);
      console.log(`  ✓ Generated silent placeholder track (${scene.targetSeconds}s) -> ${filename}`);
    }

    // Measure duration
    const measuredDuration = getAudioDuration(outputPath);
    const diff = measuredDuration - scene.targetSeconds;
    const diffPercent = (diff / scene.targetSeconds) * 100;
    const budgetExceeded = diffPercent > 10.0;

    results.push({
      sceneId: scene.sceneId,
      name: scene.name,
      targetSeconds: scene.targetSeconds,
      measuredSeconds: measuredDuration,
      diffSeconds: diff,
      diffPercent,
      budgetExceeded,
      outputPath,
    });
  }

  console.log("\n=================================================================");
  console.log("📊 AUDIO MEASUREMENTS & BUDGET VALIDATION SUMMARY");
  console.log("=================================================================");

  let anyBudgetExceeded = false;
  for (const res of results) {
    const statusSign = res.diffSeconds >= 0 ? "+" : "";
    const warning = res.budgetExceeded
      ? ` ⚠️  [EXCEEDS BUDGET BY >10%: ${res.diffPercent.toFixed(1)}%]`
      : " ✓ OK";
    if (res.budgetExceeded) anyBudgetExceeded = true;

    console.log(
      `Scene ${res.sceneId} (${res.name}): Target=${res.targetSeconds.toFixed(1)}s | Actual=${res.measuredSeconds.toFixed(2)}s | Diff=${statusSign}${res.diffSeconds.toFixed(2)}s (${statusSign}${res.diffPercent.toFixed(1)}%)${warning}`
    );
  }

  const totalActual = results.reduce((sum, r) => sum + r.measuredSeconds, 0);
  console.log(`\nTotal Promo Duration: ${totalActual.toFixed(2)}s / 100.0s target.`);

  if (anyBudgetExceeded) {
    console.warn("\n⚠️  WARNING: One or more scenes exceeded their target duration budget by more than 10%.");
    console.warn("   Review narration pacing or adjust scene duration frames in content.ts accordingly.");
  } else {
    console.log("\n✅ All scene voiceover tracks are within the acceptable timing tolerance (≤ 10%).");
  }

  // Generate audio metadata report
  const reportPath = path.resolve(process.cwd(), "public", "audio", "vo", "manifest.json");
  fs.writeFileSync(reportPath, JSON.stringify({ results, totalActual, timestamp: new Date().toISOString() }, null, 2));
  console.log(`Saved audio timing manifest to ${reportPath}\n`);
}

if (require.main === module || process.argv[1]?.includes("generate-voiceover")) {
  main().catch((err) => {
    console.error("FATAL ERROR in voiceover generation:", err);
    process.exit(1);
  });
}
