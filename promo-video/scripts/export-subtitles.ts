import fs from "fs";
import path from "path";
import { content } from "../src/data/content";

/**
 * Format milliseconds into standard SubRip Subtitle (SRT) timecode: HH:MM:SS,mmm
 */
function formatSrtTimestamp(frame: number, fps: number = 30): string {
  const totalMs = Math.round((frame / fps) * 1000);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  const pad = (n: number, width: number = 2) => String(n).padStart(width, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(ms, 3)}`;
}

// English translations corresponding directly to the 12 Arabic subtitles
const ENGLISH_SUBTITLES: string[] = [
  "In the critical moments of emergency calls...",
  "Citizens speak under panic, dialect slurs, and road noise—contact numbers are lost and vital locations obscured.",
  "Emergency AI Copilot 122: Sovereign AI empowering emergency dispatchers—understanding Egyptian dialect and documenting precise incident details without error or delay.",
  "As soon as the citizen calls, the real-time speech recognition engine converts voice into live text.",
  "The intelligent language corrector steps in to rectify phonetic distortions without inventing facts.",
  "Even if dialect slurs the speech—such as 'mashghara'—the semantic matcher immediately identifies it as 'brawl / assault'.",
  "Should ambiguity remain, the system never hangs up; it politely seeks clarification until the report is fully established.",
  "Every call begins with four core anchors: caller name, phone number, detailed location, and incident type.",
  "A structured question tree then branches into 20 operational scenarios across five major categories.",
  "Security and transparency at the core: raw transcripts remain preserved, and automated validation flags altered numbers.",
  "Complete caller-text isolation prevents prompt injection, ensuring the human dispatcher retains absolute command.",
  "Ready for field pilot deployment within the Police Emergency Operations Room—serving national security and protecting citizens.",
];

export function generateSrtFiles() {
  const outDir = path.resolve(process.cwd(), "out");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Arabic SRT
  let arSrtContent = "";
  content.subtitles.forEach((sub, index) => {
    const srtIndex = index + 1;
    const startTime = formatSrtTimestamp(sub.startFrame, content.metadata.fps);
    const endTime = formatSrtTimestamp(sub.endFrame, content.metadata.fps);
    arSrtContent += `${srtIndex}\n${startTime} --> ${endTime}\n${sub.arabicText}\n\n`;
  });

  const arPath = path.join(outDir, "subtitles-ar.srt");
  fs.writeFileSync(arPath, arSrtContent.trim() + "\n", "utf-8");
  console.log(`✓ Exported Arabic SRT: ${arPath} (${content.subtitles.length} cues)`);

  // 2. English SRT
  let enSrtContent = "";
  content.subtitles.forEach((sub, index) => {
    const srtIndex = index + 1;
    const startTime = formatSrtTimestamp(sub.startFrame, content.metadata.fps);
    const endTime = formatSrtTimestamp(sub.endFrame, content.metadata.fps);
    const englishText = ENGLISH_SUBTITLES[index] || "";
    enSrtContent += `${srtIndex}\n${startTime} --> ${endTime}\n${englishText}\n\n`;
  });

  const enPath = path.join(outDir, "subtitles-en.srt");
  fs.writeFileSync(enPath, enSrtContent.trim() + "\n", "utf-8");
  console.log(`✓ Exported English SRT: ${enPath} (${ENGLISH_SUBTITLES.length} cues)`);
}

generateSrtFiles();
