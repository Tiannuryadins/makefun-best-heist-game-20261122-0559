[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Tiannuryadins/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Tiannuryadins/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# Midnight Vault — Pencuri Brankas

A complete, original top-down heist game that runs offline in a desktop
browser from static files. You are a thief breaking into Bank Merdeka at
midnight — grab every gold bag, crack the vault, then escape to the getaway
van before the alarm meter fills.

[Play the bounty on make.fun](https://make.fun/bounty/best-heist-game-20261122-0559)

## How to play

- **Move** with **WASD / arrow keys**, or **click** anywhere to walk there.
- Guards patrol with a **yellow vision cone** and wall-mounted **cameras**
  sweep a **red cone**. If either sees you, the **ALARM meter** fills —
  when it is full, you are caught.
- Hide in dark **shadow zones** (detection fills half as fast). Walls block
  both movement and sight.
- **Q — smoke bomb** (×2 per level, −50 score): blinds nearby guards and
  cameras for 3 seconds. **E — EMP** (×2 per level, −50 score): disables
  all cameras for 6 seconds.
- Collect all glowing **loot bags** (+150 each), then stand by the steel
  **vault** to crack it (+500, 1.5 s). Only then does the green **getaway
  van** open — reach it before the timer runs out.
- **M** toggles sound, **Esc** pauses, **Enter** confirms menus.

## Levels

1. **Lobi Bank Merdeka** — 2 guards, 1 camera, 3 loot, 2:30
2. **Koridor Brankas** — 3 guards, 2 cameras, 4 loot, 3:00
3. **Ruang Brankas Utama** — 4 guards, 3 cameras, 5 loot, 3:30

Finishing a level scores a time bonus (5 points/second left) plus a 300-point
ghost bonus if you were never spotted; finishing all three shows the
campaign score.

## Scoring

- Loot bag: +150 · Vault: +500 · Time bonus: +5 per second left · Ghost bonus: +300
- Tool use: −50 each · Stars per level: 3 if more than half the time remains, 2 if more than a quarter, otherwise 1.

All art is drawn procedurally on canvas at run time — no image files, no
network. All sounds are synthesized with WebAudio — no audio files.

## Run it

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

or serve `game/` with any static server and open `index.html`. No build step.
