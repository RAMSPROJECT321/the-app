#!/usr/bin/env python3
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageColor, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = ROOT / "assets"

COLORS = {
    "background": "#09141F",
    "blue": "#1D8FFF",
    "cyan": "#26E5BF",
    "coral": "#FF7A59",
    "amber": "#FFC44D",
    "cream": "#FFF7ED",
    "navy": "#10233A",
    "ring": "#8CEBFF",
}


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    return (*ImageColor.getrgb(hex_color), alpha)


def add_glow(
    image: Image.Image,
    bbox: tuple[float, float, float, float],
    color: tuple[int, int, int, int],
    blur: int,
) -> None:
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse(tuple(int(value) for value in bbox), fill=color)
    image.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def add_arc(
    image: Image.Image,
    bbox: tuple[float, float, float, float],
    color: tuple[int, int, int, int],
    width: int,
    start: int,
    end: int,
) -> None:
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.arc(tuple(int(value) for value in bbox), start=start, end=end, fill=color, width=width)
    image.alpha_composite(layer)


def diagonal_gradient(size: int, start: str, end: str) -> Image.Image:
    start_rgb = ImageColor.getrgb(start)
    end_rgb = ImageColor.getrgb(end)
    gradient = Image.new("RGBA", (size, size))
    pixels = gradient.load()

    for y in range(size):
        for x in range(size):
            factor = (x + y) / (2 * (size - 1))
            pixels[x, y] = tuple(
                int(start_rgb[channel] + (end_rgb[channel] - start_rgb[channel]) * factor)
                for channel in range(3)
            ) + (255,)

    return gradient


def star_points(cx: float, cy: float, outer: float, inner: float) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []

    for index in range(8):
        angle = math.radians(-90 + index * 45)
        radius = outer if index % 2 == 0 else inner
        points.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))

    return points


def make_background(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), rgba(COLORS["background"]))
    width = max(4, size // 96)

    add_glow(
        image,
        (-size * 0.22, -size * 0.08, size * 0.48, size * 0.62),
        rgba(COLORS["coral"], 220),
        blur=max(12, size // 7),
    )
    add_glow(
        image,
        (size * 0.18, size * 0.10, size * 0.88, size * 0.80),
        rgba(COLORS["blue"], 90),
        blur=max(12, size // 6),
    )
    add_glow(
        image,
        (size * 0.52, size * 0.48, size * 1.10, size * 1.05),
        rgba(COLORS["cyan"], 180),
        blur=max(12, size // 6),
    )
    add_glow(
        image,
        (size * 0.34, size * 0.20, size * 0.76, size * 0.62),
        rgba(COLORS["cream"], 24),
        blur=max(8, size // 10),
    )

    add_arc(
        image,
        (size * 0.09, size * 0.12, size * 0.90, size * 0.92),
        rgba(COLORS["ring"], 80),
        width,
        214,
        372,
    )
    add_arc(
        image,
        (size * 0.17, size * 0.20, size * 0.82, size * 0.85),
        rgba(COLORS["cream"], 54),
        width,
        198,
        358,
    )
    add_arc(
        image,
        (size * 0.26, size * 0.04, size * 0.98, size * 0.76),
        rgba(COLORS["cyan"], 34),
        width,
        266,
        394,
    )

    draw = ImageDraw.Draw(image)
    dot = max(6, size // 48)
    draw.ellipse(
        (size * 0.20, size * 0.80, size * 0.20 + dot, size * 0.80 + dot),
        fill=rgba(COLORS["cream"], 160),
    )
    draw.ellipse(
        (size * 0.77, size * 0.18, size * 0.77 + dot, size * 0.18 + dot),
        fill=rgba(COLORS["cyan"], 150),
    )
    return image


def make_tile_layer(size: int, include_shadow: bool) -> Image.Image:
    tile_size = int(size * (0.46 if size >= 900 else 0.56))
    canvas_size = int(tile_size * 1.9)
    tile_canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))

    tile = diagonal_gradient(tile_size, COLORS["coral"], COLORS["amber"])
    mask = Image.new("L", (tile_size, tile_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = int(tile_size * 0.24)
    mask_draw.rounded_rectangle((0, 0, tile_size, tile_size), radius=radius, fill=255)

    shaped_tile = Image.new("RGBA", (tile_size, tile_size), (0, 0, 0, 0))
    shaped_tile.paste(tile, (0, 0), mask)

    tile_draw = ImageDraw.Draw(shaped_tile)
    highlight = Image.new("RGBA", (tile_size, tile_size), (0, 0, 0, 0))
    add_glow(
        highlight,
        (tile_size * 0.02, tile_size * 0.00, tile_size * 0.68, tile_size * 0.64),
        rgba(COLORS["cream"], 150),
        blur=max(10, tile_size // 8),
    )
    shaped_tile.alpha_composite(highlight)

    shadow = Image.new("RGBA", (tile_size, tile_size), (0, 0, 0, 0))
    add_glow(
        shadow,
        (tile_size * 0.16, tile_size * 0.58, tile_size * 0.92, tile_size * 1.08),
        rgba("#000000", 80),
        blur=max(8, tile_size // 10),
    )
    shaped_tile.alpha_composite(shadow)

    border = max(2, tile_size // 72)
    tile_draw.rounded_rectangle(
        (border // 2, border // 2, tile_size - border // 2, tile_size - border // 2),
        radius=radius,
        outline=rgba(COLORS["cream"], 80),
        width=border,
    )

    mark = rgba(COLORS["navy"])
    tile_draw.rounded_rectangle(
        (
            tile_size * 0.17,
            tile_size * 0.18,
            tile_size * 0.83,
            tile_size * 0.34,
        ),
        radius=int(tile_size * 0.09),
        fill=mark,
    )
    tile_draw.rounded_rectangle(
        (
            tile_size * 0.43,
            tile_size * 0.18,
            tile_size * 0.57,
            tile_size * 0.80,
        ),
        radius=int(tile_size * 0.08),
        fill=mark,
    )

    inset_x = (canvas_size - tile_size) // 2
    inset_y = (canvas_size - tile_size) // 2
    tile_canvas.alpha_composite(shaped_tile, (inset_x, inset_y))
    rotated = tile_canvas.rotate(-14, resample=Image.Resampling.BICUBIC, expand=False)

    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    top = int((size - canvas_size) / 2 - size * 0.02)
    left = int((size - canvas_size) / 2)

    if include_shadow:
        shadow_base = Image.new("RGBA", rotated.size, rgba("#02060B", 180))
        shadow_alpha = rotated.getchannel("A").point(lambda value: int(value * 0.55))
        shadow_base.putalpha(shadow_alpha)
        shadow_blur = shadow_base.filter(ImageFilter.GaussianBlur(max(14, size // 28)))
        layer.alpha_composite(shadow_blur, (left, top + max(8, size // 28)))

    layer.alpha_composite(rotated, (left, top))

    draw = ImageDraw.Draw(layer)
    cx = int(size * 0.72)
    cy = int(size * 0.31)
    ring_radius = max(18, size // 18)
    ring_width = max(4, size // 96)
    draw.ellipse(
        (cx - ring_radius, cy - ring_radius, cx + ring_radius, cy + ring_radius),
        outline=rgba(COLORS["ring"], 180),
        width=ring_width,
    )
    draw.polygon(
        star_points(cx, cy, ring_radius * 0.48, ring_radius * 0.22),
        fill=rgba(COLORS["cream"], 240),
    )

    dot = max(8, size // 54)
    draw.ellipse(
        (
            cx + ring_radius + dot,
            cy - dot // 2,
            cx + ring_radius + dot * 2,
            cy + dot // 2,
        ),
        fill=rgba(COLORS["cream"], 210),
    )

    return layer


def make_monochrome(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    fill = rgba("#FFFFFF")

    draw.rounded_rectangle(
        (size * 0.17, size * 0.20, size * 0.83, size * 0.35),
        radius=int(size * 0.08),
        fill=fill,
    )
    draw.rounded_rectangle(
        (size * 0.43, size * 0.20, size * 0.57, size * 0.80),
        radius=int(size * 0.07),
        fill=fill,
    )
    return image


def save_image(image: Image.Image, name: str) -> None:
    image.save(ASSETS_DIR / name)


def main() -> None:
    background_1024 = make_background(1024)
    background_512 = make_background(512)
    foreground_1024 = make_tile_layer(1024, include_shadow=True)
    foreground_512 = make_tile_layer(512, include_shadow=False)

    icon = background_1024.copy()
    icon.alpha_composite(foreground_1024)

    save_image(icon, "icon.png")
    save_image(background_512, "android-icon-background.png")
    save_image(foreground_512, "android-icon-foreground.png")
    save_image(make_monochrome(432), "android-icon-monochrome.png")
    save_image(icon.resize((48, 48), Image.Resampling.LANCZOS), "favicon.png")
    save_image(make_tile_layer(1024, include_shadow=False), "splash-icon.png")


if __name__ == "__main__":
    main()
