/* The trailer, cut: the picture and the sound in one file.

     node tools/trailer/cut.mjs            -> out/study-hubs-trailer.mp4 (1920 x 1080, 30 fps, H.264 + AAC) and
                                              out/study-hubs-trailer.vtt / .srt (the captions as files)

   After audio.py (the timeline and the sound) and compose.mjs (out/frames/, every frame of the picture, the footage
   already in it). The captions are burned into the picture (most phones play a video in a chat with the sound off);
   the .vtt has the same lines for a player that takes a captions file. */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "out");
const TL = JSON.parse(fs.readFileSync(path.join(out, "timeline.json"), "utf8"));
const FPS = TL.fps, frames = Math.ceil(TL.dur * FPS);
const have = fs.readdirSync(path.join(out, "frames")).filter((f) => /^f\d{5}\.jpg$/.test(f)).length;
if (have !== frames) throw new Error(`out/frames has ${have} frames, the timeline needs ${frames}: run compose.mjs again`);

const mp4 = path.join(out, "study-hubs-trailer.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(out, "frames", "f%05d.jpg"), "-i", path.join(out, "audio.wav"),
  "-map", "0:v", "-map", "1:a", "-frames:v", String(frames), "-vf", "scale=in_range=pc:out_range=tv,format=yuv420p",
  "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-profile:v", "high", "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
  "-metadata", "title=Study Hubs: the redesign", "-metadata", "artist=Timmy Tooth", mp4], { stdio: "inherit" });

/* the captions as files: the same lines, the same times */
const stamp = (t, sep) => { const ms = Math.round(t * 1000), p = (n, w = 2) => String(n).padStart(w, "0"); return p(Math.floor(ms / 3600000)) + ":" + p(Math.floor(ms / 60000) % 60) + ":" + p(Math.floor(ms / 1000) % 60) + sep + p(ms % 1000, 3); };
const end = (c, i) => Math.min(c.t1 + 0.4, TL.cues[i + 1] ? TL.cues[i + 1].t0 - 0.08 : c.t1 + 0.4);
fs.writeFileSync(mp4.replace(/mp4$/, "vtt"), "WEBVTT\n\n" + TL.cues.map((c, i) => `${stamp(c.t0 - 0.08, ".")} --> ${stamp(end(c, i), ".")}\n${c.shown}\n`).join("\n"));
fs.writeFileSync(mp4.replace(/mp4$/, "srt"), TL.cues.map((c, i) => `${i + 1}\n${stamp(c.t0 - 0.08, ",")} --> ${stamp(end(c, i), ",")}\n${c.shown}\n`).join("\n"));
const mb = fs.statSync(mp4).size / 1048576;
console.error(`${path.relative(process.cwd(), mp4)}: ${TL.dur.toFixed(1)} s, ${mb.toFixed(1)} MB`);
