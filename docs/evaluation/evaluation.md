# Evaluation evidence

- Created: 16 November 2026
- Last updated: 17 November 2026
- Status: Measured local evidence; skill remains Draft
- Related framing: [Repository instructions](../../AGENTS.md)
- Related rules: [Folder constraints](../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)
- Related issue: [Issue 3](https://github.com/jeromeetienne/faster_rust_worktrees/issues/3)

## Scope and environment

Tested on macOS 26.2, Darwin arm64, Node.js 24.14.0, pnpm 10.33.2, and rustc 1.96.1. The real file system accepted macOS `clonefile` on populated Cargo output. Local dependencies were fetched by normal Cargo commands; comparisons used identical compiler, source, lockfile, environment, and `cargo build --locked` from each checkout root. This is a warm-original-output comparison, not a cold-machine benchmark.

At measurement time, the tool was the uncommitted implementation in the review worktree. No published tool revision is claimed. Each final project used the same tool source. Each project has a local configuration-only commit above the linked upstream revision: it tracks the JSON configuration and ignores the nested worktree folder before warming builds. Ordinary and optimized branches start at that same local revision. Disposable project checkouts and Rust fixtures were removed after verification.

## Feasibility and regression checks

The initial real fixture had an application, a shared Rust dependency, and an absolute build-script watch path. Raw observed output:

```text
clonefile populated Cargo target result: 0 errno: 0
Relocated build-script records: 1
Unchanged compiled crates: 0
Changed cloned program: 43
Original executable: 42
```

`pnpm test` repeats real Git and Cargo correctness, exact nanosecond dates, changed behavior, independent concurrent builds, ordinary creation, dirty-original handling, build-script relocation, independence from original sources, obsolete-output removal retaining current builds, stale-output removal retaining sources and main output, repeated cleanup preview, invalid paths, failed installation, missing output, failed/unrecognized Cargo logs, existing clone destination protection, and Zod validation of shipped skill frontmatter. `pnpm check` verifies strict TypeScript targeting ES2020. The standard skill validator rejects the existing underscore name `faster_rust_worktrees`; that established name is retained as required by the issue rather than renamed. Zod validates the shipped frontmatter.

## First attempts and improvements

The first attempt was not zero-compilation for ripgrep: ordinary worktrees compiled 34 crates, optimized worktrees compiled one. fd ordinary worktrees compiled 59 crates and optimized worktrees compiled zero.

Cargo diagnosis showed a source timestamp changed from `1794837398.968248645s` to `1794837398.967999000s`. JavaScript Date lost nanosecond precision. The tool now uses batched isolated Python operations to retain exact source and rewritten-record timestamps; Python 3 is an explicit runtime requirement, with an exact-timestamp regression assertion.

A second scripted adoption attempt retained an untracked configuration and a nested worktree directory missing an ignore rule. ripgrep still rebuilt one crate. A separate diagnostic run using an already ignored worktree location emitted no dirty fingerprints after the timestamp fix. The corrected adoption tracks configuration before warming and ignores nested worktrees. The tool now rejects a nonignored worktree location. These are manual interventions discovered during this implementation, not evidence of unattended skill adoption. The original draft omitted both exact precision and the source-set implications of untracked configuration.

The skill remains Draft. No independent coding-agent adoption study or workspace-consolidation trial was performed. Existing suitable workspaces were preserved.

See [one- and ten-worktree space measurements](space_measurements.md) for the subsequent isolated APFS allocation study, including raw readings and reproduction commands.

## Three-run results

Times are process wall time in seconds. Disk values are observed whole-volume free-space deltas after first build, in MiB. `df -k` accounts shared physical blocks once, unlike summing apparent clone sizes, but background writes, cache activity, delayed block freeing, and the volume's allocation policy were uncontrolled. These values are observations, not precise per-worktree storage accounting; no storage reduction guarantee follows from these samples.

| Project | Case | Creation seconds | First-build seconds | Compiled crates | Observed volume MiB |
|---|---|---:|---:|---:|---:|
| ripgrep | ordinary-1 | 0.478 | 6.650 | 34 | 280.80 |
| ripgrep | optimized-1 | 0.521 | 0.085 | 0 | 5.88 |
| ripgrep | ordinary-2 | 0.371 | 6.358 | 34 | 281.71 |
| ripgrep | optimized-2 | 0.513 | 0.072 | 0 | 4.93 |
| ripgrep | ordinary-3 | 0.339 | 6.640 | 34 | 275.72 |
| ripgrep | optimized-3 | 0.553 | 0.072 | 0 | 5.90 |
| fd | ordinary-1 | 0.327 | 5.880 | 59 | 155.88 |
| fd | optimized-1 | 0.675 | 0.092 | 0 | 1.75 |
| fd | ordinary-2 | 0.324 | 6.090 | 59 | 154.79 |
| fd | optimized-2 | 0.455 | 0.091 | 0 | 1.21 |
| fd | ordinary-3 | 0.315 | 5.857 | 59 | 153.27 |
| fd | optimized-3 | 0.448 | 0.090 | 0 | 1.66 |

Upstream source revisions:

- [ripgrep source](https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c).
- [fd source](https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3).

For both projects, real source changes inserted a diagnostic line in the application's `main` function. Concurrent builds of two optimized worktrees succeeded. The changed executable printed the diagnostic; the other executable did not. The other worktree also built and ran while the original checkout's source folder was temporarily hidden inside the disposable fixture. These checks exercise actual program output; `--version` alone was not used as source-change evidence.

## Packaging and migration boundaries

The root npm entry package exposes the nested TypeScript executable through a Node.js launcher, with runtime dependencies declared at the root. `npm pack` and isolated `npx --package=<local-tarball> faster-rust-worktrees --help` succeeded outside the pnpm monorepo. At measurement time, live installation from this repository's GitHub revision was pending a reviewed commit and push; local tarball execution is not claimed as proof of GitHub transport.

The canonical skill has moved here with source attribution and the upstream MIT license. At measurement time, the collection-side removal and link/count corrections were prepared in a separate uncommitted worktree. The original collection main checkout is untouched; the original draft was additionally backed up and byte-verified before removal from the migration worktree. These measurements predate migration completion; see the linked issue for the current publication status. GitHub currently reports this repository public; the developer explicitly chose to keep the repository public, superseding the issue's older private-visibility requirement.

Linux reflink behavior, native compiler caches, arbitrary generated files, absolute Cargo output paths, and embedded original-checkout paths remain unverified. Cleanup requires builds to be stopped and complete configured command coverage. Access times can be deferred by the operating system; age is a heuristic.

## Reproduce independent evaluation

The following exact harness was used for the final project comparisons. It writes logs in a temporary evidence folder, creates only disposable project checkouts, and removes those checkouts in `finally`. Change the local tool path before running elsewhere. This is evaluation material, not receiving-repository implementation.

```python
import subprocess, pathlib, tempfile, json, time, shutil, os
root=pathlib.Path(tempfile.mkdtemp(prefix='faster-rust-projects-',dir='/private/tmp'))
tool=pathlib.Path('/Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs')
logs=pathlib.Path('/private/tmp/faster-rust-evidence-verified'); logs.mkdir(exist_ok=True)
summary=[]
def free(cwd):
 return int(subprocess.check_output(['df','-k',str(cwd)],text=True).splitlines()[-1].split()[3])*1024
def run(argv,cwd,label):
 start=time.monotonic(); result=subprocess.run(argv,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env={**os.environ,'CARGO_TERM_COLOR':'never'})
 elapsed=time.monotonic()-start
 output=result.stdout
 (logs/(label+'.log')).write_text('$ '+' '.join(map(str,argv))+'\nWorking directory: '+str(cwd)+'\n'+output)
 print(label,'exit',result.returncode,'seconds',round(elapsed,3),flush=True)
 if result.returncode: raise RuntimeError(label+' failed: '+output[-3000:])
 return elapsed,output
try:
 for name,url in [('ripgrep','https://github.com/BurntSushi/ripgrep.git'),('fd','https://github.com/sharkdp/fd.git')]:
  checkout=root/name
  run(['git','clone','--quiet','--depth','1',url,str(checkout)],root,name+'-clone')
  revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=checkout,text=True).strip()
  compiler=subprocess.check_output(['rustc','--version'],text=True).strip()
  config={'worktreeDirectory':'.faster-rust-evaluation','targetDirectories':['target'],'cargoCommands':[{'cwd':'.','argv':['cargo','build','--locked']}]}
  (checkout/'faster-rust-worktrees.json').write_text(json.dumps(config))
  with (checkout/'.gitignore').open('a') as stream: stream.write('\n/.faster-rust-evaluation/\n')
  run(['git','add','--force','faster-rust-worktrees.json','.gitignore'],checkout,name+'-configuration-add')
  run(['git','-c','user.name=Evaluation','-c','user.email=evaluation@example.invalid','commit','-qm','Local evaluation configuration'],checkout,name+'-configuration-commit')
  run(['cargo','build','--locked'],checkout,name+'-warm')
  rows=[]
  for index in range(1,4):
   for mode in ['ordinary','optimized']:
    branch=mode+'-'+str(index)
    argv=['node',str(tool),'create',branch]
    if mode=='ordinary': argv+=['--without-optimization']
    before=free(checkout)
    elapsed,output=run(argv,checkout,f'{name}-{branch}-create')
    afterCreation=free(checkout)
    path=checkout/'.faster-rust-evaluation'/branch
    buildElapsed,buildOutput=run(['cargo','build','--locked'],path,f'{name}-{branch}-build')
    rows.append({'case':branch,'creationSeconds':round(elapsed,3),'firstBuildSeconds':round(buildElapsed,3),'compiledCrates':buildOutput.count('Compiling '),'volumeBytesCreation':before-afterCreation,'volumeBytesAfterBuild':before-free(checkout)})
    if mode=='optimized' and index==1:
     # Run actual behavior before and after changing the independent project source.
     binary='rg' if name=='ripgrep' else 'fd'
     run([str(path/'target/debug'/binary),'--version'],path,f'{name}-optimized-version')
     run(['node',str(tool),'create','parallel-check'],checkout,f'{name}-parallel-create')
     second=checkout/'.faster-rust-evaluation/parallel-check'
     source=path/('crates/core/main.rs' if name=='ripgrep' else 'src/main.rs')
     import re
     text=source.read_text(); changed,count=re.subn(r'(fn main\([^)]*\)[^{]*\{)', r'\1\n    eprintln!("faster-rust-evaluation-changed");',text,count=1)
     if count!=1: raise RuntimeError('Source edit did not match actual main function')
     source.write_text(changed)
     processes=[subprocess.Popen(['cargo','build','--locked'],cwd=folder,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True) for folder in [path,second]]
     for number,process in enumerate(processes):
      output=process.communicate()[0]; (logs/f'{name}-parallel-build-{number}.log').write_text(output)
      if process.returncode: raise RuntimeError(output)
     output=run([str(path/'target/debug'/binary),'--version'],path,f'{name}-changed-behavior') [1]
     if 'faster-rust-evaluation-changed' not in output: raise RuntimeError('Changed program behavior missing')
     originalSources=checkout/('crates' if name=='ripgrep' else 'src')
     originalSources.rename(checkout/'hidden-original-sources')
     try:
      output=run(['cargo','build','--locked'],second,f'{name}-independence-build')[1]
      output=run([str(second/'target/debug'/binary),'--version'],second,f'{name}-unchanged-behavior')[1]
      if 'faster-rust-evaluation-changed' in output: raise RuntimeError('Independent worktree changed unexpectedly')
     finally: (checkout/'hidden-original-sources').rename(originalSources)
     run(['git','worktree','remove','--force',str(second)],checkout,f'{name}-parallel-remove')
    run(['git','worktree','remove','--force',str(path)],checkout,f'{name}-{branch}-remove')
  summary.append({'project':name,'revision':url.removesuffix('.git')+'/commit/'+revision,'compiler':compiler,'configuration':'Local configuration-only commit on the linked upstream source revision; config and ignore rules are tracked before warming builds','rows':rows,'diskMeasurement':'df -k whole-volume free-block deltas; shared clones counted once, background writes and delayed freeing uncontrolled; no per-worktree precision claim'})
  (logs/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
finally:
 shutil.rmtree(root)
 print('Removed disposable project checkouts',root,flush=True)

```

## Retained raw output


### First attempt


#### fd-optimized-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/optimized-1
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-1
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/optimized-1",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/optimized-2
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-2
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/optimized-2",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/optimized-3
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-3
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/optimized-3",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-version.log

```text
$ /private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/optimized-1/target/debug/fd --version
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/optimized-1
fd 10.5.2

```

#### fd-ordinary-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-1
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling memchr v2.8.3
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling rustix v1.1.6
   Compiling crossbeam-utils v0.8.23
   Compiling unicode-ident v1.0.27
   Compiling cfg-if v1.0.5
   Compiling objc2 v0.6.5
   Compiling utf8parse v0.2.2
   Compiling is_terminal_polyfill v1.70.2
   Compiling anstyle-parse v1.0.0
   Compiling colorchoice v1.0.5
   Compiling anstyle-query v1.1.5
   Compiling objc2-encode v4.1.0
   Compiling regex-syntax v0.8.11
   Compiling anstyle v1.0.14
   Compiling aho-corasick v1.1.5
   Compiling crossbeam-epoch v0.9.21
   Compiling anstream v1.0.0
   Compiling nix v0.30.1
   Compiling nix v0.31.3
   Compiling heck v0.5.0
   Compiling crossbeam-deque v0.8.8
   Compiling strsim v0.11.1
   Compiling clap_lex v1.1.1
   Compiling bstr v1.13.1
   Compiling regex-automata v0.4.18
   Compiling block2 v0.6.2
   Compiling syn v3.0.9
   Compiling log v0.4.34
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling bitflags v1.3.2
   Compiling once_cell v1.21.4
   Compiling walkdir v2.5.0
   Compiling nu-ansi-term v0.50.3
   Compiling jiff-core v0.1.1
   Compiling crossbeam-channel v0.5.17
   Compiling lscolors v0.21.0
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling argmax v0.4.0
   Compiling jiff v0.2.38
   Compiling ctrlc v3.5.2
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling ignore v0.4.34
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.05s

```

#### fd-ordinary-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-1 --without-optimization
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-1",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-ordinary-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-2
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling proc-macro2 v1.0.107
   Compiling memchr v2.8.3
   Compiling quote v1.0.47
   Compiling rustix v1.1.6
   Compiling unicode-ident v1.0.27
   Compiling crossbeam-utils v0.8.23
   Compiling cfg-if v1.0.5
   Compiling objc2 v0.6.5
   Compiling utf8parse v0.2.2
   Compiling crossbeam-epoch v0.9.21
   Compiling anstyle-parse v1.0.0
   Compiling anstyle-query v1.1.5
   Compiling is_terminal_polyfill v1.70.2
   Compiling colorchoice v1.0.5
   Compiling objc2-encode v4.1.0
   Compiling regex-syntax v0.8.11
   Compiling anstyle v1.0.14
   Compiling aho-corasick v1.1.5
   Compiling anstream v1.0.0
   Compiling nix v0.31.3
   Compiling nix v0.30.1
   Compiling crossbeam-deque v0.8.8
   Compiling heck v0.5.0
   Compiling strsim v0.11.1
   Compiling clap_lex v1.1.1
   Compiling block2 v0.6.2
   Compiling bstr v1.13.1
   Compiling same-file v1.0.6
   Compiling syn v3.0.9
   Compiling log v0.4.34
   Compiling regex-automata v0.4.18
   Compiling anyhow v1.0.104
   Compiling walkdir v2.5.0
   Compiling once_cell v1.21.4
   Compiling bitflags v1.3.2
   Compiling nu-ansi-term v0.50.3
   Compiling jiff-core v0.1.1
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling lscolors v0.21.0
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling argmax v0.4.0
   Compiling faccess v0.2.4
   Compiling terminal_size v0.4.4
   Compiling ctrlc v3.5.2
   Compiling jiff v0.2.38
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling ignore v0.4.34
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-2)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.11s

```

#### fd-ordinary-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-2 --without-optimization
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-2",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-ordinary-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-3
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling proc-macro2 v1.0.107
   Compiling memchr v2.8.3
   Compiling rustix v1.1.6
   Compiling quote v1.0.47
   Compiling crossbeam-utils v0.8.23
   Compiling unicode-ident v1.0.27
   Compiling cfg-if v1.0.5
   Compiling objc2 v0.6.5
   Compiling utf8parse v0.2.2
   Compiling anstyle v1.0.14
   Compiling anstyle-parse v1.0.0
   Compiling crossbeam-epoch v0.9.21
   Compiling anstyle-query v1.1.5
   Compiling colorchoice v1.0.5
   Compiling is_terminal_polyfill v1.70.2
   Compiling regex-syntax v0.8.11
   Compiling objc2-encode v4.1.0
   Compiling aho-corasick v1.1.5
   Compiling anstream v1.0.0
   Compiling nix v0.30.1
   Compiling nix v0.31.3
   Compiling heck v0.5.0
   Compiling strsim v0.11.1
   Compiling crossbeam-deque v0.8.8
   Compiling clap_lex v1.1.1
   Compiling bstr v1.13.1
   Compiling regex-automata v0.4.18
   Compiling block2 v0.6.2
   Compiling log v0.4.34
   Compiling syn v3.0.9
   Compiling same-file v1.0.6
   Compiling anyhow v1.0.104
   Compiling walkdir v2.5.0
   Compiling nu-ansi-term v0.50.3
   Compiling jiff-core v0.1.1
   Compiling once_cell v1.21.4
   Compiling bitflags v1.3.2
   Compiling lscolors v0.21.0
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling argmax v0.4.0
   Compiling jiff v0.2.38
   Compiling ctrlc v3.5.2
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling ignore v0.4.34
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-3)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.38s

```

#### fd-ordinary-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-3 --without-optimization
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/fd/.faster-rust-evaluation/ordinary-3",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-warm.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/fd
    Updating crates.io index
 Downloading crates ...
  Downloaded terminal_size v0.4.4
  Downloaded etcetera v0.11.0
  Downloaded normpath v1.5.2
  Downloaded jiff-static v0.2.38
  Downloaded lscolors v0.21.0
  Downloaded faccess v0.2.4
  Downloaded ctrlc v3.5.2
  Downloaded argmax v0.4.0
  Downloaded globset v0.4.21
  Downloaded clap_complete v4.6.11
  Downloaded ignore v0.4.34
  Downloaded nix v0.31.3
  Downloaded rustix v1.1.6
  Downloaded nix v0.30.1
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling memchr v2.8.3
   Compiling proc-macro2 v1.0.107
   Compiling crossbeam-utils v0.8.23
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling rustix v1.1.6
   Compiling cfg-if v1.0.5
   Compiling objc2 v0.6.5
   Compiling utf8parse v0.2.2
   Compiling colorchoice v1.0.5
   Compiling anstyle-parse v1.0.0
   Compiling crossbeam-epoch v0.9.21
   Compiling regex-syntax v0.8.11
   Compiling anstyle v1.0.14
   Compiling aho-corasick v1.1.5
   Compiling anstyle-query v1.1.5
   Compiling objc2-encode v4.1.0
   Compiling is_terminal_polyfill v1.70.2
   Compiling anstream v1.0.0
   Compiling nix v0.31.3
   Compiling nix v0.30.1
   Compiling heck v0.5.0
   Compiling clap_lex v1.1.1
   Compiling crossbeam-deque v0.8.8
   Compiling regex-automata v0.4.18
   Compiling strsim v0.11.1
   Compiling errno v0.3.14
   Compiling bstr v1.13.1
   Compiling anyhow v1.0.104
   Compiling log v0.4.34
   Compiling block2 v0.6.2
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling dispatch2 v0.3.1
   Compiling nu-ansi-term v0.50.3
   Compiling syn v3.0.9
   Compiling jiff-core v0.1.1
   Compiling once_cell v1.21.4
   Compiling bitflags v1.3.2
   Compiling globset v0.4.21
   Compiling faccess v0.2.4
   Compiling regex v1.13.1
   Compiling lscolors v0.21.0
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling jiff v0.2.38
   Compiling ignore v0.4.34
   Compiling argmax v0.4.0
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling ctrlc v3.5.2
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-gjjnl276/fd)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 8.28s

```

#### ripgrep-first-attempt-diagnosis.log

```text
Diagnostic excerpt (dirty fingerprint lines only):
   0.036741250s  INFO prepare_target{force=false package_id=ripgrep v15.2.0 (/private/tmp/faster-rust-diagnose-t6lk1sxk/ripgrep/.agents/worktree/diagnose) target="rg"}: cargo::core::compiler::fingerprint: fingerprint dirty for ripgrep v15.2.0 (/private/tmp/faster-rust-diagnose-t6lk1sxk/ripgrep/.agents/worktree/diagnose)/Build/TargetInner { name: "rg", benched: false, doc: true, ..: with_path("/private/tmp/faster-rust-diagnose-t6lk1sxk/ripgrep/.agents/worktree/diagnose/crates/core/main.rs", Edition2024) }
   0.036758541s  INFO prepare_target{force=false package_id=ripgrep v15.2.0 (/private/tmp/faster-rust-diagnose-t6lk1sxk/ripgrep/.agents/worktree/diagnose) target="rg"}: cargo::core::compiler::fingerprint:     dirty: UnitDependencyInfoChanged { unit: UnitIndex(37) }
   0.043099250s  INFO prepare_target{force=false package_id=ripgrep v15.2.0 (/private/tmp/faster-rust-diagnose-t6lk1sxk/ripgrep/.agents/worktree/diagnose) target="build-script-build"}: cargo::core::compiler::fingerprint: fingerprint dirty for ripgrep v15.2.0 (/private/tmp/faster-rust-diagnose-t6lk1sxk/ripgrep/.agents/worktree/diagnose)/RunCustomBuild/TargetInner { ..: custom_build_target("build-script-build", "/private/tmp/faster-rust-diagnose-t6lk1sxk/ripgrep/.agents/worktree/diagnose/build.rs", Edition2024) }
   0.043109416s  INFO prepare_target{force=false package_id=ripgrep v15.2.0 (/private/tmp/faster-rust-diagnose-t6lk1sxk/ripgrep/.agents/worktree/diagnose) target="build-script-build"}: cargo::core::compiler::fingerprint:     dirty: PrecalculatedComponentsChanged { old: "1794837398.968248645s (tests/util.rs)", new: "1794837398.967999000s (tests/util.rs)" }
```

#### ripgrep-nanosecond-diagnosis.log

```text
Diagnostic excerpt (dirty fingerprint lines only):

```

#### ripgrep-optimized-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-1
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.35s

```

#### ripgrep-optimized-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-1
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-1",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-2
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-2)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.31s

```

#### ripgrep-optimized-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-2
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-2",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-3
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-3)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.31s

```

#### ripgrep-optimized-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-3
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-3",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-version.log

```text
$ /private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-1/target/debug/rg --version
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/optimized-1
ripgrep 15.2.0 (rev 178cc027e2)

features:-pcre2
simd(compile):+NEON
simd(runtime):+NEON

PCRE2 is not available in this build of ripgrep.

```

#### ripgrep-ordinary-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling libc v0.2.189
   Compiling log v0.4.33
   Compiling serde_core v1.0.229
   Compiling cfg-if v1.0.4
   Compiling zmij v1.0.23
   Compiling crossbeam-utils v0.8.22
   Compiling serde_json v1.0.151
   Compiling crossbeam-epoch v0.9.20
   Compiling encoding_rs v0.8.35
   Compiling serde v1.0.229
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1/crates/matcher)
   Compiling termcolor v1.4.1
   Compiling crossbeam-deque v0.8.7
   Compiling itoa v1.0.18
   Compiling encoding_rs_io v0.1.8
   Compiling same-file v1.0.6
   Compiling anyhow v1.0.104
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1)
   Compiling lexopt v0.3.2
   Compiling textwrap v0.16.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.53s

```

#### ripgrep-ordinary-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-1 --without-optimization
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-1",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-ordinary-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling log v0.4.33
   Compiling libc v0.2.189
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling crossbeam-utils v0.8.22
   Compiling cfg-if v1.0.4
   Compiling crossbeam-epoch v0.9.20
   Compiling serde v1.0.229
   Compiling encoding_rs v0.8.35
   Compiling serde_json v1.0.151
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2/crates/matcher)
   Compiling crossbeam-deque v0.8.7
   Compiling itoa v1.0.18
   Compiling termcolor v1.4.1
   Compiling encoding_rs_io v0.1.8
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2)
   Compiling regex-automata v0.4.18
   Compiling walkdir v2.5.0
   Compiling textwrap v0.16.2
   Compiling lexopt v0.3.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.93s

```

#### ripgrep-ordinary-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-2 --without-optimization
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-2",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-ordinary-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling libc v0.2.189
   Compiling log v0.4.33
   Compiling serde_core v1.0.229
   Compiling cfg-if v1.0.4
   Compiling zmij v1.0.23
   Compiling crossbeam-utils v0.8.22
   Compiling crossbeam-epoch v0.9.20
   Compiling serde v1.0.229
   Compiling encoding_rs v0.8.35
   Compiling serde_json v1.0.151
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3/crates/matcher)
   Compiling termcolor v1.4.1
   Compiling itoa v1.0.18
   Compiling crossbeam-deque v0.8.7
   Compiling encoding_rs_io v0.1.8
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3)
   Compiling textwrap v0.16.2
   Compiling lexopt v0.3.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.55s

```

#### ripgrep-ordinary-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-3 --without-optimization
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-gjjnl276/ripgrep/.faster-rust-evaluation/ordinary-3",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-warm.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-gjjnl276/ripgrep
    Updating crates.io index
 Downloading crates ...
  Downloaded termcolor v1.4.1
  Downloaded encoding_rs_io v0.1.8
  Downloaded crossbeam-epoch v0.9.20
  Downloaded crossbeam-deque v0.8.7
  Downloaded lexopt v0.3.2
  Downloaded crossbeam-utils v0.8.22
  Downloaded textwrap v0.16.2
  Downloaded log v0.4.33
  Downloaded bstr v1.13.0
  Downloaded encoding_rs v0.8.35
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling libc v0.2.189
   Compiling log v0.4.33
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling crossbeam-utils v0.8.22
   Compiling cfg-if v1.0.4
   Compiling crossbeam-epoch v0.9.20
   Compiling serde v1.0.229
   Compiling encoding_rs v0.8.35
   Compiling serde_json v1.0.151
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/crates/matcher)
   Compiling itoa v1.0.18
   Compiling encoding_rs_io v0.1.8
   Compiling termcolor v1.4.1
   Compiling crossbeam-deque v0.8.7
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling regex-automata v0.4.18
   Compiling walkdir v2.5.0
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep)
   Compiling lexopt v0.3.2
   Compiling textwrap v0.16.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/crates/regex)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/crates/ignore)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/crates/printer)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-gjjnl276/ripgrep/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 8.16s

```

### Second attempt


#### fd-changed-behavior.log

```text
$ /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-1/target/debug/fd --version
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-1
faster-rust-evaluation-changed
fd 10.5.2

```

#### fd-independence-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/parallel-check
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-1
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.10s

```

#### fd-optimized-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-1
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-1",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-2
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-2
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-2",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-3
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-3
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-3",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-version.log

```text
$ /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-1/target/debug/fd --version
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-1
fd 10.5.2

```

#### fd-ordinary-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-1
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling proc-macro2 v1.0.107
   Compiling memchr v2.8.3
   Compiling unicode-ident v1.0.27
   Compiling rustix v1.1.6
   Compiling crossbeam-utils v0.8.23
   Compiling quote v1.0.47
   Compiling objc2 v0.6.5
   Compiling cfg-if v1.0.5
   Compiling utf8parse v0.2.2
   Compiling anstyle v1.0.14
   Compiling anstyle-parse v1.0.0
   Compiling crossbeam-epoch v0.9.21
   Compiling objc2-encode v4.1.0
   Compiling colorchoice v1.0.5
   Compiling anstyle-query v1.1.5
   Compiling aho-corasick v1.1.5
   Compiling regex-syntax v0.8.11
   Compiling is_terminal_polyfill v1.70.2
   Compiling anstream v1.0.0
   Compiling nix v0.30.1
   Compiling nix v0.31.3
   Compiling heck v0.5.0
   Compiling clap_lex v1.1.1
   Compiling crossbeam-deque v0.8.8
   Compiling strsim v0.11.1
   Compiling block2 v0.6.2
   Compiling bstr v1.13.1
   Compiling syn v3.0.9
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling log v0.4.34
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling once_cell v1.21.4
   Compiling jiff-core v0.1.1
   Compiling bitflags v1.3.2
   Compiling nu-ansi-term v0.50.3
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling lscolors v0.21.0
   Compiling normpath v1.5.2
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling jiff v0.2.38
   Compiling argmax v0.4.0
   Compiling ctrlc v3.5.2
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling clap_derive v4.6.7
   Compiling ignore v0.4.34
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.78s

```

#### fd-ordinary-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-1 --without-optimization
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-1",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-ordinary-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-2
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling memchr v2.8.3
   Compiling proc-macro2 v1.0.107
   Compiling rustix v1.1.6
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
   Compiling crossbeam-utils v0.8.23
   Compiling cfg-if v1.0.5
   Compiling objc2 v0.6.5
   Compiling utf8parse v0.2.2
   Compiling objc2-encode v4.1.0
   Compiling anstyle-parse v1.0.0
   Compiling anstyle v1.0.14
   Compiling colorchoice v1.0.5
   Compiling regex-syntax v0.8.11
   Compiling anstyle-query v1.1.5
   Compiling aho-corasick v1.1.5
   Compiling is_terminal_polyfill v1.70.2
   Compiling crossbeam-epoch v0.9.21
   Compiling anstream v1.0.0
   Compiling nix v0.30.1
   Compiling nix v0.31.3
   Compiling heck v0.5.0
   Compiling clap_lex v1.1.1
   Compiling strsim v0.11.1
   Compiling crossbeam-deque v0.8.8
   Compiling bstr v1.13.1
   Compiling regex-automata v0.4.18
   Compiling syn v3.0.9
   Compiling block2 v0.6.2
   Compiling anyhow v1.0.104
   Compiling log v0.4.34
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling bitflags v1.3.2
   Compiling once_cell v1.21.4
   Compiling jiff-core v0.1.1
   Compiling nu-ansi-term v0.50.3
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling lscolors v0.21.0
   Compiling normpath v1.5.2
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling argmax v0.4.0
   Compiling jiff v0.2.38
   Compiling ctrlc v3.5.2
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling ignore v0.4.34
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-2)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.15s

```

#### fd-ordinary-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-2 --without-optimization
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-2",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-ordinary-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-3
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling memchr v2.8.3
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
   Compiling rustix v1.1.6
   Compiling crossbeam-utils v0.8.23
   Compiling utf8parse v0.2.2
   Compiling objc2 v0.6.5
   Compiling cfg-if v1.0.5
   Compiling anstyle-parse v1.0.0
   Compiling regex-syntax v0.8.11
   Compiling objc2-encode v4.1.0
   Compiling is_terminal_polyfill v1.70.2
   Compiling anstyle-query v1.1.5
   Compiling colorchoice v1.0.5
   Compiling aho-corasick v1.1.5
   Compiling anstyle v1.0.14
   Compiling crossbeam-epoch v0.9.21
   Compiling nix v0.30.1
   Compiling anstream v1.0.0
   Compiling nix v0.31.3
   Compiling crossbeam-deque v0.8.8
   Compiling clap_lex v1.1.1
   Compiling strsim v0.11.1
   Compiling heck v0.5.0
   Compiling syn v3.0.9
   Compiling bstr v1.13.1
   Compiling regex-automata v0.4.18
   Compiling block2 v0.6.2
   Compiling anyhow v1.0.104
   Compiling log v0.4.34
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling nu-ansi-term v0.50.3
   Compiling once_cell v1.21.4
   Compiling bitflags v1.3.2
   Compiling jiff-core v0.1.1
   Compiling crossbeam-channel v0.5.17
   Compiling lscolors v0.21.0
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling argmax v0.4.0
   Compiling jiff v0.2.38
   Compiling ctrlc v3.5.2
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling clap_derive v4.6.7
   Compiling ignore v0.4.34
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-3)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.04s

```

#### fd-ordinary-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-3 --without-optimization
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/ordinary-3",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-parallel-build-0.log

```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/optimized-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.89s

```

#### fd-parallel-build-1.log

```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.12s

```

#### fd-parallel-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create parallel-check
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/parallel-check",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-unchanged-behavior.log

```text
$ /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/parallel-check/target/debug/fd --version
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd/.faster-rust-evaluation/parallel-check
fd 10.5.2

```

#### fd-warm.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/fd
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling proc-macro2 v1.0.107
   Compiling memchr v2.8.3
   Compiling crossbeam-utils v0.8.23
   Compiling quote v1.0.47
   Compiling rustix v1.1.6
   Compiling unicode-ident v1.0.27
   Compiling objc2 v0.6.5
   Compiling cfg-if v1.0.5
   Compiling utf8parse v0.2.2
   Compiling anstyle v1.0.14
   Compiling anstyle-parse v1.0.0
   Compiling colorchoice v1.0.5
   Compiling is_terminal_polyfill v1.70.2
   Compiling anstyle-query v1.1.5
   Compiling regex-syntax v0.8.11
   Compiling objc2-encode v4.1.0
   Compiling crossbeam-epoch v0.9.21
   Compiling aho-corasick v1.1.5
   Compiling anstream v1.0.0
   Compiling nix v0.31.3
   Compiling nix v0.30.1
   Compiling crossbeam-deque v0.8.8
   Compiling strsim v0.11.1
   Compiling heck v0.5.0
   Compiling clap_lex v1.1.1
   Compiling bstr v1.13.1
   Compiling block2 v0.6.2
   Compiling regex-automata v0.4.18
   Compiling same-file v1.0.6
   Compiling log v0.4.34
   Compiling anyhow v1.0.104
   Compiling syn v3.0.9
   Compiling walkdir v2.5.0
   Compiling nu-ansi-term v0.50.3
   Compiling once_cell v1.21.4
   Compiling bitflags v1.3.2
   Compiling jiff-core v0.1.1
   Compiling crossbeam-channel v0.5.17
   Compiling lscolors v0.21.0
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling argmax v0.4.0
   Compiling jiff v0.2.38
   Compiling ctrlc v3.5.2
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling ignore v0.4.34
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-kzr7wvxy/fd)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.32s

```

#### ripgrep-changed-behavior.log

```text
$ /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-1/target/debug/rg --version
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-1
faster-rust-evaluation-changed
ripgrep 15.2.0 (rev 178cc027e2)

features:-pcre2
simd(compile):+NEON
simd(runtime):+NEON

PCRE2 is not available in this build of ripgrep.

```

#### ripgrep-independence-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/parallel-check
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.03s

```

#### ripgrep-optimized-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-1
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.30s

```

#### ripgrep-optimized-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-1
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-1",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-2
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-2)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.32s

```

#### ripgrep-optimized-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-2
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-2",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-3
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-3)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.56s

```

#### ripgrep-optimized-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-3
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-3",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-version.log

```text
$ /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-1/target/debug/rg --version
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-1
ripgrep 15.2.0 (rev 178cc027e2)

features:-pcre2
simd(compile):+NEON
simd(runtime):+NEON

PCRE2 is not available in this build of ripgrep.

```

#### ripgrep-ordinary-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling log v0.4.33
   Compiling libc v0.2.189
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling cfg-if v1.0.4
   Compiling crossbeam-utils v0.8.22
   Compiling serde_json v1.0.151
   Compiling serde v1.0.229
   Compiling encoding_rs v0.8.35
   Compiling crossbeam-epoch v0.9.20
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1/crates/matcher)
   Compiling termcolor v1.4.1
   Compiling crossbeam-deque v0.8.7
   Compiling itoa v1.0.18
   Compiling encoding_rs_io v0.1.8
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1)
   Compiling lexopt v0.3.2
   Compiling textwrap v0.16.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 7.44s

```

#### ripgrep-ordinary-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-1 --without-optimization
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-1",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-ordinary-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling log v0.4.33
   Compiling libc v0.2.189
   Compiling serde_core v1.0.229
   Compiling cfg-if v1.0.4
   Compiling zmij v1.0.23
   Compiling crossbeam-utils v0.8.22
   Compiling crossbeam-epoch v0.9.20
   Compiling serde v1.0.229
   Compiling encoding_rs v0.8.35
   Compiling serde_json v1.0.151
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2/crates/matcher)
   Compiling crossbeam-deque v0.8.7
   Compiling itoa v1.0.18
   Compiling termcolor v1.4.1
   Compiling encoding_rs_io v0.1.8
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2)
   Compiling regex-automata v0.4.18
   Compiling lexopt v0.3.2
   Compiling textwrap v0.16.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.56s

```

#### ripgrep-ordinary-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-2 --without-optimization
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-2",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-ordinary-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling libc v0.2.189
   Compiling log v0.4.33
   Compiling serde_core v1.0.229
   Compiling crossbeam-utils v0.8.22
   Compiling cfg-if v1.0.4
   Compiling zmij v1.0.23
   Compiling crossbeam-epoch v0.9.20
   Compiling serde v1.0.229
   Compiling encoding_rs v0.8.35
   Compiling serde_json v1.0.151
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3/crates/matcher)
   Compiling itoa v1.0.18
   Compiling crossbeam-deque v0.8.7
   Compiling termcolor v1.4.1
   Compiling encoding_rs_io v0.1.8
   Compiling same-file v1.0.6
   Compiling anyhow v1.0.104
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3)
   Compiling lexopt v0.3.2
   Compiling textwrap v0.16.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.55s

```

#### ripgrep-ordinary-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-3 --without-optimization
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/ordinary-3",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-parallel-build-0.log

```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/optimized-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.86s

```

#### ripgrep-parallel-build-1.log

```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/parallel-check)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.45s

```

#### ripgrep-parallel-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create parallel-check
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/parallel-check",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-unchanged-behavior.log

```text
$ /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/parallel-check/target/debug/rg --version
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/.faster-rust-evaluation/parallel-check
ripgrep 15.2.0 (rev 178cc027e2)

features:-pcre2
simd(compile):+NEON
simd(runtime):+NEON

PCRE2 is not available in this build of ripgrep.

```

#### ripgrep-warm.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-kzr7wvxy/ripgrep
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling log v0.4.33
   Compiling libc v0.2.189
   Compiling serde_core v1.0.229
   Compiling cfg-if v1.0.4
   Compiling crossbeam-utils v0.8.22
   Compiling zmij v1.0.23
   Compiling serde v1.0.229
   Compiling serde_json v1.0.151
   Compiling encoding_rs v0.8.35
   Compiling crossbeam-epoch v0.9.20
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/crates/matcher)
   Compiling itoa v1.0.18
   Compiling termcolor v1.4.1
   Compiling encoding_rs_io v0.1.8
   Compiling crossbeam-deque v0.8.7
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep)
   Compiling textwrap v0.16.2
   Compiling memmap2 v0.9.11
   Compiling lexopt v0.3.2
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-kzr7wvxy/ripgrep/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 7.34s

```

### Verified setup


#### fd-changed-behavior.log

```text
$ /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-1/target/debug/fd --version
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-1
faster-rust-evaluation-changed
fd 10.5.2

```

#### fd-independence-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/parallel-check
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.05s

```

#### fd-optimized-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-1
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-1
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-1",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-2
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-2
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-2",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-3
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.06s

```

#### fd-optimized-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-3
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-3",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-optimized-version.log

```text
$ /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-1/target/debug/fd --version
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-1
fd 10.5.2

```

#### fd-ordinary-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-1
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling memchr v2.8.3
   Compiling proc-macro2 v1.0.107
   Compiling crossbeam-utils v0.8.23
   Compiling quote v1.0.47
   Compiling rustix v1.1.6
   Compiling unicode-ident v1.0.27
   Compiling objc2 v0.6.5
   Compiling utf8parse v0.2.2
   Compiling cfg-if v1.0.5
   Compiling anstyle-parse v1.0.0
   Compiling objc2-encode v4.1.0
   Compiling crossbeam-epoch v0.9.21
   Compiling anstyle v1.0.14
   Compiling aho-corasick v1.1.5
   Compiling colorchoice v1.0.5
   Compiling anstyle-query v1.1.5
   Compiling regex-syntax v0.8.11
   Compiling is_terminal_polyfill v1.70.2
   Compiling anstream v1.0.0
   Compiling nix v0.31.3
   Compiling nix v0.30.1
   Compiling crossbeam-deque v0.8.8
   Compiling heck v0.5.0
   Compiling strsim v0.11.1
   Compiling clap_lex v1.1.1
   Compiling block2 v0.6.2
   Compiling syn v3.0.9
   Compiling bstr v1.13.1
   Compiling log v0.4.34
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling once_cell v1.21.4
   Compiling jiff-core v0.1.1
   Compiling bitflags v1.3.2
   Compiling nu-ansi-term v0.50.3
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling lscolors v0.21.0
   Compiling normpath v1.5.2
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling argmax v0.4.0
   Compiling jiff v0.2.38
   Compiling ctrlc v3.5.2
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling clap_derive v4.6.7
   Compiling ignore v0.4.34
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 5.85s

```

#### fd-ordinary-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-1 --without-optimization
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-1",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-ordinary-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-2
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling proc-macro2 v1.0.107
   Compiling memchr v2.8.3
   Compiling rustix v1.1.6
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling crossbeam-utils v0.8.23
   Compiling utf8parse v0.2.2
   Compiling cfg-if v1.0.5
   Compiling objc2 v0.6.5
   Compiling anstyle-parse v1.0.0
   Compiling anstyle v1.0.14
   Compiling is_terminal_polyfill v1.70.2
   Compiling objc2-encode v4.1.0
   Compiling colorchoice v1.0.5
   Compiling crossbeam-epoch v0.9.21
   Compiling anstyle-query v1.1.5
   Compiling aho-corasick v1.1.5
   Compiling regex-syntax v0.8.11
   Compiling anstream v1.0.0
   Compiling nix v0.30.1
   Compiling nix v0.31.3
   Compiling strsim v0.11.1
   Compiling clap_lex v1.1.1
   Compiling crossbeam-deque v0.8.8
   Compiling heck v0.5.0
   Compiling bstr v1.13.1
   Compiling block2 v0.6.2
   Compiling log v0.4.34
   Compiling syn v3.0.9
   Compiling regex-automata v0.4.18
   Compiling same-file v1.0.6
   Compiling anyhow v1.0.104
   Compiling walkdir v2.5.0
   Compiling bitflags v1.3.2
   Compiling once_cell v1.21.4
   Compiling jiff-core v0.1.1
   Compiling nu-ansi-term v0.50.3
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling lscolors v0.21.0
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling argmax v0.4.0
   Compiling jiff v0.2.38
   Compiling ctrlc v3.5.2
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling ignore v0.4.34
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-2)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.06s

```

#### fd-ordinary-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-2 --without-optimization
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-2",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-ordinary-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-3
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling proc-macro2 v1.0.107
   Compiling memchr v2.8.3
   Compiling rustix v1.1.6
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling crossbeam-utils v0.8.23
   Compiling cfg-if v1.0.5
   Compiling objc2 v0.6.5
   Compiling utf8parse v0.2.2
   Compiling anstyle v1.0.14
   Compiling anstyle-parse v1.0.0
   Compiling objc2-encode v4.1.0
   Compiling regex-syntax v0.8.11
   Compiling anstyle-query v1.1.5
   Compiling is_terminal_polyfill v1.70.2
   Compiling colorchoice v1.0.5
   Compiling aho-corasick v1.1.5
   Compiling crossbeam-epoch v0.9.21
   Compiling anstream v1.0.0
   Compiling nix v0.30.1
   Compiling nix v0.31.3
   Compiling heck v0.5.0
   Compiling crossbeam-deque v0.8.8
   Compiling strsim v0.11.1
   Compiling clap_lex v1.1.1
   Compiling block2 v0.6.2
   Compiling syn v3.0.9
   Compiling regex-automata v0.4.18
   Compiling bstr v1.13.1
   Compiling log v0.4.34
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling jiff-core v0.1.1
   Compiling once_cell v1.21.4
   Compiling bitflags v1.3.2
   Compiling nu-ansi-term v0.50.3
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling lscolors v0.21.0
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling argmax v0.4.0
   Compiling faccess v0.2.4
   Compiling jiff v0.2.38
   Compiling terminal_size v0.4.4
   Compiling ctrlc v3.5.2
   Compiling clap_builder v4.6.7
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling ignore v0.4.34
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-3)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 5.82s

```

#### fd-ordinary-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-3 --without-optimization
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/ordinary-3",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### fd-parallel-build-0.log

```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/optimized-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.73s

```

#### fd-parallel-build-1.log

```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.08s

```

#### fd-parallel-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create parallel-check
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/parallel-check",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### fd-unchanged-behavior.log

```text
$ /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/parallel-check/target/debug/fd --version
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd/.faster-rust-evaluation/parallel-check
fd 10.5.2

```

#### fd-warm.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/fd
   Compiling libc v0.2.191
   Compiling bitflags v2.13.2
   Compiling cfg_aliases v0.2.2
   Compiling memchr v2.8.3
   Compiling proc-macro2 v1.0.107
   Compiling crossbeam-utils v0.8.23
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
   Compiling rustix v1.1.6
   Compiling utf8parse v0.2.2
   Compiling objc2 v0.6.5
   Compiling cfg-if v1.0.5
   Compiling anstyle-parse v1.0.0
   Compiling colorchoice v1.0.5
   Compiling is_terminal_polyfill v1.70.2
   Compiling crossbeam-epoch v0.9.21
   Compiling objc2-encode v4.1.0
   Compiling anstyle v1.0.14
   Compiling aho-corasick v1.1.5
   Compiling regex-syntax v0.8.11
   Compiling anstyle-query v1.1.5
   Compiling anstream v1.0.0
   Compiling nix v0.31.3
   Compiling nix v0.30.1
   Compiling heck v0.5.0
   Compiling clap_lex v1.1.1
   Compiling crossbeam-deque v0.8.8
   Compiling strsim v0.11.1
   Compiling bstr v1.13.1
   Compiling regex-automata v0.4.18
   Compiling syn v3.0.9
   Compiling block2 v0.6.2
   Compiling log v0.4.34
   Compiling same-file v1.0.6
   Compiling anyhow v1.0.104
   Compiling nu-ansi-term v0.50.3
   Compiling walkdir v2.5.0
   Compiling once_cell v1.21.4
   Compiling bitflags v1.3.2
   Compiling jiff-core v0.1.1
   Compiling lscolors v0.21.0
   Compiling crossbeam-channel v0.5.17
   Compiling etcetera v0.11.0
   Compiling normpath v1.5.2
   Compiling errno v0.3.14
   Compiling dispatch2 v0.3.1
   Compiling faccess v0.2.4
   Compiling jiff v0.2.38
   Compiling argmax v0.4.0
   Compiling globset v0.4.21
   Compiling regex v1.13.1
   Compiling terminal_size v0.4.4
   Compiling clap_builder v4.6.7
   Compiling ignore v0.4.34
   Compiling ctrlc v3.5.2
   Compiling clap_derive v4.6.7
   Compiling clap v4.6.7
   Compiling clap_complete v4.6.11
   Compiling fd-find v10.5.2 (/private/tmp/faster-rust-projects-_iugra2x/fd)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.41s

```

#### ripgrep-changed-behavior.log

```text
$ /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-1/target/debug/rg --version
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-1
faster-rust-evaluation-changed
ripgrep 15.2.0 (rev 79caf8d76f)

features:-pcre2
simd(compile):+NEON
simd(runtime):+NEON

PCRE2 is not available in this build of ripgrep.

```

#### ripgrep-independence-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/parallel-check
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.03s

```

#### ripgrep-optimized-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-1
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.04s

```

#### ripgrep-optimized-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-1
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-1",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-2
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.04s

```

#### ripgrep-optimized-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-2
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-2",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-3
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.04s

```

#### ripgrep-optimized-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create optimized-3
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-3",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-optimized-version.log

```text
$ /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-1/target/debug/rg --version
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-1
ripgrep 15.2.0 (rev 79caf8d76f)

features:-pcre2
simd(compile):+NEON
simd(runtime):+NEON

PCRE2 is not available in this build of ripgrep.

```

#### ripgrep-ordinary-1-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling log v0.4.33
   Compiling libc v0.2.189
   Compiling serde_core v1.0.229
   Compiling cfg-if v1.0.4
   Compiling crossbeam-utils v0.8.22
   Compiling zmij v1.0.23
   Compiling serde v1.0.229
   Compiling serde_json v1.0.151
   Compiling encoding_rs v0.8.35
   Compiling crossbeam-epoch v0.9.20
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1/crates/matcher)
   Compiling crossbeam-deque v0.8.7
   Compiling itoa v1.0.18
   Compiling termcolor v1.4.1
   Compiling encoding_rs_io v0.1.8
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1)
   Compiling lexopt v0.3.2
   Compiling textwrap v0.16.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.62s

```

#### ripgrep-ordinary-1-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-1 --without-optimization
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-1",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-ordinary-2-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling log v0.4.33
   Compiling libc v0.2.189
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling cfg-if v1.0.4
   Compiling crossbeam-utils v0.8.22
   Compiling serde_json v1.0.151
   Compiling serde v1.0.229
   Compiling encoding_rs v0.8.35
   Compiling crossbeam-epoch v0.9.20
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2/crates/matcher)
   Compiling itoa v1.0.18
   Compiling termcolor v1.4.1
   Compiling crossbeam-deque v0.8.7
   Compiling encoding_rs_io v0.1.8
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling regex-automata v0.4.18
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2)
   Compiling textwrap v0.16.2
   Compiling lexopt v0.3.2
   Compiling memmap2 v0.9.11
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.33s

```

#### ripgrep-ordinary-2-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-2 --without-optimization
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-2",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-ordinary-3-build.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling log v0.4.33
   Compiling libc v0.2.189
   Compiling serde_core v1.0.229
   Compiling crossbeam-utils v0.8.22
   Compiling zmij v1.0.23
   Compiling cfg-if v1.0.4
   Compiling serde_json v1.0.151
   Compiling serde v1.0.229
   Compiling encoding_rs v0.8.35
   Compiling crossbeam-epoch v0.9.20
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3/crates/matcher)
   Compiling termcolor v1.4.1
   Compiling itoa v1.0.18
   Compiling crossbeam-deque v0.8.7
   Compiling encoding_rs_io v0.1.8
   Compiling same-file v1.0.6
   Compiling anyhow v1.0.104
   Compiling walkdir v2.5.0
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3)
   Compiling regex-automata v0.4.18
   Compiling memmap2 v0.9.11
   Compiling lexopt v0.3.2
   Compiling textwrap v0.16.2
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.61s

```

#### ripgrep-ordinary-3-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create ordinary-3 --without-optimization
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/ordinary-3",
  "decisions": [
    "target: --without-optimization"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-parallel-build-0.log

```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/optimized-1)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.27s

```

#### ripgrep-parallel-build-1.log

```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.05s

```

#### ripgrep-parallel-create.log

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/.agents/worktree/extract-worktree-tool-3/packages/worktree_tools/src/run.mjs create parallel-check
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep
{
  "worktreePath": "/private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/parallel-check",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 0
}

```

#### ripgrep-unchanged-behavior.log

```text
$ /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/parallel-check/target/debug/rg --version
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep/.faster-rust-evaluation/parallel-check
ripgrep 15.2.0 (rev 79caf8d76f)

features:-pcre2
simd(compile):+NEON
simd(runtime):+NEON

PCRE2 is not available in this build of ripgrep.

```

#### ripgrep-warm.log

```text
$ cargo build --locked
Working directory: /private/tmp/faster-rust-projects-_iugra2x/ripgrep
   Compiling memchr v2.8.3
   Compiling regex-syntax v0.8.11
   Compiling log v0.4.33
   Compiling libc v0.2.189
   Compiling serde_core v1.0.229
   Compiling crossbeam-utils v0.8.22
   Compiling zmij v1.0.23
   Compiling cfg-if v1.0.4
   Compiling serde_json v1.0.151
   Compiling crossbeam-epoch v0.9.20
   Compiling encoding_rs v0.8.35
   Compiling serde v1.0.229
   Compiling aho-corasick v1.1.5
   Compiling grep-matcher v0.1.9 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/crates/matcher)
   Compiling encoding_rs_io v0.1.8
   Compiling crossbeam-deque v0.8.7
   Compiling termcolor v1.4.1
   Compiling regex-automata v0.4.18
   Compiling itoa v1.0.18
   Compiling anyhow v1.0.104
   Compiling same-file v1.0.6
   Compiling walkdir v2.5.0
   Compiling ripgrep v15.2.0 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep)
   Compiling memmap2 v0.9.11
   Compiling lexopt v0.3.2
   Compiling textwrap v0.16.2
   Compiling bstr v1.13.0
   Compiling globset v0.4.21 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/crates/globset)
   Compiling grep-searcher v0.1.17 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/crates/searcher)
   Compiling grep-regex v0.1.14 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/crates/regex)
   Compiling grep-printer v0.3.1 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/crates/printer)
   Compiling grep-cli v0.1.12 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/crates/cli)
   Compiling ignore v0.4.34 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/crates/ignore)
   Compiling grep v0.4.1 (/private/tmp/faster-rust-projects-_iugra2x/ripgrep/crates/grep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.69s

```
