import { generateParagraphAudioWithRouter } from "./src/lib/meditation/tts-router.js";

console.log("🧪 Testing generateParagraphAudioWithRouter...");
try {
  const result = await generateParagraphAudioWithRouter("Hello test", {
    voice_id: "g6xIsTj2HwM6VR4iXFCw",
    voice_gender: "female"
  });
  console.log("✅ Router function succeeded");
} catch (error) {
  console.log("❌ Router function failed:", error.message);
}
