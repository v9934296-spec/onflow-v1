# EXP-001 — Compression contract (physical iPhone)

Status: **OPEN**. This gate cannot close in this environment. Capture encoding uses candidate values in `src/domain/compression.ts` and must not be treated as measured.

## Protocol

1. Film 10 clips at 30s on the launch iPhone, outdoors, in sunlight.
2. Encode H.264 MP4, 1080p long edge, never upscale, preserve source fps up to 60, preserve audio, strip location.
3. Record file size for each candidate bitrate.
4. Confirm every clip is under 100MB.
5. Run each clip through the staging analysis pipeline and confirm the engine can still read it (`video_readable`).
6. If compression fails, offer the original only when it already meets duration and size ceilings.

## Candidate (unverified)

- Bitrate: 6 Mbps
- Expected 30s size: ~22.5 MB
- Fallback: recompress once at 4 Mbps, then reject with `clip_too_large`

Fill this table on device before calling Capture done:

| Clip | Seconds | Bytes | Readable | Notes |
| --- | --- | --- | --- | --- |
| 1–10 |  |  |  |  |
