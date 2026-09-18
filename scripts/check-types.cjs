/* 比较相同依赖下的基线与当前诊断，不把历史类型错误误报为本轮新增。 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const root = process.cwd(), baseSha = 'cb25781561fda5424a75b591bcccadfbb8e8e477';
const temp = path.join(os.tmpdir(), 'mall-type-baseline-' + process.pid);
const out = path.join(root, 'artifacts');fs.mkdirSync(out, { recursive: true });
function run(cwd) {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/vue-tsc/bin/vue-tsc.js'), '--noEmit', '--pretty', 'false'], { cwd, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (result.error) throw result.error;
  const text = (result.stdout || '') + (result.stderr || '');
  const errors = [...text.matchAll(/^(.+?)\(\d+,\d+\): error (TS\d+): (.+)$/gm)].map(match => match[1].replaceAll('\\', '/') + ' ' + match[2] + ' ' + match[3]);
  if (result.status && !errors.length) throw new Error('类型检查工具未正常执行:\n' + text);
  return { text, errors };
}
try {
  execFileSync('git', ['worktree', 'add', '--detach', temp, baseSha], { stdio: 'pipe' });
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const baseline = run(temp), current = run(root), counts = new Map();
  baseline.errors.forEach(error => counts.set(error, (counts.get(error) || 0) + 1));
  const added = current.errors.filter(error => { const count = counts.get(error) || 0; if (count) { counts.set(error, count - 1); return false; } return true; });
  fs.writeFileSync(path.join(out, 'types-baseline.txt'), baseline.text);
  fs.writeFileSync(path.join(out, 'types-current.txt'), current.text);
  const report = { baseSha, baseline: baseline.errors.length, current: current.errors.length, added };
  fs.writeFileSync(path.join(out, 'types-summary.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (added.length) process.exitCode = 1;
} finally { try { execFileSync('git', ['worktree', 'remove', '--force', temp], { stdio: 'pipe' }); } catch {} }
