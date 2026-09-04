import fitz
from pathlib import Path
src = Path('attached_assets/informasi_kontak_ppdb_1788508433525.pdf')
out = Path('.agents/outputs/contact-pdf')
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(src)
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    pix.save(out / f'page-{i+1}.png')
print(f'rendered {len(doc)} pages to {out}')
