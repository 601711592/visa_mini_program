"""从已核对的 Lucide 0.468.0 源矢量导出 PNG；运行需要 Python 3、Pillow 与 cairosvg。
仅开发期工具，不向小程序打包 DOM/SVG 脚本或增加运行依赖。
"""
import base64
import re
import json
import io
from PIL import Image
from pathlib import Path
import cairosvg
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/mall/design-icon-source.json'

def svg(body, stroke='1.65', fill='none'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="{fill}" stroke="#245B7A" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">{body}</svg>'

def compact_png(svg_source, size):
    raw = cairosvg.svg2png(bytestring=svg_source.encode(), output_width=size, output_height=size)
    rgba = Image.open(io.BytesIO(raw)).convert('RGBA')
    # 只压缩透明通道，不改变图标前景色；透明度最多相差 2/255。
    alpha = rgba.getchannel('A').point(lambda a: round(a / 4) * 4 if a < 252 else 255)
    levels = sorted(set(alpha.tobytes()))
    index = {value: number for number, value in enumerate(levels)}
    out = Image.new('P', rgba.size)
    out.putdata([index[a] for a in alpha.tobytes()])
    out.putpalette([36, 91, 122] * len(levels))
    target = io.BytesIO()
    out.save(target, format='PNG', optimize=True, transparency=bytes(levels))
    return target.getvalue()

def generate():
    definitions = json.loads(SOURCE.read_text())
    output = ROOT / 'src/static/mall'
    output.mkdir(parents=True, exist_ok=True)
    rasters = {}
    for name, body in definitions['paths'].items():
        png = compact_png(svg(body), 96)
        uri = 'data:image/png;base64,' + base64.b64encode(png).decode()
        # 相同前景色在 PNG 色表的 Base64 中重复；只压缩文本，展开后字节不变。
        rasters[name] = re.sub(r'(?:W3ok){3,}', lambda m: '~' + str(len(m.group()) // 4) + '~', uri)
    aliases = definitions['aliases']
    content = '// 由 scripts/generate-mall-icons.py 生成。每个图标独立 PNG，禁止改为近似图形。\n'
    content += '// Lucide 0.468.0 / ISC；源矢量、对应关系见 design-icon-source.json。\n'
    content += 'const rasters: Record<string, string> = ' + json.dumps(rasters, ensure_ascii=False, indent=2) + ';\n'
    content += 'const aliases: Record<string, string> = ' + json.dumps(aliases, ensure_ascii=False, indent=2) + ';\n'
    content += "export function designIcon(name: string): string { return (rasters[aliases[name] || name] || '').replace(/~(\\d+)~/g, (_, n) => 'W3ok'.repeat(Number(n))); }\n"
    (ROOT / 'src/mall/design-icons.ts').write_text(content)
    for name, canonical in {'home':'house', 'grid':'layout-grid', 'user':'user-round'}.items():
        for active in [False, True]:
            data = svg(definitions['paths'][canonical], '1.5' if active else '1.6', '#245B7A' if active else 'none')
            (output/f'{name}{"-active" if active else ""}.png').write_bytes(compact_png(data, 81))
    print(f'Exported {len(rasters)} independent icons and 6 native-tab PNGs.')

if __name__ == '__main__':
    generate()
