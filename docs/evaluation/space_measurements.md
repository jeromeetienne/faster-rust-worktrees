# One- and ten-worktree space measurements

- Created: 16 November 2026
- Last updated: 17 November 2026
- Status: Repeated isolated APFS allocation measurements
- Related framing: [Repository instructions](../../AGENTS.md)
- Related rules: [Folder constraints](../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)
- Related issue: [Issue 3](https://github.com/jeromeetienne/faster-rust-worktrees/issues/3)

## Measured disk space: one and ten worktrees

These are actual allocated-space measurements after building every worktree, not ten times a one-worktree estimate. Each scenario was repeated three times on both projects.

The table shows **additional allocated space for the worktrees**, excluding the already-built main checkout. Values are medians in mebibytes (MiB; 1 MiB = 1,048,576 bytes).

| Project | Worktrees | Ordinary additional MiB | Optimized additional MiB | Reduction |
|---|---:|---:|---:|---:|
| ripgrep | 1 | 280.51 | 4.75 | 98.3% |
| ripgrep | 10 | 2806.09 | 47.81 | 98.3% |
| fd | 1 | 153.70 | 1.21 | 99.2% |
| fd | 10 | 1538.44 | 12.20 | 99.2% |

Including the built main checkout and the worktrees, while excluding the empty file system's fixed overhead:

| Project | Worktrees | Ordinary total MiB | Optimized total MiB |
|---|---:|---:|---:|
| ripgrep | 1 | 567.32 | 290.65 |
| ripgrep | 10 | 3092.07 | 333.62 |
| fd | 1 | 310.75 | 158.17 |
| fd | 10 | 1695.49 | 169.16 |

### How the space was measured

1. Created a disposable 12 GiB sparse disk image formatted with Apple File System (APFS) and mounted the image without opening Finder. This isolates allocation counters from unrelated writes on the Mac's main volume. Verified that the real clone operation and actual Cargo builds work on this file system.
2. Cloned each upstream project at the source revision linked below. Added a local configuration-only commit that tracks tool configuration and ignores the nested worktree folder. Built the main checkout first with `cargo build --locked --offline`. The shared Cargo download cache was already populated and remains outside the measurement volume.
3. Measured the empty-volume baseline, then the built-main-checkout baseline for each scenario. Created a worktree with the same shared tool used in the time evaluation. Ordinary creation passes `--without-optimization`; optimized creation must report successful copy-on-write cloning.
4. Ran `cargo build --locked --offline` in every worktree. Recorded allocated space after the first worktree and after ten simultaneously retained worktrees. All optimized builds compiled zero crates; ordinary builds compiled 34 crates per ripgrep worktree and 59 per fd worktree.
5. At every checkpoint, ran `sync`, then read `diskutil info -plist` three times with 0.2 seconds between readings. Allocated bytes = `APFSContainerSize - APFSContainerFree`. Used the median reading. Additional bytes = scenario allocation minus its immediately preceding built-main baseline. Total project bytes = scenario allocation minus the empty-volume baseline.
6. Removed only the disposable worktrees between scenarios and measured after removal too. Repeated each comparison three times, alternating scenario order in the middle repetition. Removed disposable projects and detached/deleted the owned disk image afterward.

Unlike summing file sizes or `du` output for cloned folders, these container counters count shared extents once and include file-system metadata. The measurement is **allocated capacity inside the isolated APFS image**, not the host sparse-image file's retained allocation or a hardware-sector measurement. The backing sparse file can retain blocks after internal deletion; that backing-file size is deliberately not presented as live project usage. The same copy-on-write behavior was exercised by actual cloning and Cargo builds; timings measured on the main volume are separate from these image-based space measurements.

### Uncertainty and scope

The largest spread across the three reads at one checkpoint was 139,264 bytes (0.133 MiB). The built-main baseline for ripgrep ranged from 285.80 to 287.49 MiB across scenarios. The built-main baseline for fd ranged from 156.74 to 157.23 MiB across scenarios. That variation includes allocation settling and accumulated Git/file-system metadata; the read spread alone is not a full error bound. The raw per-run ranges are retained below. Results describe unchanged debug builds on macOS 26.2 arm64 with rustc 1.96.1 and Node.js 24.14.0. Source edits, other profiles, generated files, future Cargo versions, and other file systems can change the savings. Cargo registry/download caches and the shared tool installation are excluded from both scenarios. This does not claim an independently proven physical-space result on Linux.

At measurement time, the shared tool was the uncommitted review implementation. These measurements do not claim a published tool release or verified GitHub installation.

### Source revisions

- [ripgrep upstream source](https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c), with the same local configuration-only commit for both scenarios.
- [fd upstream source](https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3), with the same local configuration-only commit for both scenarios.

### Allocation-counter calibration

After the project comparisons and before detaching the volume, wrote a 32 MiB file of random bytes, cloned that file using the real macOS `clonefile` operation, then wrote an ordinary independent copy using read/write calls. Measured the same allocated-space counter after each operation. This checks the measurement method itself on the tested file system:

```json
{
  "fileBytes": 33554432,
  "sourceAddedBytes": 33554432,
  "copyOnWriteCloneAddedBytes": 0,
  "independentStreamCopyAddedBytes": 33554432,
  "rawAllocatedByteReadings": {
    "before": [
      35266560,
      35266560,
      35266560
    ],
    "source": [
      68820992,
      68820992,
      68820992
    ],
    "clone": [
      68820992,
      68820992,
      68820992
    ],
    "ordinary-copy": [
      102375424,
      102375424,
      102375424
    ]
  }
}
```

### Earlier time measurements, for comparison

Measured separately on the Mac's main file system, with the original checkout built first and three runs per case:

| Project | Ordinary first-build median | Optimized first-build median | Ordinary compiled crates | Optimized compiled crates |
|---|---:|---:|---:|---:|
| ripgrep | 6.640 s | 0.072 s | 34 | 0 |
| fd | 5.880 s | 0.091 s | 59 | 0 |

### Raw allocation results

Every value below is in bytes. `emptyUsedBytes`, `baselineUsedBytes`, and `scenarioUsedBytes` are the actual APFS container allocations before subtraction. `worktrees: 10` means ten existing built worktrees were measured together.

<details>
<summary>All three repetitions and raw byte counts</summary>

```json
[
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 1,
    "mode": "ordinary",
    "worktrees": 1,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 336715776,
    "scenarioUsedBytes": 630849536,
    "additionalBytes": 294133760,
    "totalProjectBytes": 595587072,
    "mainCheckoutBytes": 301453312,
    "compiledCratesPerWorktree": [
      34
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 1,
    "mode": "ordinary",
    "worktrees": 10,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 336715776,
    "scenarioUsedBytes": 3272638464,
    "additionalBytes": 2935922688,
    "totalProjectBytes": 3237376000,
    "mainCheckoutBytes": 301453312,
    "compiledCratesPerWorktree": [
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34
    ],
    "sampleSpreadBytes": 139264
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 1,
    "mode": "optimized",
    "worktrees": 1,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 334946304,
    "scenarioUsedBytes": 339931136,
    "additionalBytes": 4984832,
    "totalProjectBytes": 304668672,
    "mainCheckoutBytes": 299683840,
    "compiledCratesPerWorktree": [
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 1,
    "mode": "optimized",
    "worktrees": 10,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 334946304,
    "scenarioUsedBytes": 385077248,
    "additionalBytes": 50130944,
    "totalProjectBytes": 349814784,
    "mainCheckoutBytes": 299683840,
    "compiledCratesPerWorktree": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 2,
    "mode": "optimized",
    "worktrees": 1,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 335044608,
    "scenarioUsedBytes": 340029440,
    "additionalBytes": 4984832,
    "totalProjectBytes": 304766976,
    "mainCheckoutBytes": 299782144,
    "compiledCratesPerWorktree": [
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 2,
    "mode": "optimized",
    "worktrees": 10,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 335044608,
    "scenarioUsedBytes": 385089536,
    "additionalBytes": 50044928,
    "totalProjectBytes": 349827072,
    "mainCheckoutBytes": 299782144,
    "compiledCratesPerWorktree": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 2,
    "mode": "ordinary",
    "worktrees": 1,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 335134720,
    "scenarioUsedBytes": 629030912,
    "additionalBytes": 293896192,
    "totalProjectBytes": 593768448,
    "mainCheckoutBytes": 299872256,
    "compiledCratesPerWorktree": [
      34
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 2,
    "mode": "ordinary",
    "worktrees": 10,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 335134720,
    "scenarioUsedBytes": 3277529088,
    "additionalBytes": 2942394368,
    "totalProjectBytes": 3242266624,
    "mainCheckoutBytes": 299872256,
    "compiledCratesPerWorktree": [
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 3,
    "mode": "ordinary",
    "worktrees": 1,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 335220736,
    "scenarioUsedBytes": 630140928,
    "additionalBytes": 294920192,
    "totalProjectBytes": 594878464,
    "mainCheckoutBytes": 299958272,
    "compiledCratesPerWorktree": [
      34
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 3,
    "mode": "ordinary",
    "worktrees": 10,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 335220736,
    "scenarioUsedBytes": 3278553088,
    "additionalBytes": 2943332352,
    "totalProjectBytes": 3243290624,
    "mainCheckoutBytes": 299958272,
    "compiledCratesPerWorktree": [
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34,
      34
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 3,
    "mode": "optimized",
    "worktrees": 1,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 335319040,
    "scenarioUsedBytes": 340365312,
    "additionalBytes": 5046272,
    "totalProjectBytes": 305102848,
    "mainCheckoutBytes": 300056576,
    "compiledCratesPerWorktree": [
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "ripgrep",
    "upstreamRevision": "https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c",
    "repeat": 3,
    "mode": "optimized",
    "worktrees": 10,
    "emptyUsedBytes": 35262464,
    "baselineUsedBytes": 335319040,
    "scenarioUsedBytes": 385470464,
    "additionalBytes": 50151424,
    "totalProjectBytes": 350208000,
    "mainCheckoutBytes": 300056576,
    "compiledCratesPerWorktree": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 1,
    "mode": "ordinary",
    "worktrees": 1,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 199622656,
    "scenarioUsedBytes": 360812544,
    "additionalBytes": 161189888,
    "totalProjectBytes": 325545984,
    "mainCheckoutBytes": 164356096,
    "compiledCratesPerWorktree": [
      59
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 1,
    "mode": "ordinary",
    "worktrees": 10,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 199622656,
    "scenarioUsedBytes": 1813856256,
    "additionalBytes": 1614233600,
    "totalProjectBytes": 1778589696,
    "mainCheckoutBytes": 164356096,
    "compiledCratesPerWorktree": [
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 1,
    "mode": "optimized",
    "worktrees": 1,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 199745536,
    "scenarioUsedBytes": 201015296,
    "additionalBytes": 1269760,
    "totalProjectBytes": 165748736,
    "mainCheckoutBytes": 164478976,
    "compiledCratesPerWorktree": [
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 1,
    "mode": "optimized",
    "worktrees": 10,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 199745536,
    "scenarioUsedBytes": 212545536,
    "additionalBytes": 12800000,
    "totalProjectBytes": 177278976,
    "mainCheckoutBytes": 164478976,
    "compiledCratesPerWorktree": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 2,
    "mode": "optimized",
    "worktrees": 1,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 199847936,
    "scenarioUsedBytes": 201121792,
    "additionalBytes": 1273856,
    "totalProjectBytes": 165855232,
    "mainCheckoutBytes": 164581376,
    "compiledCratesPerWorktree": [
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 2,
    "mode": "optimized",
    "worktrees": 10,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 199847936,
    "scenarioUsedBytes": 212639744,
    "additionalBytes": 12791808,
    "totalProjectBytes": 177373184,
    "mainCheckoutBytes": 164581376,
    "compiledCratesPerWorktree": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 2,
    "mode": "ordinary",
    "worktrees": 1,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 199942144,
    "scenarioUsedBytes": 361107456,
    "additionalBytes": 161165312,
    "totalProjectBytes": 325840896,
    "mainCheckoutBytes": 164675584,
    "compiledCratesPerWorktree": [
      59
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 2,
    "mode": "ordinary",
    "worktrees": 10,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 199942144,
    "scenarioUsedBytes": 1813114880,
    "additionalBytes": 1613172736,
    "totalProjectBytes": 1777848320,
    "mainCheckoutBytes": 164675584,
    "compiledCratesPerWorktree": [
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59
    ],
    "sampleSpreadBytes": 135168
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 3,
    "mode": "ordinary",
    "worktrees": 1,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 200032256,
    "scenarioUsedBytes": 361197568,
    "additionalBytes": 161165312,
    "totalProjectBytes": 325931008,
    "mainCheckoutBytes": 164765696,
    "compiledCratesPerWorktree": [
      59
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 3,
    "mode": "ordinary",
    "worktrees": 10,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 200032256,
    "scenarioUsedBytes": 1812590592,
    "additionalBytes": 1612558336,
    "totalProjectBytes": 1777324032,
    "mainCheckoutBytes": 164765696,
    "compiledCratesPerWorktree": [
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59,
      59
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 3,
    "mode": "optimized",
    "worktrees": 1,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 200130560,
    "scenarioUsedBytes": 201396224,
    "additionalBytes": 1265664,
    "totalProjectBytes": 166129664,
    "mainCheckoutBytes": 164864000,
    "compiledCratesPerWorktree": [
      0
    ],
    "sampleSpreadBytes": 0
  },
  {
    "project": "fd",
    "upstreamRevision": "https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3",
    "repeat": 3,
    "mode": "optimized",
    "worktrees": 10,
    "emptyUsedBytes": 35266560,
    "baselineUsedBytes": 200130560,
    "scenarioUsedBytes": 212893696,
    "additionalBytes": 12763136,
    "totalProjectBytes": 177627136,
    "mainCheckoutBytes": 164864000,
    "compiledCratesPerWorktree": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "sampleSpreadBytes": 0
  }
]
```

</details>

<details>
<summary>Allocation readings and after-removal controls</summary>

```json
[
  {
    "label": "ripgrep-empty",
    "usedBytes": 35262464,
    "minUsedBytes": 35262464,
    "maxUsedBytes": 35262464,
    "samples": [
      35262464,
      35262464,
      35262464
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-1-baseline",
    "usedBytes": 336715776,
    "minUsedBytes": 336715776,
    "maxUsedBytes": 336715776,
    "samples": [
      336715776,
      336715776,
      336715776
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-1-1-built",
    "usedBytes": 630849536,
    "minUsedBytes": 630849536,
    "maxUsedBytes": 630849536,
    "samples": [
      630849536,
      630849536,
      630849536
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-1-10-built",
    "usedBytes": 3272638464,
    "minUsedBytes": 3272511488,
    "maxUsedBytes": 3272650752,
    "samples": [
      3272511488,
      3272638464,
      3272650752
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-1-after-removal",
    "usedBytes": 334946304,
    "minUsedBytes": 334946304,
    "maxUsedBytes": 334946304,
    "samples": [
      334946304,
      334946304,
      334946304
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-1-baseline",
    "usedBytes": 334946304,
    "minUsedBytes": 334946304,
    "maxUsedBytes": 334946304,
    "samples": [
      334946304,
      334946304,
      334946304
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-1-1-built",
    "usedBytes": 339931136,
    "minUsedBytes": 339931136,
    "maxUsedBytes": 339931136,
    "samples": [
      339931136,
      339931136,
      339931136
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-1-10-built",
    "usedBytes": 385077248,
    "minUsedBytes": 385077248,
    "maxUsedBytes": 385077248,
    "samples": [
      385077248,
      385077248,
      385077248
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-1-after-removal",
    "usedBytes": 335060992,
    "minUsedBytes": 335060992,
    "maxUsedBytes": 335060992,
    "samples": [
      335060992,
      335060992,
      335060992
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-2-baseline",
    "usedBytes": 335044608,
    "minUsedBytes": 335044608,
    "maxUsedBytes": 335044608,
    "samples": [
      335044608,
      335044608,
      335044608
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-2-1-built",
    "usedBytes": 340029440,
    "minUsedBytes": 340029440,
    "maxUsedBytes": 340029440,
    "samples": [
      340029440,
      340029440,
      340029440
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-2-10-built",
    "usedBytes": 385089536,
    "minUsedBytes": 385089536,
    "maxUsedBytes": 385089536,
    "samples": [
      385089536,
      385089536,
      385089536
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-2-after-removal",
    "usedBytes": 335151104,
    "minUsedBytes": 335151104,
    "maxUsedBytes": 335151104,
    "samples": [
      335151104,
      335151104,
      335151104
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-2-baseline",
    "usedBytes": 335134720,
    "minUsedBytes": 335134720,
    "maxUsedBytes": 335134720,
    "samples": [
      335134720,
      335134720,
      335134720
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-2-1-built",
    "usedBytes": 629030912,
    "minUsedBytes": 629030912,
    "maxUsedBytes": 629030912,
    "samples": [
      629030912,
      629030912,
      629030912
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-2-10-built",
    "usedBytes": 3277529088,
    "minUsedBytes": 3277529088,
    "maxUsedBytes": 3277529088,
    "samples": [
      3277529088,
      3277529088,
      3277529088
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-2-after-removal",
    "usedBytes": 335220736,
    "minUsedBytes": 335220736,
    "maxUsedBytes": 335220736,
    "samples": [
      335220736,
      335220736,
      335220736
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-3-baseline",
    "usedBytes": 335220736,
    "minUsedBytes": 335220736,
    "maxUsedBytes": 335220736,
    "samples": [
      335220736,
      335220736,
      335220736
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-3-1-built",
    "usedBytes": 630140928,
    "minUsedBytes": 630140928,
    "maxUsedBytes": 630140928,
    "samples": [
      630140928,
      630140928,
      630140928
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-3-10-built",
    "usedBytes": 3278553088,
    "minUsedBytes": 3278553088,
    "maxUsedBytes": 3278553088,
    "samples": [
      3278553088,
      3278553088,
      3278553088
    ]
  },
  {
    "label": "ripgrep-ordinary-repeat-3-after-removal",
    "usedBytes": 335319040,
    "minUsedBytes": 335319040,
    "maxUsedBytes": 335319040,
    "samples": [
      335319040,
      335319040,
      335319040
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-3-baseline",
    "usedBytes": 335319040,
    "minUsedBytes": 335319040,
    "maxUsedBytes": 335319040,
    "samples": [
      335319040,
      335319040,
      335319040
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-3-1-built",
    "usedBytes": 340365312,
    "minUsedBytes": 340365312,
    "maxUsedBytes": 340365312,
    "samples": [
      340365312,
      340365312,
      340365312
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-3-10-built",
    "usedBytes": 385470464,
    "minUsedBytes": 385470464,
    "maxUsedBytes": 385470464,
    "samples": [
      385470464,
      385470464,
      385470464
    ]
  },
  {
    "label": "ripgrep-optimized-repeat-3-after-removal",
    "usedBytes": 335409152,
    "minUsedBytes": 335409152,
    "maxUsedBytes": 335409152,
    "samples": [
      335409152,
      335409152,
      335409152
    ]
  },
  {
    "label": "ripgrep-after-project-removal",
    "usedBytes": 35266560,
    "minUsedBytes": 35266560,
    "maxUsedBytes": 35266560,
    "samples": [
      35266560,
      35266560,
      35266560
    ]
  },
  {
    "label": "fd-empty",
    "usedBytes": 35266560,
    "minUsedBytes": 35266560,
    "maxUsedBytes": 35266560,
    "samples": [
      35266560,
      35266560,
      35266560
    ]
  },
  {
    "label": "fd-ordinary-repeat-1-baseline",
    "usedBytes": 199622656,
    "minUsedBytes": 199622656,
    "maxUsedBytes": 199622656,
    "samples": [
      199622656,
      199622656,
      199622656
    ]
  },
  {
    "label": "fd-ordinary-repeat-1-1-built",
    "usedBytes": 360812544,
    "minUsedBytes": 360812544,
    "maxUsedBytes": 360812544,
    "samples": [
      360812544,
      360812544,
      360812544
    ]
  },
  {
    "label": "fd-ordinary-repeat-1-10-built",
    "usedBytes": 1813856256,
    "minUsedBytes": 1813856256,
    "maxUsedBytes": 1813856256,
    "samples": [
      1813856256,
      1813856256,
      1813856256
    ]
  },
  {
    "label": "fd-ordinary-repeat-1-after-removal",
    "usedBytes": 199745536,
    "minUsedBytes": 199745536,
    "maxUsedBytes": 199745536,
    "samples": [
      199745536,
      199745536,
      199745536
    ]
  },
  {
    "label": "fd-optimized-repeat-1-baseline",
    "usedBytes": 199745536,
    "minUsedBytes": 199745536,
    "maxUsedBytes": 199745536,
    "samples": [
      199745536,
      199745536,
      199745536
    ]
  },
  {
    "label": "fd-optimized-repeat-1-1-built",
    "usedBytes": 201015296,
    "minUsedBytes": 201015296,
    "maxUsedBytes": 201015296,
    "samples": [
      201015296,
      201015296,
      201015296
    ]
  },
  {
    "label": "fd-optimized-repeat-1-10-built",
    "usedBytes": 212545536,
    "minUsedBytes": 212545536,
    "maxUsedBytes": 212545536,
    "samples": [
      212545536,
      212545536,
      212545536
    ]
  },
  {
    "label": "fd-optimized-repeat-1-after-removal",
    "usedBytes": 199847936,
    "minUsedBytes": 199847936,
    "maxUsedBytes": 199847936,
    "samples": [
      199847936,
      199847936,
      199847936
    ]
  },
  {
    "label": "fd-optimized-repeat-2-baseline",
    "usedBytes": 199847936,
    "minUsedBytes": 199847936,
    "maxUsedBytes": 199847936,
    "samples": [
      199847936,
      199847936,
      199847936
    ]
  },
  {
    "label": "fd-optimized-repeat-2-1-built",
    "usedBytes": 201121792,
    "minUsedBytes": 201121792,
    "maxUsedBytes": 201121792,
    "samples": [
      201121792,
      201121792,
      201121792
    ]
  },
  {
    "label": "fd-optimized-repeat-2-10-built",
    "usedBytes": 212639744,
    "minUsedBytes": 212639744,
    "maxUsedBytes": 212639744,
    "samples": [
      212639744,
      212639744,
      212639744
    ]
  },
  {
    "label": "fd-optimized-repeat-2-after-removal",
    "usedBytes": 199942144,
    "minUsedBytes": 199942144,
    "maxUsedBytes": 199942144,
    "samples": [
      199942144,
      199942144,
      199942144
    ]
  },
  {
    "label": "fd-ordinary-repeat-2-baseline",
    "usedBytes": 199942144,
    "minUsedBytes": 199942144,
    "maxUsedBytes": 199942144,
    "samples": [
      199942144,
      199942144,
      199942144
    ]
  },
  {
    "label": "fd-ordinary-repeat-2-1-built",
    "usedBytes": 361107456,
    "minUsedBytes": 361107456,
    "maxUsedBytes": 361107456,
    "samples": [
      361107456,
      361107456,
      361107456
    ]
  },
  {
    "label": "fd-ordinary-repeat-2-10-built",
    "usedBytes": 1813114880,
    "minUsedBytes": 1813041152,
    "maxUsedBytes": 1813176320,
    "samples": [
      1813041152,
      1813114880,
      1813176320
    ]
  },
  {
    "label": "fd-ordinary-repeat-2-after-removal",
    "usedBytes": 200032256,
    "minUsedBytes": 200032256,
    "maxUsedBytes": 200032256,
    "samples": [
      200032256,
      200032256,
      200032256
    ]
  },
  {
    "label": "fd-ordinary-repeat-3-baseline",
    "usedBytes": 200032256,
    "minUsedBytes": 200032256,
    "maxUsedBytes": 200032256,
    "samples": [
      200032256,
      200032256,
      200032256
    ]
  },
  {
    "label": "fd-ordinary-repeat-3-1-built",
    "usedBytes": 361197568,
    "minUsedBytes": 361197568,
    "maxUsedBytes": 361197568,
    "samples": [
      361197568,
      361197568,
      361197568
    ]
  },
  {
    "label": "fd-ordinary-repeat-3-10-built",
    "usedBytes": 1812590592,
    "minUsedBytes": 1812590592,
    "maxUsedBytes": 1812590592,
    "samples": [
      1812590592,
      1812590592,
      1812590592
    ]
  },
  {
    "label": "fd-ordinary-repeat-3-after-removal",
    "usedBytes": 200146944,
    "minUsedBytes": 200146944,
    "maxUsedBytes": 200146944,
    "samples": [
      200146944,
      200146944,
      200146944
    ]
  },
  {
    "label": "fd-optimized-repeat-3-baseline",
    "usedBytes": 200130560,
    "minUsedBytes": 200130560,
    "maxUsedBytes": 200130560,
    "samples": [
      200130560,
      200130560,
      200130560
    ]
  },
  {
    "label": "fd-optimized-repeat-3-1-built",
    "usedBytes": 201396224,
    "minUsedBytes": 201396224,
    "maxUsedBytes": 201396224,
    "samples": [
      201396224,
      201396224,
      201396224
    ]
  },
  {
    "label": "fd-optimized-repeat-3-10-built",
    "usedBytes": 212893696,
    "minUsedBytes": 212893696,
    "maxUsedBytes": 212893696,
    "samples": [
      212893696,
      212893696,
      212893696
    ]
  },
  {
    "label": "fd-optimized-repeat-3-after-removal",
    "usedBytes": 200224768,
    "minUsedBytes": 200224768,
    "maxUsedBytes": 200224768,
    "samples": [
      200224768,
      200224768,
      200224768
    ]
  },
  {
    "label": "fd-after-project-removal",
    "usedBytes": 35274752,
    "minUsedBytes": 35274752,
    "maxUsedBytes": 35274752,
    "samples": [
      35274752,
      35274752,
      35274752
    ]
  }
]
```

</details>

### Reproduction

The source revisions and tool path used by this harness are explicit. Reuse the reviewed tool implementation and point `tool` at its launcher when reproducing independently. The harness below inlines the same two source revisions that the executed harness read from the prior evaluation summary; no other measurement behavior is changed. The harness saves command output, raw APFS property lists, per-checkpoint samples, and results outside the disposable volume.

Disk-image setup actually used:

```bash
hdiutil create -size 12g -fs APFS -type SPARSE -volname FasterRustSpace /private/tmp/faster-rust-space-measurement.sparseimage
mkdir -p /private/tmp/faster-rust-space-volume
hdiutil attach -nobrowse -mountpoint /private/tmp/faster-rust-space-volume /private/tmp/faster-rust-space-measurement.sparseimage
/usr/bin/python3 /private/tmp/faster_rust_space.py
```

<details>
<summary>Measurement harness</summary>

```python
import pathlib, subprocess, json, time, plistlib, statistics, shutil, os, hashlib
volume=pathlib.Path('/private/tmp/faster-rust-space-volume')
evidence=pathlib.Path('/private/tmp/faster-rust-space-evidence'); evidence.mkdir(exist_ok=True)
tool=pathlib.Path('/Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs')
revisions=[{'project': 'ripgrep', 'revision': 'https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c'}, {'project': 'fd', 'revision': 'https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3'}]
records=[]; samples=[]; processes=[]
env={**os.environ,'CARGO_TERM_COLOR':'never'}
env.pop('CARGO_TARGET_DIR',None)
def run(argv,cwd,label):
 p=subprocess.run([str(x) for x in argv],cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env)
 (evidence/(label+'.log')).write_text('$ '+' '.join(map(str,argv))+'\nWorking directory: '+str(cwd)+'\n'+p.stdout)
 if p.returncode: raise RuntimeError(label+': '+p.stdout[-4000:])
 return p.stdout
def sample(label):
 subprocess.run(['sync'],check=True)
 values=[]
 for index in range(3):
  raw=subprocess.check_output(['diskutil','info','-plist',str(volume)])
  info=plistlib.loads(raw)
  used=info['APFSContainerSize']-info['APFSContainerFree']
  values.append(used)
  (evidence/(label+f'-sample-{index}.plist')).write_bytes(raw)
  time.sleep(0.2)
 result={'label':label,'usedBytes':int(statistics.median(values)),'minUsedBytes':min(values),'maxUsedBytes':max(values),'samples':values}
 samples.append(result)
 (evidence/'samples.json').write_text(json.dumps(samples,indent=2)+'\n')
 print(label, 'physical used bytes', result['usedBytes'],'spread',max(values)-min(values),flush=True)
 return result
def save():
 (evidence/'results.json').write_text(json.dumps(records,indent=2)+'\n')
# Fail before measurement if this is not the dedicated image.
info=plistlib.loads(subprocess.check_output(['diskutil','info','-plist',str(volume)]))
assert info['VolumeName']=='FasterRustSpace', info.get('VolumeName')
(volume/'.metadata_never_index').touch()
try:
 for project in revisions:
  name=project['project']; checkout=volume/name
  empty=sample(name+'-empty')
  run(['git','clone','--quiet',project['revision'].split('/commit/')[0]+'.git',checkout],volume,name+'-clone')
  run(['git','checkout','--quiet',project['revision'].split('/commit/')[1]],checkout,name+'-revision')
  config={'worktreeDirectory':'.faster-rust-space','targetDirectories':['target'],'cargoCommands':[{'cwd':'.','argv':['cargo','build','--locked','--offline']}]}
  (checkout/'faster-rust-worktrees.json').write_text(json.dumps(config,indent=2)+'\n')
  with (checkout/'.gitignore').open('a') as stream: stream.write('\n/.faster-rust-space/\n')
  run(['git','add','--force','.gitignore','faster-rust-worktrees.json'],checkout,name+'-config-add')
  run(['git','-c','user.name=Space evaluation','-c','user.email=space@example.invalid','commit','-qm','Local space evaluation configuration'],checkout,name+'-config-commit')
  run(['cargo','build','--locked','--offline'],checkout,name+'-warm')
  (evidence/(name+'-environment.log')).write_text(run(['rustc','--version'],checkout,name+'-rustc')+run(['node','--version'],checkout,name+'-node')+run(['diskutil','info',volume],checkout,name+'-filesystem'))
  for repeat in range(1,4):
   modes=['ordinary','optimized'] if repeat%2==1 else ['optimized','ordinary']
   for mode in modes:
    label=f'{name}-{mode}-repeat-{repeat}'
    baseline=sample(label+'-baseline')
    paths=[]; compiles=[]
    for count in range(1,11):
     branch=f'space-{mode}-{repeat}-{count}'
     argv=['node',tool,'create',branch]
     if mode=='ordinary': argv.append('--without-optimization')
     output=run(argv,checkout,label+f'-{count}-create')
     if mode=='optimized': assert 'copy-on-write cloned' in output,output
     path=checkout/'.faster-rust-space'/branch; paths.append(path)
     output=run(['cargo','build','--locked','--offline'],path,label+f'-{count}-build')
     compiled=output.count('Compiling ');compiles.append(compiled)
     if mode=='optimized': assert compiled==0,output
     print(label, 'built worktree',count,'compiled crates',compiled,flush=True)
     if count in [1,10]:
      allocation=sample(label+f'-{count}-built')
      records.append({'project':name,'upstreamRevision':project['revision'],'repeat':repeat,'mode':mode,'worktrees':count,'emptyUsedBytes':empty['usedBytes'],'baselineUsedBytes':baseline['usedBytes'],'scenarioUsedBytes':allocation['usedBytes'],'additionalBytes':allocation['usedBytes']-baseline['usedBytes'],'totalProjectBytes':allocation['usedBytes']-empty['usedBytes'],'mainCheckoutBytes':baseline['usedBytes']-empty['usedBytes'],'compiledCratesPerWorktree':compiles.copy(),'sampleSpreadBytes':allocation['maxUsedBytes']-allocation['minUsedBytes']})
      save()
    for count,path in enumerate(paths,1):
     run(['git','worktree','remove','--force',path],checkout,label+f'-{count}-remove')
    sample(label+'-after-removal')
  shutil.rmtree(checkout)
  sample(name+'-after-project-removal')
finally:
 # Remove only the project folders owned by this script; keep evidence outside the image.
 for name in ['ripgrep','fd']:
  path=volume/name
  if path.exists(): shutil.rmtree(path)
 save()
 print('Removed disposable project checkouts; evidence:',evidence,flush=True)

```

</details>
