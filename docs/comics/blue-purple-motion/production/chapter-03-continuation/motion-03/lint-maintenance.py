"""Non-behavioral cleanup; preserve exact source snapshots used by existing proofs."""
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
edits = {
    'lot-a/build.cjs': [(',p=key=>data.panels.find(p=>p.panelKey===key),', ',_p=key=>data.panels.find(p=>p.panelKey===key),')],
    'lot-b/build-candidates.cjs': [('crypto=require(', '_crypto=require('), ('strength:.6,frequency:.5,phase:0', 'strength:.6,phase:0')],
    'lot-c/build-candidates.cjs': [('[art,original,base,final,letters,...markers]', '[art,original,base,_final,letters,...markers]')],
    'lot-c/review-candidate.cjs': [('async({time,url})=>', 'async({time,url:_url})=>')],
    'qa-cross/review-lot-b.cjs': [(',core=require(', ',_core=require(')],
    'timing/build-contract.cjs': [('{applyTiming,getTiming,PROFILE,SPECIAL}', '{applyTiming:_applyTiming,getTiming,PROFILE,SPECIAL}')],
}
report = HERE / 'LINT-MAINTENANCE.json'
if report.exists():
    raise FileExistsError(report)
snapshot_dir = HERE / 'tool-snapshots-before-lint'
snapshot_dir.mkdir(exist_ok=False)
entries = []
for relative, substitutions in edits.items():
    source = HERE / relative
    before = source.read_bytes()
    value = before.decode('utf-8')
    for old, new in substitutions:
        if value.count(old) != 1:
            raise ValueError(f'Expected one occurrence in {relative}: {old}')
        value = value.replace(old, new)
    snapshot = snapshot_dir / (relative.replace('/', '--') + '.txt')
    snapshot.write_bytes(before)
    after = value.encode('utf-8')
    source.write_bytes(after)
    entries.append({'file': relative, 'beforeSha256': hashlib.sha256(before).hexdigest(),
                    'afterSha256': hashlib.sha256(after).hexdigest(),
                    'exactSourceUsedByPriorProof': str(snapshot.relative_to(HERE)).replace(chr(92), '/')})
report.write_text(json.dumps({'status': 'completed', 'changes': entries,
    'reason': 'Unused identifiers renamed; first duplicate frequency removed, retaining the identical effective last value. No selected media/manifest/runtime or frozen timing helper changed. Exact source snapshots retained for dated proof hashes.',
    'timingHelpers': 'retime.cjs and retime-v1.cjs remain byte-exact; scoped lint accepts only the unused callback index.'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'files': len(entries), 'report': str(report)}))
