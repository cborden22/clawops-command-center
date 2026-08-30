# ClawOps Marketing Video

Two coded motion-graphics videos, rendered to MP4, with voiceover narration.

## Deliverables

1. **30-second landscape (1920x1080, 16:9)** — full pitch: hook, problem, product modules, proof, CTA.
2. **8-second vertical (1080x1920, 9:16)** — condensed hero/social cut using the same design system.

Both rendered at high resolution (1080p, 30fps, high-quality h264) and saved to the documents folder for download.

## Creative direction

- **Aesthetic:** "Tech Product" — dark, premium, confident. Matches the ClawOps app: deep near-black background (#0F0F10), gold primary accent, glass-card surfaces with soft depth.
- **Palette:** background #0F0F10, surface #17171A, gold #E0B44A, warm cream text #F5F1E8, muted #8A8A93.
- **Typography:** one geometric display face for headlines, one clean sans for body/labels (loaded via Google Fonts at module scope).
- **Motion system:** default entrance is blur-to-sharp with a short upward drift; accent moments use a spring with slight overshoot; scene cuts use wipe/slide transitions consistently. Persistent background layer (slow gradient drift + faint grid) runs the full duration so scenes feel like one continuous piece, never a slideshow.
- **Motifs:** gold hairline rules, rounded glass cards, animated number counters, a route-line that traces across scenes.

## 30-second scene flow

1. **Hook (0-4s)** — dark frame, gold line traces, headline snaps in: "Your claw machine business, finally organized."
2. **Problem (4-9s)** — scattered notes/spreadsheet fragments drift and collapse into a single ordered card stack.
3. **The system (9-19s)** — rapid staggered reveal of the core modules: Locations, Revenue, Inventory, Maintenance & QR, Mileage & Routes, Leads CRM, Reports, Team. Each as an animated glass card with icon and micro-motion.
4. **Proof moment (19-25s)** — an animated stat block (revenue counter ticking up, commission split, route completion) to make the value concrete.
5. **Close (25-30s)** — ClawOps wordmark resolve, "clawops.com", trial line: 7-day free trial.

## 8-second vertical cut

Hook headline → three stacked module cards → wordmark + clawops.com + trial line. Same palette, fonts, and motion system, re-laid out for a tall frame (not a crop of the landscape version).

## Voiceover

- Scripts written for each cut (roughly 65-75 words for the 30s, 18-22 words for the 8s), timed to the scene beats.
- Narration generated with Lovable AI text-to-speech, warm and confident tone, saved as audio files.
- Audio is muxed onto the silent rendered video with ffmpeg (the sandbox renderer encodes video silently, so narration is combined in a final pass).
- If a line runs long against a scene, the scene duration is adjusted so visuals and narration land together.

## Technical notes

- Built with Remotion (React + Tailwind) under a `remotion/` directory in the project, so the videos are version-controlled and re-renderable later.
- Two registered compositions (`main-30-landscape`, `main-08-vertical`) sharing scene components and a single theme file.
- All animation is frame-based (`useCurrentFrame`, `interpolate`, `spring`) — no CSS animation.
- Key frames spot-checked as stills before the full render; final MP4s verified with ffprobe for duration, resolution, and audio track.
- No changes to the ClawOps app itself; this only adds the video source files and produces the MP4 outputs.
