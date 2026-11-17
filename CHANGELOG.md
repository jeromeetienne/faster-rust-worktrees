# Changelog

This file records notable changes to Faster Rust Work Trees. It follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Release notes

The tool package now uses the `faster_rust_worktrees` name. The evaluation documents are grouped together so readers can find the benchmark methods and results in one place.

### Changed

- Rename the `worktree_tools` package and its directory to `faster_rust_worktrees`. Update any direct references to the old package name or directory. [Pull request #13](https://github.com/jeromeetienne/faster-rust-worktrees/pull/13)
- Group the evaluation report and measurement records under `docs/evaluation/`. [Documentation commit](https://github.com/jeromeetienne/faster-rust-worktrees/commit/5ec4b9e9f510009b3356f1bdbdccf267cac0c12d)

## [0.2.0] - 2026-11-17

### Release notes

Faster Rust Work Trees adds measurements from late-sh, a larger Rust application, and makes coding-agent setup easier to follow. In one comparison of ten late-sh release worktrees, creation and first builds took about 22 minutes with ordinary worktrees and 54 seconds with build reuse. Added disk allocation fell from about 35 gigabytes to 846 megabytes.

### Added

- Publish one- and ten-worktree late-sh measurements, source-size comparisons, and an illustrated article about reusing Rust build output. [Measurements commit](https://github.com/jeromeetienne/faster-rust-worktrees/commit/a035a6fd7c4f2ba94295cd52b3e9842988) and [article commit](https://github.com/jeromeetienne/faster-rust-worktrees/commit/de732ccd1484cf897d823c91942c76b64cc05b8f)

### Changed

- Guide readers through installing the coding-agent skill and verifying reuse in their repository. Move direct tool setup and development commands to the package documentation. [Documentation commit](https://github.com/jeromeetienne/faster-rust-worktrees/commit/de732ccd1484cf897d823c91942c76b64cc05b8f)
- Add a daily build-allocation example based on the measured fd allocation ratio and spell out the assumptions behind the separate drive-lifetime estimate. [Pull request #10](https://github.com/jeromeetienne/faster-rust-worktrees/pull/10)

## [0.1.0] - 2026-11-17

### Release notes

Faster Rust Work Trees lets a new Rust worktree reuse existing Cargo build output. Each worktree has its own build directory, while unchanged data is shared on a file system that supports copy-on-write cloning. The draft skill guides coding agents through setup and verification.

### Added

- Add configurable worktree creation and preview-first cleanup of stale build output. The tool preserves source timestamps and relocates Cargo build-script records so unchanged builds can reuse compiled dependencies. [Pull request #7](https://github.com/jeromeetienne/faster-rust-worktrees/pull/7)
- Document build-time and disk-space measurements for ripgrep and fd. The optimized first builds of unchanged worktrees compiled zero crates in the macOS tests. [Pull request #7](https://github.com/jeromeetienne/faster-rust-worktrees/pull/7)
- Explain how repeated builds can contribute to flash wear and which assumptions link the measured disk allocation savings to an estimate of drive lifetime. [Pull request #8](https://github.com/jeromeetienne/faster-rust-worktrees/pull/8) and [pull request #9](https://github.com/jeromeetienne/faster-rust-worktrees/pull/9)

[Unreleased]: https://github.com/jeromeetienne/faster-rust-worktrees/compare/0.2.0...main
[0.2.0]: https://github.com/jeromeetienne/faster-rust-worktrees/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/jeromeetienne/faster-rust-worktrees/tree/0.1.0
