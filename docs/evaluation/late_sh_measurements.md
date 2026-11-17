# late-sh measurements and project size comparison

- Created: 17 November 2026
- Last updated: 17 November 2026
- Status: Measured release-build evidence
- Related framing: [Repository instructions](../../AGENTS.md)
- Related rules: [Docs folder system](../../.agents/skills/docs_folder_system/SKILL.md), [Folder constraints](../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)

## Scope

The larger application late-sh is measured first in the [README comparison](../../README.md#the-difference-measured). The existing [ripgrep and fd timing evaluation](evaluation.md) and [one- and ten-worktree storage evaluation](space_measurements.md) remain unchanged historical measurements.

The late-sh command is its documented standalone release build, `cargo build --release --bin late`, with `--locked --offline` added for repeatable worktree runs. The original checkout was built first using the same command without `--offline`. Initial compilation and dependency downloads are excluded from both cases. The original build in the one-worktree trial took 137.045 seconds. All worktrees in a comparison use identical source, lockfile, compiler, arguments, and environment. No application code was changed.

The earlier ripgrep and fd results use debug builds. The method is comparable within each project; the profiles and project sizes differ, so absolute build times across projects are not a controlled comparison of project complexity. The late-sh benchmark builds its native terminal binary, not its complete workspace or deployed services. The benchmark does not exercise application operation or source changes.

## Source and environment

- [late-sh measured source](https://github.com/mpiorowski/late-sh/commit/fba35bc78dd906523897927e236fd0adb869e911).
- [fd measured source](https://github.com/sharkdp/fd/commit/6cf330283cfdcd1b8a6100beec7375bbb58975a3).
- [ripgrep measured source](https://github.com/BurntSushi/ripgrep/commit/178cc027e283fd965cb72d0a7395b219eada170c).
- [Faster Rust Work Trees measured source](https://github.com/jeromeetienne/faster-rust-worktrees/commit/11ebe3b59b5a746979ecee2972eed07554d8ae95); tool implementation unchanged throughout.
- macOS 26.2, arm64, rustc 1.96.1, Cargo 1.96.1, Node.js 24.14.0.
- Shared tool invoked directly through `node <tool-checkout>/packages/worktree_tools/src/run.mjs`.
- `CARGO_TARGET_DIR` unset; output is checkout-local `target/`.
- Python `/usr/bin/python3` was used for measurement because Homebrew Python could not load its XML library. This does not change the Cargo commands or tool implementation.
- Receiving configuration and the nested-worktree ignore rule were committed only in the disposable checkout before warming the build. No changes were published to the measured projects.

## One-worktree timing and storage

Three runs per case. Each run starts with the original checkout built, creates one worktree, completes the first release build, measures allocated storage, then removes that worktree. The order was ordinary then optimized in repetitions one and three, reversed in repetition two. Times are process wall time; medians of individual columns need not sum to the median of totals.

| Measurement | Ordinary | Optimized | Reduction |
|---|---:|---:|---:|
| Creation | 1.020 s | 4.842 s | Creation alone takes longer |
| First release build | 127.157 s | 1.010 s | 99.2% |
| Creation plus first build | 128.132 s | 5.852 s | 95.4% |
| Added allocated storage | 3,511.652 MB | 84.431 MB | 97.6% |
| Compiled crates | 466 | 0 | 466 fewer |

MB means 1,000,000 bytes. Storage excludes the already-built original checkout and shared Cargo download caches. Creation plus build is 21.9 times as fast; added allocation is about 1/41.6 of ordinary allocation.

### Raw one-worktree readings

```json
[
  {
    "mode": "ordinary",
    "repeat": 1,
    "creationSeconds": 1.226092125000008,
    "buildSeconds": 126.268252292,
    "totalSeconds": 127.49434441700001,
    "compiledCrates": 466,
    "beforeBytes": 3709952000,
    "afterBytes": 7215824896,
    "addedBytes": 3505872896
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "creationSeconds": 4.8418940419999785,
    "buildSeconds": 1.009659958000043,
    "totalSeconds": 5.8515540000000215,
    "compiledCrates": 0,
    "beforeBytes": 3706245120,
    "afterBytes": 3790639104,
    "addedBytes": 84393984
  },
  {
    "mode": "optimized",
    "repeat": 2,
    "creationSeconds": 4.110591666000005,
    "buildSeconds": 0.6641921249999996,
    "totalSeconds": 4.774783791000004,
    "compiledCrates": 0,
    "beforeBytes": 3706204160,
    "afterBytes": 3790635008,
    "addedBytes": 84430848
  },
  {
    "mode": "ordinary",
    "repeat": 2,
    "creationSeconds": 0.9746154169999954,
    "buildSeconds": 127.15716837500003,
    "totalSeconds": 128.13178379200002,
    "compiledCrates": 466,
    "beforeBytes": 3706195968,
    "afterBytes": 7217848320,
    "addedBytes": 3511652352
  },
  {
    "mode": "ordinary",
    "repeat": 3,
    "creationSeconds": 1.019652457999996,
    "buildSeconds": 127.45333279099998,
    "totalSeconds": 128.47298524899998,
    "compiledCrates": 466,
    "beforeBytes": 3706208256,
    "afterBytes": 7232139264,
    "addedBytes": 3525931008
  },
  {
    "mode": "optimized",
    "repeat": 3,
    "creationSeconds": 5.18952845900003,
    "buildSeconds": 1.0605868750000127,
    "totalSeconds": 6.250115334000043,
    "compiledCrates": 0,
    "beforeBytes": 3706220544,
    "afterBytes": 3790655488,
    "addedBytes": 84434944
  }
]
```

## Physical storage method

All late-sh measurements run inside isolated sparse disk images formatted with Apple File System. The one-worktree trial used a 40 GiB image. At each checkpoint, `sync` is followed by three `diskutil info -plist <volume>` readings 0.2 seconds apart. Allocated bytes are `APFSContainerSize - APFSContainerFree`, taking the median. Added allocation is the post-build reading minus the immediately preceding built-original baseline. Shared blocks are counted once; file-system metadata is included.

Summed folder sizes and retained sparse-image backing-file allocation are not used as worktree space measurements. The isolated container avoids unrelated host-volume writes, but allocation settling and metadata variation remain possible. Within-checkpoint spread is not a full uncertainty bound. Registry/download caches and the shared tool installation remain outside the measurement volume.

### Calibration

Writing 33,554,432 random bytes added exactly 33,554,432 allocated bytes. A real macOS `clonefile` clone added zero allocated bytes; an independent streamed copy added another 33,554,432 bytes. Raw counter readings:

```json
{
  "before": [
    3706220544,
    3706220544,
    3706220544
  ],
  "source": [
    3739774976,
    3739774976,
    3739774976
  ],
  "clone": [
    3739774976,
    3739774976,
    3739774976
  ],
  "copy": [
    3773329408,
    3773329408,
    3773329408
  ]
}
```

### Raw optimized creation and build output

The first optimized worktree reported:

```text
$ node /Users/jetienne/webwork/faster-rust-worktrees/packages/worktree_tools/src/run.mjs create optimized-1
Working directory: /private/tmp/late-sh-benchmark-volume/late-sh
{
  "worktreePath": "/private/tmp/late-sh-benchmark-volume/late-sh/.benchmark-worktrees/optimized-1",
  "decisions": [
    "target: copy-on-write cloned"
  ],
  "rewrittenRecords": 10
}

```

Its Cargo build reported:

```text
$ cargo build --release --bin late --locked --offline
Working directory: /private/tmp/late-sh-benchmark-volume/late-sh/.benchmark-worktrees/optimized-1
    Finished `release` profile [optimized] target(s) in 0.95s

```

All three optimized creations reported a copy-on-write clone and ten relocated build-script records. All three optimized builds compiled zero crates. Ordinary builds compiled 466 crates each.

## Ten-worktree time and storage

One complete paired run, with ten built worktrees retained together in each case. The same pinned late-sh source, tool implementation, compiler, and release command were used as in the one-worktree trial. The new run used a 64 GiB sparse Apple File System image. The original checkout was built once before measurement in 131.577 seconds; this initial build is excluded. Worktrees were created and built sequentially, with no overlapping builds. Timing totals sum creation and build process wall times, excluding sampling and removal.

The following values are from the first complete paired ten-worktree run, not estimates multiplied from one worktree:

| Measurement | Ordinary | Optimized | Reduction |
|---|---:|---:|---:|
| Ten creations plus first builds | 1319.335 s | 54.450 s | 95.9% |
| Added allocated storage | 34,982.830 MB | 846.008 MB | 97.6% |
| Main checkout plus ten worktrees, excluding empty-volume overhead | 38,580.019 MB | 4,427.485 MB | — |
| Compiled crates per worktree | 466 | 0 | 466 fewer |

All ten ordinary worktrees in this paired run compiled 466 crates each. All ten optimized worktrees compiled zero crates; every optimized creation reported a copy-on-write clone. Checkpoints after the first and tenth build record actual simultaneous retained worktree counts. The one-worktree README numbers retain the earlier dedicated one-worktree trial; the new first-worktree checkpoints below show variation between trials rather than replacing those results.

Largest within-checkpoint allocation spread in the ten-worktree trial: 147,456 bytes. After each case, only its disposable worktrees and branches were removed. The next case starts from a new built-original allocation baseline. Sparse-image allocation counters include metadata and can vary slightly between runs; the sample spread alone is not a complete error bound. The planned additional repetitions were stopped at the developer's request. A second optimized case had completed (846,024,704 added bytes, 52.820 seconds), but its ordinary counterpart was interrupted. That unpaired case and the partial ordinary case are excluded from these comparison values. Unlike the one-worktree medians, the ten-worktree comparison has one complete paired run.

### Raw ten-worktree trial readings

```json
[
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktrees": 1,
    "emptyBytes": 120934400,
    "baselineBytes": 3718123520,
    "afterBytes": 7214993408,
    "addedBytes": 3496869888,
    "totalProjectBytes": 7094059008,
    "compiledCratesPerWorktree": [
      466
    ],
    "totalSeconds": 131.315578416
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktrees": 10,
    "emptyBytes": 120934400,
    "baselineBytes": 3718123520,
    "afterBytes": 38700953600,
    "addedBytes": 34982830080,
    "totalProjectBytes": 38580019200,
    "compiledCratesPerWorktree": [
      466,
      466,
      466,
      466,
      466,
      466,
      466,
      466,
      466,
      466
    ],
    "totalSeconds": 1319.3353779160004
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktrees": 1,
    "emptyBytes": 120934400,
    "baselineBytes": 3702411264,
    "afterBytes": 3786964992,
    "addedBytes": 84553728,
    "totalProjectBytes": 3666030592,
    "compiledCratesPerWorktree": [
      0
    ],
    "totalSeconds": 6.221342249999907
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktrees": 10,
    "emptyBytes": 120934400,
    "baselineBytes": 3702411264,
    "afterBytes": 4548419584,
    "addedBytes": 846008320,
    "totalProjectBytes": 4427485184,
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
    "totalSeconds": 54.45043299900021
  }
]
```

### Per-worktree timings and compilation counts

```json
[
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 1,
    "creationSeconds": 1.240214750000007,
    "buildSeconds": 130.075363666,
    "totalSeconds": 131.315578416,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 2,
    "creationSeconds": 1.1150973750000048,
    "buildSeconds": 127.72729837500003,
    "totalSeconds": 128.84239575000004,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 3,
    "creationSeconds": 1.0558619999999905,
    "buildSeconds": 131.50714570800005,
    "totalSeconds": 132.56300770800004,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 4,
    "creationSeconds": 1.2577265830000215,
    "buildSeconds": 131.30227924999997,
    "totalSeconds": 132.560005833,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 5,
    "creationSeconds": 1.1235704169999963,
    "buildSeconds": 127.97835337499998,
    "totalSeconds": 129.10192379199998,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 6,
    "creationSeconds": 1.0542419160000236,
    "buildSeconds": 134.06213445899994,
    "totalSeconds": 135.11637637499996,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 7,
    "creationSeconds": 1.2103828750000503,
    "buildSeconds": 126.3605557080001,
    "totalSeconds": 127.57093858300016,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 8,
    "creationSeconds": 1.1439420830001836,
    "buildSeconds": 130.24959754199995,
    "totalSeconds": 131.39353962500013,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 9,
    "creationSeconds": 1.085490166999989,
    "buildSeconds": 131.6348714170001,
    "totalSeconds": 132.7203615840001,
    "compiledCrates": 466
  },
  {
    "mode": "ordinary",
    "repeat": 1,
    "worktree": 10,
    "creationSeconds": 1.1501274580000427,
    "buildSeconds": 137.00112279199993,
    "totalSeconds": 138.15125024999998,
    "compiledCrates": 466
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 1,
    "creationSeconds": 5.108965583999861,
    "buildSeconds": 1.1123766660000456,
    "totalSeconds": 6.221342249999907,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 2,
    "creationSeconds": 4.292983583000023,
    "buildSeconds": 0.6762727499999528,
    "totalSeconds": 4.969256332999976,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 3,
    "creationSeconds": 4.211172208000107,
    "buildSeconds": 0.6947157080001034,
    "totalSeconds": 4.905887916000211,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 4,
    "creationSeconds": 4.6285883330001525,
    "buildSeconds": 0.6781366249999792,
    "totalSeconds": 5.306724958000132,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 5,
    "creationSeconds": 4.30629841699988,
    "buildSeconds": 0.674466041000187,
    "totalSeconds": 4.980764458000067,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 6,
    "creationSeconds": 4.384962500000029,
    "buildSeconds": 0.667907416999924,
    "totalSeconds": 5.052869916999953,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 7,
    "creationSeconds": 4.390672083000027,
    "buildSeconds": 2.0338365000000067,
    "totalSeconds": 6.4245085830000335,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 8,
    "creationSeconds": 4.883446499999991,
    "buildSeconds": 0.7364036250000936,
    "totalSeconds": 5.6198501250000845,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 9,
    "creationSeconds": 4.981931833999852,
    "buildSeconds": 0.6752275829999235,
    "totalSeconds": 5.657159416999775,
    "compiledCrates": 0
  },
  {
    "mode": "optimized",
    "repeat": 1,
    "worktree": 10,
    "creationSeconds": 4.657093583000005,
    "buildSeconds": 0.6549754590000703,
    "totalSeconds": 5.312069042000076,
    "compiledCrates": 0
  }
]
```

### Reproduce the ten-worktree trial

Use the linked upstream revision. The harness below points to the current tool executable, `packages/faster_rust_worktrees/src/cli_launcher.mjs`; replace machine-specific paths before running. To reproduce the historical tool revision exactly, use the linked measured tool checkout and its original executable, `packages/worktree_tools/src/run.mjs`, instead. Historical command logs above retain the paths used at measurement time. The harness is limited to one repetition. The same setup and Cargo output are used for both cases; common Cargo caches remain outside the image. Raw command logs and property lists are saved outside the disposable volume.

```bash
hdiutil create -size 64g -fs APFS -type SPARSE -volname LateShTenBenchmark /private/tmp/late-sh-ten-benchmark.sparseimage
hdiutil attach -nobrowse -mountpoint /private/tmp/late-sh-ten-volume /private/tmp/late-sh-ten-benchmark.sparseimage
/usr/bin/python3 /private/tmp/late-sh-ten-benchmark.py
```

<details>
<summary>Ten-worktree measurement harness, limited to one paired run</summary>

```python
import pathlib, subprocess, os, time, json, statistics, plistlib, shutil
volume=pathlib.Path('/private/tmp/late-sh-ten-volume');root=volume/'late-sh'
evidence=pathlib.Path('/private/tmp/late-sh-ten-evidence');evidence.mkdir(exist_ok=True)
tool='/Users/jetienne/webwork/faster-rust-worktrees/packages/faster_rust_worktrees/src/cli_launcher.mjs'
env=dict(os.environ);env.pop('CARGO_TARGET_DIR',None);env['CARGO_TERM_COLOR']='never'
rows=[];samples=[];builds=[]
def run(args,cwd,label):
 start=time.monotonic()
 with (evidence/(label+'.log')).open('w') as out:
  out.write('$ '+' '.join(map(str,args))+'\nWorking directory: '+str(cwd)+'\n');out.flush()
  p=subprocess.run(list(map(str,args)),cwd=cwd,env=env,stdout=out,stderr=subprocess.STDOUT)
 elapsed=time.monotonic()-start;output=(evidence/(label+'.log')).read_text();print(label,'exit',p.returncode,'seconds',round(elapsed,3),flush=True)
 if p.returncode:print(output[-6000:],flush=True);raise RuntimeError(label)
 return elapsed,output

def sample(label):
 subprocess.run(['sync'],check=True);values=[]
 for i in range(3):
  raw=subprocess.check_output(['diskutil','info','-plist',str(volume)]);info=plistlib.loads(raw)
  assert info['VolumeName']=='LateShTenBenchmark'
  (evidence/(label+f'-{i}.plist')).write_bytes(raw)
  values.append(info['APFSContainerSize']-info['APFSContainerFree']);time.sleep(.2)
 result={'label':label,'usedBytes':int(statistics.median(values)),'samples':values,'spreadBytes':max(values)-min(values)}
 samples.append(result);(evidence/'samples.json').write_text(json.dumps(samples,indent=2));print('SPACE',json.dumps(result),flush=True);return result['usedBytes']

(volume/'.metadata_never_index').touch();empty=sample('empty')
run(['git','clone','--no-hardlinks','/private/tmp/faster-rust-late-sh-trial',root],volume,'clone')
config={'baseRef':'HEAD','worktreeDirectory':'.benchmark-worktrees','targetDirectories':['target'],'cargoCommands':[{'cwd':'.','argv':['cargo','build','--release','--bin','late','--locked','--offline']}]}
(root/'faster-rust-worktrees.json').write_text(json.dumps(config,indent=2))
with (root/'.gitignore').open('a') as f:f.write('\n/.benchmark-worktrees/\n')
run(['git','add','faster-rust-worktrees.json','.gitignore'],root,'config-add')
run(['git','-c','user.name=Local benchmark','-c','user.email=benchmark@example.invalid','commit','-qm','Local ten worktree benchmark configuration'],root,'config-commit')
run(['cargo','metadata','--no-deps','--format-version','1'],root,'metadata')
run(config['cargoCommands'][0]['argv'],root,'warm-build')
shutil.copyfile(root/'faster-rust-worktrees.json',evidence/'configuration.json')
for repeat in range(1,2):
 for mode in (['ordinary','optimized'] if repeat!=2 else ['optimized','ordinary']):
  label=f'{mode}-{repeat}';before=sample(label+'-baseline');compiles=[];paths=[];total=0
  for count in range(1,11):
   name=f'{label}-{count}';args=['node',tool,'create',name]
   if mode=='ordinary':args+=['--without-optimization']
   create,output=run(args,root,name+'-create')
   if mode=='optimized':assert 'copy-on-write cloned' in output
   wt=root/'.benchmark-worktrees'/name;paths.append(wt)
   build,output=run(config['cargoCommands'][0]['argv'],wt,name+'-build')
   compiled=sum(line.lstrip().startswith('Compiling ') for line in output.splitlines());compiles.append(compiled)
   if mode=='optimized':assert compiled==0
   total+=create+build
   builds.append({'mode':mode,'repeat':repeat,'worktree':count,'creationSeconds':create,'buildSeconds':build,'totalSeconds':create+build,'compiledCrates':compiled})
   (evidence/'builds.json').write_text(json.dumps(builds,indent=2))
   if count in [1,10]:
    after=sample(name+'-built');row={'mode':mode,'repeat':repeat,'worktrees':count,'emptyBytes':empty,'baselineBytes':before,'afterBytes':after,'addedBytes':after-before,'totalProjectBytes':after-empty,'compiledCratesPerWorktree':compiles.copy(),'totalSeconds':total}
    rows.append(row);(evidence/'results.json').write_text(json.dumps(rows,indent=2));print('RESULT',json.dumps(row),flush=True)
  for wt in paths:
   run(['git','worktree','remove','--force',wt],root,wt.name+'-remove');run(['git','branch','-D',wt.name],root,wt.name+'-branch-remove')
  sample(label+'-after-removal')
print('COMPLETE',flush=True)

```

</details>

After saving the evidence, detach the owned volume and remove its sparse image. The build output inside the disposable image is not retained.

## Rust source line counts

cloc 2.06 counts tracked `.rs` files at each measured upstream revision, excluding any file with a `vendor` path component. `--skip-uniqueness` counts every tracked file, including identical files. `--timeout=0` prevents large files being silently omitted. Code lines exclude comments and blanks; tests, examples, generated files if tracked, and all workspace members remain included. Dependencies outside the repository are excluded.

| Project | Rust files | Code lines | Comment lines | Blank lines |
|---|---:|---:|---:|---:|
| late-sh | 1,794 | 579,109 | 71,382 | 46,378 |
| ripgrep | 102 | 37,752 | 12,453 | 5,307 |
| fd | 25 | 7,179 | 948 | 1,126 |

These counts describe source repositories, not the amount of source compiled into each measured binary. The late-sh release command selects the `late` binary; source counts include its other workspace members. Code line counts are context for scale, not an explanation of build time or a universal measure of complexity.

Reproduce from each pinned checkout:

```python
import pathlib, subprocess
root = pathlib.Path.cwd()
files = subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0')
files = [name for name in files if name.endswith('.rs')
         and 'vendor' not in pathlib.PurePosixPath(name).parts]
listing = pathlib.Path('/private/tmp/rust-source-files.txt')
listing.write_text(''.join(str(root / name) + '\n' for name in files))
subprocess.run(['cloc', '--list-file=' + str(listing), '--include-lang=Rust',
                '--skip-uniqueness', '--timeout=0', '--json'], check=True)
```

## One-worktree reproduction

Create and mount the isolated image before running the harness. The `tool` path below uses the current executable; for the historical measured tool revision, use its original executable as explained in the ten-worktree reproduction section. Point the local clone path at late-sh pinned to the linked source revision. The harness writes logs outside the measurement volume. Ordinary creation uses the same tool with `--without-optimization`; optimized creation must explicitly report a copy-on-write clone.

```bash
hdiutil create -size 40g -fs APFS -type SPARSE -volname LateShBenchmark /private/tmp/late-sh-benchmark.sparseimage
hdiutil attach -nobrowse -mountpoint /private/tmp/late-sh-benchmark-volume /private/tmp/late-sh-benchmark.sparseimage
/usr/bin/python3 /private/tmp/late-sh-benchmark.py
```

<details>
<summary>Executed one-worktree measurement harness</summary>

```python
import pathlib, subprocess, os, time, json, statistics, plistlib
volume=pathlib.Path('/private/tmp/late-sh-benchmark-volume'); root=volume/'late-sh'
evidence=pathlib.Path('/private/tmp/late-sh-benchmark-evidence'); evidence.mkdir(exist_ok=True)
tool='/Users/jetienne/webwork/faster-rust-worktrees/packages/faster_rust_worktrees/src/cli_launcher.mjs'
env=dict(os.environ); env.pop('CARGO_TARGET_DIR',None); env['CARGO_TERM_COLOR']='never'
def run(args,cwd,label):
 start=time.monotonic()
 with (evidence/(label+'.log')).open('w') as out:
  out.write('$ '+' '.join(args)+'\nWorking directory: '+str(cwd)+'\n');out.flush()
  p=subprocess.run(args,cwd=cwd,env=env,stdout=out,stderr=subprocess.STDOUT)
 elapsed=time.monotonic()-start; output=(evidence/(label+'.log')).read_text()
 print(label,'exit',p.returncode,'seconds',round(elapsed,3),flush=True)
 if p.returncode: print(output[-6000:],flush=True);raise RuntimeError(label)
 return elapsed,output
run(['git','clone','--no-hardlinks','/private/tmp/faster-rust-late-sh-trial',str(root)],volume,'clone')
(root/'faster-rust-worktrees.json').write_text(json.dumps({'baseRef':'HEAD','worktreeDirectory':'.benchmark-worktrees','targetDirectories':['target'],'cargoCommands':[{'cwd':'.','argv':['cargo','build','--release','--bin','late','--locked','--offline']}]}))
with (root/'.gitignore').open('a') as f:f.write('\n/.benchmark-worktrees/\n')
run(['git','add','faster-rust-worktrees.json','.gitignore'],root,'config-add')
run(['git','-c','user.name=Local benchmark','-c','user.email=benchmark@example.invalid','commit','-qm','Local benchmark configuration'],root,'config-commit')
run(['cargo','metadata','--no-deps','--format-version','1'],root,'metadata')
run(['cargo','build','--release','--bin','late','--locked'],root,'warm-build')
def sample(label):
 subprocess.run(['sync'],check=True); vals=[]
 for _ in range(3):
  info=plistlib.loads(subprocess.check_output(['diskutil','info','-plist',str(volume)]));vals.append(info['APFSContainerSize']-info['APFSContainerFree']);time.sleep(.2)
 (evidence/(label+'-space.json')).write_text(json.dumps(vals));return statistics.median(vals)
rows=[]
for repeat in range(1,4):
 for mode in (['ordinary','optimized'] if repeat!=2 else ['optimized','ordinary']):
  name=f'{mode}-{repeat}'; before=sample(name+'-before');args=['node',tool,'create',name]
  if mode=='ordinary':args+=['--without-optimization']
  create,output=run(args,root,name+'-create')
  if mode=='optimized' and 'copy-on-write cloned' not in output:raise RuntimeError('No clone')
  wt=root/'.benchmark-worktrees'/name
  build,output=run(['cargo','build','--release','--bin','late','--locked','--offline'],wt,name+'-build');after=sample(name+'-after')
  row={'mode':mode,'repeat':repeat,'creationSeconds':create,'buildSeconds':build,'totalSeconds':create+build,'compiledCrates':sum(line.lstrip().startswith('Compiling ') for line in output.splitlines()),'beforeBytes':before,'afterBytes':after,'addedBytes':after-before}
  rows.append(row);(evidence/'results.json').write_text(json.dumps(rows,indent=2));print(json.dumps(row),flush=True)
  run(['git','worktree','remove','--force',str(wt)],root,name+'-remove');run(['git','branch','-D',name],root,name+'-branch-remove')
print('COMPLETE',flush=True)

```

</details>
