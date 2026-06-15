from pathlib import Path
from PIL import Image, ImageDraw


def make_frame(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = max(2, size // 9)
    gap = max(1, size // 14)
    bar_w = (size - 2 * pad - 2 * gap) // 3
    bottom = size - pad
    avail_h = size - 2 * pad
    radius = max(1, bar_w // 3)

    bars = [
        (0.50, (0, 150, 199),  (72, 202, 228)),
        (0.72, (0, 119, 182),  (0, 150, 199)),
        (1.00, (2,  62, 138),  (0, 119, 182)),
    ]

    x = pad
    for frac, c_top, c_bot in bars:
        bar_h = int(avail_h * frac)
        y0 = bottom - bar_h
        y1 = bottom
        for row in range(y0, y1):
            t = (row - y0) / max(bar_h - 1, 1)
            r = int(c_top[0] + (c_bot[0] - c_top[0]) * t)
            g = int(c_top[1] + (c_bot[1] - c_top[1]) * t)
            b = int(c_top[2] + (c_bot[2] - c_top[2]) * t)
            x0_clipped = x
            x1_clipped = x + bar_w - 1
            if row < y0 + radius:
                inset = radius - (row - y0)
                x0_clipped = x + inset
                x1_clipped = x + bar_w - 1 - inset
            if x0_clipped <= x1_clipped:
                draw.line([(x0_clipped, row), (x1_clipped, row)], fill=(r, g, b, 255))
        x += bar_w + gap

    return img


sizes = [16, 32, 48, 256]
frames = [make_frame(s) for s in sizes]
out = Path(__file__).parent / "toolbi.ico"
frames[0].save(
    out,
    format="ICO",
    sizes=[(s, s) for s in sizes],
    append_images=frames[1:],
)
print(f"Icon written to {out}")
