from PIL import Image, ImageDraw
import math

S = 1024
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# rounded gradient background
mask = Image.new("L", (S, S), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.235), fill=255)

grad = Image.new("RGBA", (S, S))
gd = ImageDraw.Draw(grad)
c1 = (82, 78, 234)
c2 = (149, 76, 233)
for y in range(S):
    t = y / (S - 1)
    r = int(c1[0] + (c2[0] - c1[0]) * t)
    g = int(c1[1] + (c2[1] - c1[1]) * t)
    b = int(c1[2] + (c2[2] - c1[2]) * t)
    gd.line([(0, y), (S, y)], fill=(r, g, b, 255))
img.paste(grad, (0, 0), mask)

# soft highlight orb
glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
og = ImageDraw.Draw(glow)
og.ellipse((-260, -360, 720, 620), fill=(255, 255, 255, 32))
img = Image.alpha_composite(img, Image.composite(glow, Image.new("RGBA", (S, S), (0, 0, 0, 0)), mask))

d = ImageDraw.Draw(img)
# video frame outline
left, top, right, bottom = 206, 248, 818, 690
w = 34
d.rounded_rectangle((left, top, right, bottom), radius=74, outline=(255, 255, 255, 255), width=w)

# play triangle
cx, cy = 512, 469
size = 112
pts = [(cx - size * 0.55, cy - size), (cx - size * 0.55, cy + size), (cx + size * 0.95, cy)]
d.polygon(pts, fill=(255, 255, 255, 255))

# note lines / AI spark at lower right
# small note card
card = (628, 610, 858, 852)
d.rounded_rectangle(card, radius=46, fill=(255, 214, 102, 255))
line_color = (92, 67, 172, 255)
d.rounded_rectangle((676, 676, 810, 700), radius=12, fill=line_color)
d.rounded_rectangle((676, 732, 788, 756), radius=12, fill=line_color)
d.rounded_rectangle((676, 788, 744, 812), radius=12, fill=line_color)

# four point sparkle
def spark(cx, cy, r, color):
    pts = []
    for i in range(8):
        ang = math.pi / 4 * i - math.pi / 2
        rr = r if i % 2 == 0 else r * 0.28
        pts.append((cx + math.cos(ang) * rr, cy + math.sin(ang) * rr))
    d.polygon(pts, fill=color)

spark(840, 210, 92, (255, 226, 138, 255))
spark(906, 300, 42, (255, 255, 255, 220))

img.putalpha(Image.composite(mask, Image.new("L", (S, S), 0), Image.new("L", (S, S), 255)))
for size in (16, 32, 48, 128, 512):
    img.resize((size, size), Image.LANCZOS).save(f"framenote/assets/icon{size}.png")
print("icons written")
