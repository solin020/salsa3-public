import os
import json
with open('rxcui_ndc_links.json') as f:
    rxcui_ndc_links = json.load(f)

oldpath = os.getcwd()
os.chdir(os.path.dirname(os.path.realpath(__file__)))
lines_dict = {}
txt_dict = {}
for f in os.listdir('./micromedex'):
    fstart, fend = f.split('.')
    if fend == 'txt':
        with open(f'micromedex/{fstart}.{fend}') as g:
            txt_dict[fstart] = g.read()
    elif fend == 'lines':
        with open(f'micromedex/{fstart}.{fend}') as g:
            lines_dict[fstart] = [gg.strip() for gg in list(g) if gg.strip()]

os.chdir(oldpath)

def search(rxcui):
    rxcodes = rxcui_ndc_links.get(rxcui, None)
    if not rxcodes:
        return None
    for fstart, searchcodes in lines_dict.items():
        if any(code in searchcodes for code in rxcodes):
            return txt_dict[fstart]
    return None
