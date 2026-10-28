from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

W, H = 1280, 720
FONT_DIR = r"C:\Windows\Fonts"
FONT_REG = os.path.join(FONT_DIR, "msyh.ttc")
FONT_BOLD = os.path.join(FONT_DIR, "msyhbd.ttc")
OUT = "framenote/demo/slides"
os.makedirs(OUT, exist_ok=True)

slides = [
    {
        "kicker": "VISUAL STORYTELLING · 03",
        "title": "花卉摄影的\n5 个构图技巧",
        "sub": "从随手拍到作品感",
        "note": "光屿课堂 · 林见",
        "accent": (183, 243, 74),
        "bg": [(17, 17, 15), (28, 33, 22)],
        "bullets": [],
        "num": "01",
    },
    {
        "kicker": "TECHNIQUE 01 · 减法",
        "title": "先做减法",
        "sub": "让主体只占画面的一部分，把注意力留给它。",
        "note": "一张照片只能有一个主角。",
        "accent": (183, 243, 74),
        "bg": [(18, 18, 16), (35, 42, 27)],
        "bullets": ["移走背景杂物", "用大光圈虚化", "裁掉不必要的边缘"],
        "num": "02",
    },
    {
        "kicker": "TECHNIQUE 02 · 三分法",
        "title": "三分法不是万能药",
        "sub": "把主体放在交叉点附近，画面会更松弛。",
        "note": "但对称、居中，也有自己的力量。",
        "accent": (215, 255, 135),
        "bg": [(20, 20, 16), (48, 52, 35)],
        "bullets": ["交叉点放主体", "留出视线方向", "打破规则前先理解规则"],
        "num": "03",
    },
    {
        "kicker": "TECHNIQUE 03 · 层次",
        "title": "用前景制造呼吸感",
        "sub": "一片虚化的叶子，就能让画面从平面变成空间。",
        "note": "前景不是遮挡，是邀请。",
        "accent": (183, 243, 74),
        "bg": [(17, 22, 16), (35, 49, 28)],
        "bullets": ["靠近镜头的前景", "低机位穿过花丛", "虚化而不抢戏"],
        "num": "04",
    },
    {
        "kicker": "TECHNIQUE 04 · 引导",
        "title": "寻找自然的引导线",
        "sub": "让视线从画面边缘，慢慢走进主体。",
        "note": "枝条、叶脉、栅栏，都可以是线。",
        "accent": (200, 255, 98),
        "bg": [(18, 18, 16), (40, 46, 30)],
        "bullets": ["从边缘进入", "线条指向主体", "避免穿过主体的杂线"],
        "num": "05",
    },
    {
        "kicker": "TECHNIQUE 05 · 光线",
        "title": "逆光，让花瓣透亮",
        "sub": "轮廓光会把主体从背景里轻轻托起来。",
        "note": "构图不是规则，是你决定让观看者先看什么。",
        "accent": (183, 243, 74),
        "bg": [(18, 18, 15), (47, 53, 34)],
        "bullets": ["侧逆光出轮廓", "点测光保住高光", "让光斑成为背景"],
        "num": "06",
    },
]

def font(path, size):
    return ImageFont.truetype(path, size)

def gradient(bg):
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    top, bottom = bg
    for y in range(H):
        t = y / (H - 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (W, y)], fill=color)
    return img

for idx, s in enumerate(slides):
    img = gradient(s["bg"]).convert("RGBA")
    # subtle radial glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r in range(520, 0, -8):
        alpha = int(26 * (1 - r / 520) ** 1.6)
        gd.ellipse((1000 - r, 80 - r, 1000 + r, 80 + r), fill=(s["accent"][0], s["accent"][1], s["accent"][2], alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(26))
    img = Image.alpha_composite(img, glow)

    d = ImageDraw.Draw(img)
    accent = s["accent"] + (255,)
    # top brand
    d.rounded_rectangle((64, 48, 118, 102), radius=15, fill=accent)
    d.polygon([(82, 64), (82, 86), (102, 75)], fill=(26, 23, 40, 255))
    d.text((132, 58), "光屿课堂", font=font(FONT_BOLD, 24), fill=(255, 255, 255, 235))
    d.text((132, 87), "VISUAL STORYTELLING", font=font(FONT_REG, 12), fill=(255, 255, 255, 120))
    d.text((W - 64, 62), s["num"], font=font(FONT_BOLD, 44), fill=(255, 255, 255, 45), anchor="ra")

    # kicker
    d.text((64, 156), s["kicker"], font=font(FONT_BOLD, 16), fill=accent)

    # title lines
    y = 206
    title_size = 72 if "\n" not in s["title"] else 70
    f_title = font(FONT_BOLD, title_size)
    for line in s["title"].split("\n"):
        d.text((64, y), line, font=f_title, fill=(255, 255, 255, 245))
        y += int(title_size * 1.22)

    # subtitle
    d.text((66, y + 14), s["sub"], font=font(FONT_REG, 25), fill=(255, 255, 255, 175))
    y += 82

    # bullets
    for i, bullet in enumerate(s["bullets"]):
        bx = 68
        by = y + i * 48
        d.ellipse((bx, by + 11, bx + 9, by + 20), fill=accent)
        d.text((bx + 24, by), bullet, font=font(FONT_REG, 23), fill=(255, 255, 255, 205))

    # note pill bottom
    if s["note"]:
        f_note = font(FONT_REG, 20)
        tw = d.textlength(s["note"], font=f_note)
        d.rounded_rectangle((64, H - 94, 64 + tw + 44, H - 48), radius=12, fill=(42, 34, 56), outline=(94, 82, 114), width=1)
        d.text((86, H - 82), s["note"], font=f_note, fill=(255, 255, 255, 200))

    # decorative frame lines
    d.line([(64, H - 34), (W - 64, H - 34)], fill=(255, 255, 255, 30), width=1)
    d.text((W - 64, H - 46), "FRAMENOTE · 视频学习示例", font=font(FONT_REG, 11), fill=(255, 255, 255, 90), anchor="ra")

    img.convert("RGB").save(os.path.join(OUT, f"slide{idx + 1}.png"), quality=95)
    print("slide", idx + 1)
