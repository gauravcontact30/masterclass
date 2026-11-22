"""Download translation weights only. No application lessons are read or uploaded."""
from pathlib import Path
from urllib.request import urlopen, Request
import json
root = Path('.local-tools/hindi-model-indic').resolve()
root.mkdir(parents=True, exist_ok=True)
repo='adalat-ai/ct2-rotary-indictrans2-en-indic-dist-200M'
metadata=json.load(urlopen(Request('https://huggingface.co/api/models/'+repo,headers={'User-Agent':'MasterClass-local-translation-setup'}),timeout=60))
revision=metadata['sha']
allowed={'config.json','model.bin','source.spm','target.spm','model.SRC','model.TGT','sentencepiece.bpe.model','shared_vocabulary.json','source_vocabulary.json','target_vocabulary.json','README.md'}
for entry in metadata['siblings']:
    remote=entry['rfilename']
    name=remote.rsplit('/',1)[-1]
    if name not in allowed: continue
    target=root/name
    if target.exists() and target.stat().st_size>0: continue
    url='https://huggingface.co/'+repo+'/resolve/'+revision+'/'+remote
    with urlopen(Request(url,headers={'User-Agent':'MasterClass-local-translation-setup'}),timeout=120) as source, (root/(name+'.part')).open('wb') as output:
        while chunk:=source.read(1024*1024): output.write(chunk)
    (root/(name+'.part')).replace(target)
    print('Downloaded',name,flush=True)
(root/'source.json').write_text(json.dumps({'repository':repo,'revision':revision,'original':'AI4Bharat/IndicTrans2'},indent=2),encoding='utf-8')
if not (root/'model.bin').exists(): raise RuntimeError('Model weights missing')
print('Local model ready.',flush=True)
