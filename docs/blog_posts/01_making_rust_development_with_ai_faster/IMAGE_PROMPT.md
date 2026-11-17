# Main image prompt

- Created: 17 November 2026
- Last updated: 17 November 2026
- Status: Image generation prompt
- Related framing: [Repository instructions](../../../AGENTS.md)
- Related rules: [Docs folder system](../../../.agents/skills/docs_folder_system/SKILL.md), [Folder constraints](../../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)
- Related issue: [Article planning](https://github.com/jeromeetienne/faster-rust-worktrees/issues/11)

The current main article image and social media card is [image-main-v6.png](image-main-v6.png), supplied by the user. Keep the agreed subtitle in the article rather than inside the image.

## V6 correction instructions

Keep the title, colours, and three-worktree comparison. Remove the repeated “6 min 36 s” and “10.5 GB” labels beneath individual worktrees. Show one total for each workflow:

- Ordinary: “Three worktrees total: 6 min 36 s · 10.5 GB”.
- Faster Rust Work Trees: “Three worktrees total: 16.3 s · 254 MB”.

Replace every “REUSE BUILD (Instant)” with “REUSE EXISTING BUILD”. Keep “24× faster · 97.6% less added allocation”. Add a readable footnote: “Estimated from late-sh release-build measurements on macOS · unchanged sources · main checkout already built”.

## Earlier prompt: measured performance cover

Use this prompt for image-main-v3.png. Lead with measured performance and allocated-space savings through typography, rather than illustrative diagrams or objects. Generated with the built-in image generation tool.

Create a premium, exceptionally well-designed typography-led technical article cover. Landscape 2:1. This should look like an expensive technology magazine cover or a beautifully art-directed performance announcement. NUMBERS FIRST. Mature, authoritative, impressive, highly legible. No explanatory illustration, no flowcharts, no diagrams, no toy objects, no glass cubes, no energy crystals, no robots, no folders, no cartoon imagery. The design itself is the visual.

Background: nearly black graphite with subtle finely brushed metallic texture, sophisticated dark gradients, restrained directional light and a very faint warm copper edge glow. Extremely precise Swiss-style editorial grid, generous negative space, strong alignment. Typography: beautiful contemporary grotesk sans-serif, exceptionally large display numerals. Warm platinum white typography with restrained copper-orange highlights. A subtle polished metallic finish on the enormous primary numeral, never compromising readability. A small electric cyan accent on the time after optimization. Avoid sci-fi neon, loud gradients, excessive glow, ornamental charts, and visual clutter.

Layout:
Small elegant masthead at upper left, exact title:
"Making Rust Development with AI Faster"
Below it, in understated small caps:
"FASTER RUST WORK TREES"

The central left two thirds are dominated by an enormous "24×", with "FASTER" directly below in strong spacious typography. This is the unmistakable focal point from across the room.
Underneath, clearly label what got faster:
"Worktree creation + first builds"
Then a beautifully typeset before-and-after line:
"22 minutes → 54 seconds"

The right third is a separate editorial statistics column, clearly secondary but still large and readable, divided by a hairline vertical rule. Large number:
"97.6%"
Below it:
"LESS ADDED DISK ALLOCATION"
Then:
"34.98 GB → 846 MB"

Bottom footnote, one clean crisp readable line:
"10 late-sh worktrees · release builds · macOS · unchanged sources · main checkout already built"

Technical accuracy: these are measurements of creating ten worktrees and completing their unchanged first builds, using existing output from an already-built main checkout. They are not a claim that all Rust coding becomes 24 times faster. Do not add claims about SSD lifetime or wear, since only time and allocated space were measured. Treat 24× as a rounded measured speed factor. Render the exact visible wording above without adding extra copy.

Make this compelling through outstanding typography, scale, contrast, luxurious materials and elegant spacing. It must be visually commanding and beautiful in a social-media feed. No watermark.

## Earlier prompt: cinematic cover

This prompt produced image-main-v2.png. Retained for reference.

Create an exceptionally polished premium editorial cover image for a technical article about accelerating Rust development with parallel AI coding agents. Wide landscape 2:1 composition. This is sophisticated visual art with beautifully integrated typography, NOT an infographic, NOT a flowchart, NOT a slide deck.

Art direction: cinematic macro 3D render, luxurious glossy glass and anodized dark metal, luminous copper-orange and electric cyan highlights, deep midnight navy background, atmospheric volumetric light, subtle depth of field, ray-traced reflections, delicate bloom and particles, precision surfaces, clean graphic composition. Contemporary high-end developer product campaign. Visually striking, radiant, elegant, and tactile.

Scene: across the lower middle, three distinct floating transparent glass workspace chambers, each with tiny luminous code-like lines suspended inside (abstract, not readable text). Behind and above the chambers a single beautiful incandescent copper-orange crystalline core representing an already compiled Rust build. Three graceful bright flowing light ribbons carry energy from the core into the independent chambers. Where the light streams branch, their paths remain visibly separate. Each chamber has its own luminous cyan rim and its own small independent base. The three chambers represent parallel coding agents' independent worktrees. Suggest reuse and speed through sophisticated light trails and shared luminous energy, not through labelled arrows or boxes. Add a subtle abstract gear-like sculptural silhouette around the warm core to evoke Rust without requiring a literal logo. No robots, terminal window icons, yellow folders, database stacks, icons, comparison columns, explanatory labels, clip art, or cartoon shapes.

Typography: reserve the upper left half as dark negative space for a beautiful large modern bold sans-serif title, exact wording across three nicely balanced lines:
"Making Rust Development"
"with AI"
"Faster"
Let "Faster" be an oversized luminous pale cyan focal word, refined rather than gimmicky. The typography and artwork must feel designed together. Avoid covering the 3D scene with type. Strong readable hierarchy and generous edge margins.

Small tasteful result line at bottom left, exact wording:
"22 minutes → 54 seconds"
Beneath, significantly smaller but still crisp:
"10 worktrees + first builds · late-sh · macOS · unchanged sources · main checkout already built"
Do not add any other words. No watermark. Opaque background.
Aim for a memorable, beautiful cover at thumbnail size, with craftsmanship resembling an expensive product launch, not a generic AI infographic.

## Earlier prompt: comparison diagram

Use case: infographic-diagram
Asset type: Main image for a dev.to technical article and social media sharing.
Create a polished wide landscape editorial illustration, approximately 2:1 aspect ratio, with a flat vector-like aesthetic, precise typography, generous margins, and a restrained dark navy, warm white, orange and teal palette. Crisp, professional, readable as a small social preview.

At the top, large exact headline: "Making Rust Development with AI Faster"

Below, a balanced side-by-side technical comparison.
LEFT heading: "Ordinary worktrees"
Three small coding-agent symbols, each connected to its own independent folder representing a Git worktree. Each folder has its own repeated orange stack of compiled dependencies. Convey repeated work, with the label "Compile the same dependencies again".
RIGHT heading: "Faster Rust Work Trees"
A small folder labelled "Built main checkout" above three independent worktree folders, each with a small coding-agent symbol. Connect the built main checkout to the worktree folders to show reuse of existing Cargo build output. A teal layer below the three folders represents shared unchanged disk blocks, with each folder clearly separate and independent. Label: "Independent build folders" and below it "Shared unchanged disk blocks".
Keep the diagram simple; do not imply agents share one mutable build folder. No stopwatch clutter, code screenshots, or cartoon robots. Agents may be simple terminal-window symbols. Equal number of agents on each side.

Bottom band with large exact text: "10 worktrees + first builds"
Then the strongest numeric emphasis: "22 minutes → 54 seconds"
Small but legible caption: "late-sh release builds · macOS · main checkout already built · unchanged sources"

Use only these requested text labels, spell every label accurately, and avoid tiny extraneous annotations. The article subtitle is deliberately omitted from the image to keep the graphic readable. No watermark. Opaque background.

