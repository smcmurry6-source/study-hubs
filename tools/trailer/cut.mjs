/* The trailer, cut: the footage in its framed screen, the drawn layer over it, the sound under it.

     node tools/trailer/cut.mjs            -> out/study-hubs-trailer.mp4 (1920 x 1080, 30 fps, H.264 + AAC) and
                                              out/study-hubs-trailer.vtt / .srt (the captions as files)

   After audio.py (the timeline and the sound), compose.mjs (out/overlay/) and record.mjs (out/footage/). Each feature
   shot's clip plays from the frame its shot starts on to the frame the next one starts on (a clip that runs short
   holds its last frame); the studio shots have no clip, the drawing covers the frame there. The captions are burned
   into the picture (most phones play a video in a chat with the sound off); the .vtt has the same lines for a player
   that takes a captions file. */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCREEN } from "./compose.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "out");
const TL = JSON.parse(fs.readFileSync(path.join(out, "timeline.json"), "utf8"));
const FPS = TL.fps, frames = Math.ceil(TL.dur * FPS);
const have = fs.readdirSync(path.join(out, "overlay")).filter((f) => /^f\d{5}\.png$/.test(f)).length;
if (have !== frames) throw new Error(`out/overlay has ${have} frames, the timeline needs ${frames}: run compose.mjs again`);

/* the picture under the drawn layer: black where the studio fills the frame, a clip in the screen otherwise */
const inputs = [], parts = [], labels = [];
TL.shots.forEach((s, i) => {
  const f0 = Math.round(s.t0 * FPS), f1 = i + 1 < TL.shots.length ? Math.round(TL.shots[i + 1].t0 * FPS) : frames, n = f1 - f0, clip = path.join(out, "footage", s.id + ".mp4");
  if (fs.existsSync(clip)) {
    inputs.push("-i", clip);
    parts.push(`[${inputs.length / 2 - 1}:v]fps=${FPS},tpad=stop_mode=clone:stop_duration=3,trim=end_frame=${n},setpts=PTS-STARTPTS,scale=${SCREEN.w}:${SCREEN.h}:flags=lanczos,pad=1920:1080:${SCREEN.x}:${SCREEN.y}:black,setsar=1[v${i}]`);
  } else parts.push(`color=c=black:s=1920x1080:r=${FPS},trim=end_frame=${n},setpts=PTS-STARTPTS,setsar=1[v${i}]`);
  labels.push(`[v${i}]`);
});
const ov = inputs.length / 2, au = ov + 1;
const graph = parts.join(";") + `;${labels.join("")}concat=n=${labels.length}:v=1:a=0[base];[base][${ov}:v]overlay=0:0:format=auto,format=yuv420p[v]`;
const mp4 = path.join(out, "study-hubs-trailer.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-framerate", String(FPS), "-i", path.join(out, "overlay", "f%05d.png"), "-i", path.join(out, "audio.wav"),
  "-filter_complex", graph, "-map", "[v]", "-map", `${au}:a`, "-frames:v", String(frames),
  "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart",
  "-metadata", "title=Study Hubs: the redesign", "-metadata", "artist=Timmy Tooth", mp4], { stdio: "inherit" });

/* the captions as files: the same lines, the same times */
const stamp = (t, sep) => { const ms = Math.round(t * 1000), p = (n, w = 2) => String(n).padStart(w, "0"); return p(Math.floor(ms / 3600000)) + ":" + p(Math.floor(ms / 60000) % 60) + ":" + p(Math.floor(ms / 1000) % 60) + sep + p(ms % 1000, 3); };
const end = (c, i) => Math.min(c.t1 + 0.45, TL.cues[i + 1] ? TL.cues[i + 1].t0 - 0.08 : c.t1 + 0.45);
fs.writeFileSync(mp4.replace(/mp4$/, "vtt"), "WEBVTT\n\n" + TL.cues.map((c, i) => `${stamp(c.t0 - 0.08, ".")} --> ${stamp(end(c, i), ".")}\n${c.shown}\n`).join("\n"));
fs.writeFileSync(mp4.replace(/mp4$/, "srt"), TL.cues.map((c, i) => `${i + 1}\n${stamp(c.t0 - 0.08, ",")} --> ${stamp(end(c, i), ",")}\n${c.shown}\n`).join("\n"));
const mb = fs.statSync(mp4).size / 1048576;
console.error(`${path.relative(process.cwd(), mp4)}: ${TL.dur.toFixed(1)} s, ${mb.toFixed(1)} MB`);
