"""
Server-side PDF rendering for SPM analysis reports.

Charts are drawn with matplotlib (Agg) and assembled with reportlab. This replaces
an earlier attempt that screenshotted the live DOM with html2pdf in the browser —
that put page buttons into the PDF, forced a download, and varied with the viewer's
browser and zoom. Rendering from data on the server is deterministic and testable.

The visual specification of record is ui/spm.html. Each renderer names the line
range it mirrors; if the screen changes, change the renderer to match.

Threading note: this module uses Figure + FigureCanvasAgg directly and never
pyplot. pyplot keeps global figure state that is not safe when rendering runs in a
threadpool, which is how the endpoints call it. Do not reintroduce `import
matplotlib.pyplot`.
"""

from __future__ import annotations

import os
from io import BytesIO
from typing import Any, Dict, List, Optional, Sequence, Tuple

# Must precede the matplotlib import: without a writable config dir matplotlib logs
# a warning and rebuilds its font cache on first render, which is slow on the server.
os.environ.setdefault("MPLCONFIGDIR", "/tmp/mplconfig")

try:
    import matplotlib

    matplotlib.use("Agg")
    from matplotlib.figure import Figure
    from matplotlib.backends.backend_agg import FigureCanvasAgg
    from matplotlib.ticker import FuncFormatter
    from matplotlib.lines import Line2D
    from matplotlib.patches import Patch

    matplotlib.rcParams["font.family"] = "DejaVu Sans"
    matplotlib.rcParams["axes.unicode_minus"] = False
    HAVE_MPL = True
except ImportError:  # pragma: no cover - degrade like RTIS app.py:83-91
    Figure = None
    HAVE_MPL = False

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        CondPageBreak, Image as RLImage, KeepTogether, PageBreak, Paragraph,
        SimpleDocTemplate, Spacer, Table, TableStyle,
    )
    HAVE_RL = True
except ImportError:  # pragma: no cover
    SimpleDocTemplate = None
    HAVE_RL = False

from report_model import normalise_distances

# --- palette, lifted from the ECharts options so both stay in step ------------

PSR_GREEN = "#00c800"
SPEED_NAVY = "#0b3d91"          # #chart and #brakeFeelChart
SEG_BLUE = "#007bff"            # segment charts use a different blue
MARK_GREY = "#888888"
STATION_GREEN = "#00cc00"
STATION_GREEN_EDGE = "#009900"
STATION_RED = "#ff0000"
STATION_RED_EDGE = "#cc0000"
VIOLATION_RED = "#ff0000"
BFT_RED = "#ff0000"

# ui/spm.html:1120-1125
SEVERITY_COLORS = {
    "minor": "#FFA500",
    "moderate": "#FF6B00",
    "severe": "#FF0000",
    "critical": "#8B0000",
}

# ui/spm.html:1445
PE_PALETTE = [
    "#4285f4", "#ea4335", "#fbbc05", "#34a853", "#9c27b0",
    "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7",
]

STATION_LINE_SPEED_THRESHOLD = 45


def _new_figure(width_in: float, height_in: float, dpi: int) -> Tuple[Any, Any]:
    fig = Figure(figsize=(width_in, height_in), dpi=dpi)
    FigureCanvasAgg(fig)
    return fig, fig.add_subplot(111)


def _to_png(fig: Any) -> BytesIO:
    buf = BytesIO()
    fig.savefig(buf, format="PNG", facecolor="white")
    buf.seek(0)
    return buf


def _style_axes(ax: Any, *, xlabel: str = "", ylabel: str = "") -> None:
    ax.tick_params(labelsize=6)
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    ax.grid(True, alpha=0.15, linewidth=0.5)
    ax.set_axisbelow(True)
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=7)
    if ylabel:
        ax.set_ylabel(ylabel, fontsize=7)


def _sample_values(samples: Sequence[Dict[str, Any]], key: str) -> List[Any]:
    return [s.get(key) for s in samples]


def _distance_ticks(ax: Any, distances_km: Sequence[float], count: int = 10) -> None:
    """
    Label a categorical (index) x-axis with distances.

    The charts plot against sample index, not distance, because every station
    markLine is positioned by sample_index (ui/spm.html:2406-2416). ECharts thins
    thousands of category labels automatically; matplotlib does not, so decimate.
    """
    n = len(distances_km)
    if n == 0:
        return
    step = max(1, n // max(1, count))
    ticks = list(range(0, n, step))
    if ticks[-1] != n - 1:
        ticks.append(n - 1)
    ax.set_xticks(ticks)
    ax.set_xticklabels([f"{distances_km[i]:.2f}" for i in ticks], rotation=45, ha="right")


def _psr_series(samples: Sequence[Dict[str, Any]]) -> Optional[List[Optional[float]]]:
    """Extract the PSR column, unwrapping the list form seen at main.py:1315-1317."""
    out: List[Optional[float]] = []
    seen = False
    for s in samples:
        v = s.get("psr")
        if isinstance(v, (list, tuple)):
            v = next((x for x in v if x is not None), None)
        if v is not None:
            seen = True
            out.append(float(v))
        else:
            out.append(None)
    return out if seen else None


def _draw_psr_band(ax: Any, xs: Sequence[int], psr: Sequence[Optional[float]]) -> None:
    """
    ECharts draws PSR as a line with areaStyle, which fills to zero.
    fill_between(x, 0, psr) is the exact equivalent; `where` reproduces the gaps
    left by connectNulls:false.
    """
    ys = [v if v is not None else float("nan") for v in psr]
    mask = [v is not None for v in psr]
    ax.fill_between(xs, 0, ys, where=mask, color=PSR_GREEN, alpha=0.25,
                    linewidth=0, zorder=1, interpolate=False)
    ax.plot(xs, ys, color=PSR_GREEN, linewidth=1, zorder=1)


def _draw_station_marklines(
    ax: Any, markers: Sequence[Dict[str, Any]], *, offset: int = 0,
    limit: Optional[int] = None, fontsize: float = 6,
) -> None:
    """Dashed vertical per station, label rotated inside the top (insideEndTop)."""
    top = ax.get_ylim()[1]
    for marker in markers:
        idx = marker.get("sample_index")
        if idx is None:
            continue
        x = idx - offset
        if x < 0 or (limit is not None and x > limit):
            continue
        ax.axvline(x, color=MARK_GREY, linestyle="--", linewidth=1, zorder=4)
        ax.text(x, top * 0.98, str(marker.get("station", "")), rotation=90,
                va="top", ha="right", fontsize=fontsize, color="#333333",
                bbox=dict(facecolor="white", edgecolor="none", alpha=0.85, pad=1),
                zorder=5)


def _draw_bft_spans(
    ax: Any, brake_tests: Sequence[Dict[str, Any]], *, offset: int = 0,
    limit: Optional[int] = None, alpha: float = 0.10, label: bool = False,
) -> bool:
    drawn = False
    for test in brake_tests or []:
        start = test.get("start_index")
        end = test.get("end_index")
        if start is None or end is None:
            continue
        a, b = start - offset, end - offset
        if limit is not None:
            a, b = max(0, a), min(limit, b)
        if b <= a:
            continue
        ax.axvspan(a, b, color=BFT_RED, alpha=alpha, zorder=0)
        if label:
            ax.text((a + b) / 2, ax.get_ylim()[1] * 0.9, "BFT", color="#cc0000",
                    ha="center", fontsize=8, fontweight="bold", zorder=6)
        drawn = True
    return drawn


# --- 1. Platform Entry Overview (the hand-drawn SVG) --------------------------

def render_station_line(station_line: Sequence[Dict[str, Any]]) -> Optional[BytesIO]:
    """
    Port of createRailwayLine (ui/spm.html:2199-2288), which draws raw SVG.

    Works in SVG user units: figsize 10.5x1.5 at dpi 100 gives exactly the 1050x150
    viewBox, and the y-axis is inverted so the SVG's "smaller y is higher" arithmetic
    transfers unchanged. Distances are used raw — the renderer scales by max, so
    metres vs km cancels.
    """
    if not HAVE_MPL or not station_line:
        return None

    fig = Figure(figsize=(10.5, 1.5), dpi=100)
    FigureCanvasAgg(fig)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_axis_off()
    ax.set_xlim(0, 1050)
    ax.set_ylim(150, 0)          # inverted: matches SVG coordinates

    ax.plot([30, 1020], [75, 75], color="#333333", linewidth=2.5, zorder=1)

    max_distance = max((s.get("distance") or 0) for s in station_line) or 1

    for index, stop in enumerate(station_line):
        x = (stop.get("distance") or 0) / max_distance * 990 + 30
        speed = stop.get("speed") or 0
        within = speed <= STATION_LINE_SPEED_THRESHOLD
        face = STATION_GREEN if within else STATION_RED
        edge = STATION_GREEN_EDGE if within else STATION_RED_EDGE

        # SVG r=6 -> diameter 12 user units; at 100 units/inch that is 8.64 pt.
        ax.plot(x, 75, marker="o", markersize=8.64, markerfacecolor=face,
                markeredgecolor=edge, markeredgewidth=1.5, zorder=3)

        name = str(stop.get("station", "")).replace("Entry", "").strip()
        above = index % 2 == 0
        name_y, speed_y = (55, 67) if above else (107, 119)

        ax.text(x, name_y, name, fontsize=7.2, color="#0b3d91",
                fontweight="semibold", ha="center", va="center")
        ax.text(x, speed_y, f"{speed:.0f}", fontsize=7.2, fontweight="bold",
                color="#00aa00" if within else "#cc0000", ha="center", va="center")

    return _to_png(fig)


# --- 2. Speed Profile ---------------------------------------------------------

def render_speed_profile(
    samples: Sequence[Dict[str, Any]],
    station_markers: Sequence[Dict[str, Any]],
    brake_tests: Sequence[Dict[str, Any]],
    violations: Sequence[Dict[str, Any]],
) -> Optional[BytesIO]:
    """Port of the #chart ECharts option (ui/spm.html:2366-2519)."""
    if not HAVE_MPL or not samples:
        return None

    fig, ax = _new_figure(10, 3.6, 150)
    xs = list(range(len(samples)))
    speeds = [float(s.get("speed") or 0) for s in samples]
    distances_km, _ = normalise_distances(_sample_values(samples, "cumulative_distance"))

    psr = _psr_series(samples)
    handles: List[Any] = []

    if psr:
        _draw_psr_band(ax, xs, psr)
        handles.append(Patch(facecolor=PSR_GREEN, alpha=0.25, edgecolor=PSR_GREEN,
                             label="MPS/PSR"))

    ax.plot(xs, speeds, color=SPEED_NAVY, linewidth=2, zorder=2)
    handles.append(Line2D([], [], color=SPEED_NAVY, linewidth=2, label="Actual Speed"))

    ax.set_ylim(bottom=0)
    _draw_station_marklines(ax, station_markers)

    if _draw_bft_spans(ax, brake_tests):
        handles.append(Patch(facecolor=BFT_RED, alpha=0.10, edgecolor="none",
                             label="Brake Feel Test"))

    vx = [v.get("index") for v in violations or [] if v.get("index") is not None]
    vx = [i for i in vx if 0 <= i < len(speeds)]
    if vx:
        ax.scatter(vx, [speeds[i] for i in vx], s=18, color=VIOLATION_RED, zorder=6)
        handles.append(Line2D([], [], marker="o", linestyle="none", markersize=4,
                              color=VIOLATION_RED, label="Violations"))

    ax.set_title("Speed Profile with PSR/MPS Overlay" if psr else "Speed Profile",
                 fontsize=11, fontweight="bold", color=SPEED_NAVY)
    _style_axes(ax, xlabel="Cumulative Distance (km)", ylabel="Speed (km/h)")
    _distance_ticks(ax, distances_km)
    if handles:
        ax.legend(handles=handles, fontsize=7, loc="upper right", framealpha=0.9)

    fig.tight_layout()
    return _to_png(fig)


# --- 3. Segmented Speed Profiles ---------------------------------------------

def build_station_groups(
    markers: Sequence[Dict[str, Any]], chunk_size: int = 5
) -> List[List[Dict[str, Any]]]:
    """
    Literal port of buildStationGroups (ui/spm.html:1205-1238).

    Three details matter and are easy to lose:
      * the stride is chunk_size - 1, so consecutive groups SHARE one station;
      * a lone trailing station is merged backwards, not left as its own group;
      * groups of fewer than 2 are dropped at the end.
    """
    if not markers:
        return []

    ordered = sorted(markers, key=lambda m: m.get("sample_index") or 0)
    groups: List[List[Dict[str, Any]]] = []
    i = 0
    while i < len(ordered):
        end = min(i + chunk_size, len(ordered))
        group = ordered[i:end]

        if len(group) == 1 and groups:
            groups[-1] = groups[-1] + group
        else:
            groups.append(group)

        if len(group) >= 2:
            i += chunk_size - 1
        else:
            i = end

    if len(groups) > 1 and len(groups[-1]) == 1:
        tail = groups.pop()
        groups[-1] = groups[-1] + tail

    return [g for g in groups if len(g) >= 2]


def render_segment_charts(
    samples: Sequence[Dict[str, Any]],
    station_markers: Sequence[Dict[str, Any]],
    brake_tests: Sequence[Dict[str, Any]],
) -> List[Tuple[str, BytesIO]]:
    """
    Port of renderSegmentCharts (ui/spm.html:1241-1416).

    Returns [(caption, png)]. The caption is rendered by reportlab rather than
    matplotlib so the arrow uses the embedded DejaVu font.
    """
    if not HAVE_MPL or not samples:
        return []

    out: List[Tuple[str, BytesIO]] = []
    for index, group in enumerate(build_station_groups(station_markers)):
        start = group[0].get("sample_index") or 0
        end = group[-1].get("sample_index") or 0
        if end <= start:
            continue
        segment = samples[start:end + 1]
        if len(segment) < 2:
            continue

        fig, ax = _new_figure(10, 2.4, 110)
        xs = list(range(len(segment)))
        speeds = [float(s.get("speed") or 0) for s in segment]
        # The JS re-sniffs units per segment, so a short segment can decide
        # differently from the full run. Preserved deliberately.
        distances_km, _ = normalise_distances(
            _sample_values(segment, "cumulative_distance")
        )

        psr = _psr_series(segment)
        if psr:
            _draw_psr_band(ax, xs, psr)

        # Unlike #chart, the segment series carries its own areaStyle at 0.1.
        ax.fill_between(xs, 0, speeds, color=SEG_BLUE, alpha=0.1, linewidth=0, zorder=1)
        ax.plot(xs, speeds, color=SEG_BLUE, linewidth=2, marker="o", markersize=3,
                zorder=2)

        ax.set_ylim(bottom=0)
        _draw_station_marklines(ax, group, offset=start, limit=len(segment) - 1,
                                fontsize=5.5)
        _draw_bft_spans(ax, brake_tests, offset=start, limit=len(segment) - 1,
                        alpha=0.08)

        _style_axes(ax, ylabel="Speed (km/h)")
        _distance_ticks(ax, distances_km, count=8)
        fig.tight_layout()

        caption = (f"{index + 1}. {group[0].get('station', '')} → "
                   f"{group[-1].get('station', '')}")
        out.append((caption, _to_png(fig)))

    return out


# --- 4. Platform Entry Analysis ----------------------------------------------

def render_platform_entry_charts(
    samples: Sequence[Dict[str, Any]],
    station_markers: Sequence[Dict[str, Any]],
    platform_entry_data: Dict[str, Any],
) -> List[Tuple[str, BytesIO]]:
    """
    Port of renderPlatformEntryCharts (ui/spm.html:1420-1596).

    x is metres-from-halt on a real numeric axis, INVERTED so the halt sits at the
    right edge. y is clamped 0-50. Five stations per figure.
    """
    if not HAVE_MPL or not samples or not platform_entry_data:
        return []

    # A synthetic start-station marker carries platform_entry_speed 0.0
    # (main.py:1407-1414); the JS filters on `!== 0`, so must we.
    valid = [
        m for m in station_markers or []
        if m.get("platform_entry_speed") not in (None, 0)
        and platform_entry_data.get(m.get("station"))
    ]
    if not valid:
        return []

    distances = [s.get("cumulative_distance") or 0 for s in samples]
    # NOTE: 100, not the 200 used elsewhere (ui/spm.html:1440). Deliberate.
    in_metres = max(distances) > 100
    scale = 1000.0 if in_metres else 1.0

    series: List[Dict[str, Any]] = []
    for index, marker in enumerate(valid):
        station = marker.get("station")
        entry_data = platform_entry_data.get(station) or {}
        halt_km = entry_data.get("halt_distance")
        entry_km = entry_data.get("entry_distance")
        if halt_km is None or entry_km is None:      # main.py:998 allows None
            continue

        halt = halt_km * scale
        entry = entry_km * scale
        window = [s for s in samples
                  if entry <= (s.get("cumulative_distance") or 0) <= halt]
        if len(window) < 2:
            continue

        points: List[Tuple[float, float]] = []
        for s in window:
            from_halt = halt - (s.get("cumulative_distance") or 0)
            if from_halt < 0:
                break
            metres = from_halt if in_metres else from_halt * 1000
            points.append((round(metres), float(s.get("speed") or 0)))

        if points:
            series.append({"name": station, "points": points,
                           "color": PE_PALETTE[index % len(PE_PALETTE)]})

    if not series:
        return []

    out: List[Tuple[str, BytesIO]] = []
    per_chart = 5
    for group_no, start in enumerate(range(0, len(series), per_chart), start=1):
        chunk = series[start:start + per_chart]
        fig, ax = _new_figure(10, 2.8, 110)

        x_max = 0
        for item in chunk:
            xs = [p[0] for p in item["points"]]
            ys = [p[1] for p in item["points"]]
            x_max = max(x_max, max(xs) if xs else 0)
            ax.plot(xs, ys, color=item["color"], linewidth=2, label=item["name"])

        ax.set_ylim(0, 50)
        # Pin the right edge at exactly 0 (the halt) rather than invert_xaxis().
        ax.set_xlim(max(x_max, 140), 0)

        for at, text in ((130, "130m"), (20, "20m")):
            ax.axvline(at, color="#999999", linestyle="--", linewidth=1, zorder=1)
            ax.text(at, 48, text, fontsize=6, ha="right", va="top", color="#666666")

        # Explicit ticks: the auto-locator never lands on 20 or 130, so the special
        # labels would silently never appear (ui/spm.html:1585-1590).
        # Drop any evenly-spaced tick that would collide with the fixed 0/20/130
        # labels — without this a computed 132m overprints the 130m marker label.
        span = max(x_max, 140)
        fixed = {0, 20, 130}
        min_gap = span * 0.045
        spaced = {round(span * i / 5) for i in range(6)}
        spaced = {t for t in spaced
                  if all(abs(t - f) > min_gap for f in fixed)}
        ticks = sorted(fixed | spaced)
        ax.set_xticks([t for t in ticks if t <= span])
        ax.xaxis.set_major_formatter(FuncFormatter(
            lambda v, _pos: "Halt" if v == 0 else ("20m" if v == 20 else
                                                   ("130m" if v == 130 else f"{int(v)}m"))
        ))

        ax.set_title(f"Speed vs Distance - Group {group_no}", fontsize=9,
                     fontweight="bold", color=SPEED_NAVY)
        _style_axes(ax, xlabel="Distance", ylabel="Speed")
        ax.legend(fontsize=6, ncol=min(5, len(chunk)), loc="upper left", framealpha=0.9)
        fig.tight_layout()
        out.append((f"Speed vs Distance - Group {group_no}", _to_png(fig)))

    return out


# --- 5. Brake Feel Test -------------------------------------------------------

def render_brake_feel_chart(
    samples: Sequence[Dict[str, Any]],
    brake_tests: Sequence[Dict[str, Any]],
    first_halt_index: Optional[int],
) -> Optional[BytesIO]:
    """Port of renderBrakeFeelChart (ui/spm.html:1606-1724)."""
    if not HAVE_MPL or not samples:
        return None

    if first_halt_index:
        end = min(first_halt_index + 50, len(samples))
    else:
        end = min(int(len(samples) * 0.25), 500)
    end = max(end, 2)
    window = samples[:end]

    fig, ax = _new_figure(10, 2.8, 110)
    xs = list(range(len(window)))
    speeds = [float(s.get("speed") or 0) for s in window]
    distances_km, _ = normalise_distances(_sample_values(window, "cumulative_distance"))

    ax.plot(xs, speeds, color=SPEED_NAVY, linewidth=2, zorder=2)
    ax.set_ylim(bottom=0)

    handles = [Line2D([], [], color=SPEED_NAVY, linewidth=2, label="Speed")]
    if _draw_bft_spans(ax, brake_tests, limit=len(window) - 1, label=True):
        handles.append(Patch(facecolor=BFT_RED, alpha=0.10, edgecolor="none",
                             label="Brake Feel Test"))

    _style_axes(ax, xlabel="Cumulative Distance (km)", ylabel="Speed (km/h)")
    _distance_ticks(ax, distances_km, count=8)
    ax.legend(handles=handles, fontsize=7, loc="upper right", framealpha=0.9)
    fig.tight_layout()
    return _to_png(fig)


# =============================================================================
# reportlab document assembly
# =============================================================================

# Fonts: reuse matplotlib's bundled DejaVu so both engines draw identical glyphs
# and the result is byte-stable between macOS and the Linux server (both pinned
# via requirements.txt). reportlab's base-14 Helvetica is WinAnsi and cannot render
# the "➝" used in Route and segment captions — it would come out as a black box.
FONT = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
_FONTS_READY = False


def _register_fonts() -> bool:
    global FONT, FONT_BOLD, _FONTS_READY
    if _FONTS_READY or not (HAVE_RL and HAVE_MPL):
        return _FONTS_READY
    try:
        ttf = os.path.join(matplotlib.get_data_path(), "fonts", "ttf")
        pdfmetrics.registerFont(TTFont("SPMSans", os.path.join(ttf, "DejaVuSans.ttf")))
        pdfmetrics.registerFont(TTFont("SPMSans-Bold", os.path.join(ttf, "DejaVuSans-Bold.ttf")))
        pdfmetrics.registerFontFamily("SPMSans", normal="SPMSans", bold="SPMSans-Bold")
        FONT, FONT_BOLD = "SPMSans", "SPMSans-Bold"
        _FONTS_READY = True
    except Exception:
        # Fall back to Helvetica; _ascii() below degrades the glyphs it cannot draw.
        _FONTS_READY = False
    return _FONTS_READY


def _ascii(text: str) -> str:
    """Downgrade glyphs Helvetica cannot render, when font registration failed."""
    if _FONTS_READY:
        return text
    return (str(text).replace("➝", "->").replace("→", "->")
            .replace("·", "-").replace("⚠️", "").replace("✓", "OK"))


BRAND = colors.HexColor("#0b3d91") if HAVE_RL else None
BORDER = colors.HexColor("#d0d7e2") if HAVE_RL else None
MUTED = colors.HexColor("#6b7280") if HAVE_RL else None
PANEL_BG = colors.HexColor("#f8fafc") if HAVE_RL else None


def _styles() -> Dict[str, Any]:
    base = getSampleStyleSheet()
    return {
        "rail": ParagraphStyle("rail", parent=base["Normal"], fontName=FONT_BOLD,
                               fontSize=12, textColor=BRAND, leading=14),
        "sub": ParagraphStyle("sub", parent=base["Normal"], fontName=FONT,
                              fontSize=8, textColor=MUTED, leading=10),
        "report_name": ParagraphStyle("report_name", parent=base["Normal"],
                                      fontName=FONT_BOLD, fontSize=12, textColor=BRAND,
                                      alignment=TA_RIGHT, leading=14),
        "report_sub": ParagraphStyle("report_sub", parent=base["Normal"], fontName=FONT,
                                     fontSize=8, textColor=MUTED, alignment=TA_RIGHT,
                                     leading=10),
        "logo": ParagraphStyle("logo", parent=base["Normal"], fontName=FONT, fontSize=7,
                               textColor=BRAND, alignment=TA_CENTER, leading=9),
        "section": ParagraphStyle("section", parent=base["Normal"], fontName=FONT_BOLD,
                                  fontSize=10, textColor=BRAND, spaceAfter=4, leading=12),
        "caption": ParagraphStyle("caption", parent=base["Normal"], fontName=FONT_BOLD,
                                  fontSize=8, textColor=colors.HexColor("#334155"),
                                  spaceAfter=2, leading=10),
        "cell": ParagraphStyle("cell", parent=base["Normal"], fontName=FONT, fontSize=7.5,
                               leading=9.5),
        "nodata": ParagraphStyle("nodata", parent=base["Normal"], fontName=FONT,
                                 fontSize=7.5, textColor=MUTED, alignment=TA_CENTER,
                                 leading=9.5),
        "abnormality": ParagraphStyle("abnormality", parent=base["Normal"], fontName=FONT,
                                      fontSize=8, leading=11),
        "foot": ParagraphStyle("foot", parent=base["Normal"], fontName=FONT, fontSize=7,
                               textColor=MUTED, leading=9),
        "status": ParagraphStyle("status", parent=base["Normal"], fontName=FONT,
                                 fontSize=8, textColor=MUTED, spaceAfter=3, leading=10),
    }


def _letterhead(report: Dict[str, Any], st: Dict[str, Any], width: float) -> List[Any]:
    """Mirrors #pdfHeader (ui/spm.html:864-885)."""
    left = [Paragraph("CENTRAL RAILWAY", st["rail"]),
            Paragraph("MUMBAI DIVISION", st["sub"]),
            Paragraph("OFFICE OF SR. DEE (TRO)", st["sub"])]
    # Placeholder ring, matching the on-screen .logo-placeholder. Swap for an
    # RLImage when a real logo file is supplied.
    centre = Table([[Paragraph("Indian<br/>Railways", st["logo"])]],
                   colWidths=[54], rowHeights=[54])
    centre.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.8, BRAND),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    right = [Paragraph("SPM ANALYSIS REPORT", st["report_name"]),
             Paragraph(f"Date of Analysis: {report['letterhead']['analysis_date']}",
                       st["report_sub"])]

    head = Table([[left, centre, right]],
                 colWidths=[width * 0.40, width * 0.18, width * 0.42])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, BRAND),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return [head, Spacer(1, 8)]


def _meta_grid(report: Dict[str, Any], st: Dict[str, Any], width: float) -> Any:
    """3 rows x 4 columns, matching the on-screen .meta-grid (ui/spm.html:900-951)."""
    cells = [
        Paragraph(
            f'<font size="6" color="#6b7280">{_ascii(label).upper()}</font><br/>'
            f'<font size="8.5" color="#0b3d91"><b>{_ascii(value)}</b></font>',
            st["cell"])
        for label, value in report["meta_items"]
    ]
    rows = [cells[i:i + 4] for i in range(0, len(cells), 4)]
    table = Table(rows, colWidths=[width / 4.0] * 4)
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("BACKGROUND", (0, 0), (-1, -1), PANEL_BG),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def _section_row(title: str, st: Dict[str, Any], width: float) -> Any:
    """The dark full-width band used by tr.section-title on screen."""
    t = Table([[Paragraph(
        f'<font color="#ffffff"><b>{_ascii(title)}</b></font>', st["cell"])]],
        colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def _pf_table(report: Dict[str, Any], st: Dict[str, Any], width: float) -> Any:
    """
    Port of the PF exceptions table (ui/spm.html:996-1010).
    The three lists are zipped by index with "-" padding — a row is an index,
    not a station. That is what the screen shows.
    """
    ex = report["pf_exceptions"]
    header = [Paragraph(f"<b>{h}</b>", st["cell"])
              for h in ("PF Entry &gt; 45", "Mid PF &gt; 30", "1 Coach &gt; 15")]
    max_rows = max(len(ex["pf"]), len(ex["mid"]), len(ex["one"]))

    if max_rows == 0:
        rows = [header, [Paragraph("No exceptions detected", st["nodata"]), "", ""]]
        spans = [("SPAN", (0, 1), (-1, 1))]
    else:
        rows = [header]
        for i in range(max_rows):
            rows.append([
                Paragraph(_ascii(ex["pf"][i]) if i < len(ex["pf"]) else "-", st["cell"]),
                Paragraph(_ascii(ex["mid"][i]) if i < len(ex["mid"]) else "-", st["cell"]),
                Paragraph(_ascii(ex["one"][i]) if i < len(ex["one"]) else "-", st["cell"]),
            ])
        spans = []

    t = Table(rows, colWidths=[width / 3.0] * 3, repeatRows=1)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef3ff")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ] + spans))
    return t


def _overspeed_table(report: Dict[str, Any], st: Dict[str, Any], width: float) -> Any:
    """Port of renderOverspeedEvents (ui/spm.html:1109-1155), incl. the TOTAL row."""
    events = report["overspeed_events"]
    summary = report["overspeed_summary"] or {}
    headers = ["#", "Time", "Location (km)", "Max Speed", "Limit", "Excess", "Severity"]
    rows = [[Paragraph(f"<b>{h}</b>", st["cell"]) for h in headers]]
    extra: List[Any] = []

    if not events:
        rows.append([Paragraph("No overspeed events detected", st["nodata"])] + [""] * 6)
        extra.append(("SPAN", (0, 1), (-1, 1)))
    else:
        for i, ev in enumerate(events, start=1):
            colour = SEVERITY_COLORS.get(str(ev.get("severity", "")).lower(), "#333333")
            rows.append([
                Paragraph(str(ev.get("event_number", i)), st["cell"]),
                Paragraph(f"{ev.get('start_time', '-')} - {ev.get('end_time', '-')}", st["cell"]),
                Paragraph(f"{ev.get('start_km', '-')} - {ev.get('end_km', '-')}", st["cell"]),
                Paragraph(f"<b>{ev.get('max_speed', '-')} km/h</b>", st["cell"]),
                Paragraph(f"{ev.get('psr_value', '-')} km/h", st["cell"]),
                Paragraph(f'<font color="{colour}"><b>+{ev.get("max_excess", "-")} km/h</b></font>', st["cell"]),
                Paragraph(f'<font color="{colour}"><b>{str(ev.get("severity", "")).upper()}</b></font>', st["cell"]),
            ])

        if summary.get("total_events"):
            by = summary.get("by_severity", {}) or {}
            n = len(rows)
            rows.append([
                Paragraph(f"<b>TOTAL: {summary.get('total_events')} events</b>", st["cell"]),
                "", "",
                Paragraph(f"<b>{summary.get('max_speed_overall', '-')} km/h</b>", st["cell"]),
                Paragraph("-", st["cell"]),
                Paragraph(f"<b>+{summary.get('max_excess_overall', '-')} km/h</b>", st["cell"]),
                Paragraph(f"<b>{by.get('critical', 0)}C / {by.get('severe', 0)}S / "
                          f"{by.get('moderate', 0)}M</b>", st["cell"]),
            ])
            extra += [("SPAN", (0, n), (2, n)),
                      ("BACKGROUND", (0, n), (-1, n), colors.HexColor("#f5f5f5"))]

    widths = [w * width for w in (0.05, 0.22, 0.22, 0.13, 0.11, 0.13, 0.14)]
    t = Table(rows, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef3ff")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ] + extra))
    return t


def _bft_table(report: Dict[str, Any], st: Dict[str, Any], width: float) -> Any:
    rows = [[Paragraph(f"<b>{_ascii(label)}</b>", st["cell"]),
             Paragraph(_ascii(str(value)), st["cell"])]
            for label, value in report["bft_rows"]]
    t = Table(rows, colWidths=[width * 0.35, width * 0.65])
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef3ff")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def _abnormality_table(report: Dict[str, Any], st: Dict[str, Any], width: float) -> Any:
    colour = "#28a745" if report["abnormality_is_clean"] else "#dc3545"
    text = _ascii(report["abnormality_text"]).replace("\n", "<br/>")
    t = Table([[Paragraph(f'<font color="{colour}"><b>{text}</b></font>',
                          st["abnormality"])]], colWidths=[width])
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def _footer_flowables(report: Dict[str, Any], st: Dict[str, Any], width: float) -> List[Any]:
    f = report["footer"]
    t = Table([[Paragraph(_ascii(f["left"]), st["foot"]),
                Paragraph(_ascii(f["center"]), st["foot"]),
                Paragraph(_ascii(f["right"]), st["foot"])]],
              colWidths=[width * 0.34, width * 0.32, width * 0.34])
    t.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, -1), 0.5, BORDER),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("ALIGN", (2, 0), (2, 0), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
    ]))
    return [Spacer(1, 14), t]


def _image(buf: BytesIO, width: float, aspect_h_over_w: float) -> Any:
    """RLImage reads the buffer lazily during build(); rewind before handing it over."""
    buf.seek(0)
    return RLImage(buf, width=width, height=width * aspect_h_over_w)


def _page_furniture(canvas: Any, doc: Any) -> None:
    canvas.saveState()
    canvas.setFont(FONT, 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 18,
                      _ascii("@CR Sr.DEE TRSO-BB Division"))
    canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 18,
                           f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


def build_report_pdf(report: Dict[str, Any]) -> bytes:
    """
    Render a report model (see report_model.build_report_model) to PDF bytes.

    Section order matches the on-screen report exactly. KeepTogether and
    CondPageBreak stand in for the @media print rules at ui/spm.html:620-648;
    CondPageBreak is preferred over a hard PageBreak so short reports do not
    acquire blank pages.
    """
    if not HAVE_RL:
        raise RuntimeError("reportlab is required for PDF export. Please install it.")
    _register_fonts()
    st = _styles()

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=28, rightMargin=28, topMargin=28, bottomMargin=36,
        title=f"SPM Analysis Report - {report.get('run_id', '')}",
        author="CR Sr.DEE TRSO-BB Division",
    )
    W = doc.width

    samples = report["samples"]
    markers = report["station_markers"]
    brake_tests = report["brake_tests"]

    # Keep every buffer alive until build() has consumed it.
    buffers: List[BytesIO] = []
    story: List[Any] = []

    story += _letterhead(report, st, W)

    if report.get("reanalysis"):
        banner = Table([[Paragraph(
            f'<b>RE-ANALYSIS:</b> This run was previously analyzed on '
            f'{_ascii(report["reanalysis"]["prev_analysis_date"])}', st["cell"])]],
            colWidths=[W])
        banner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff3cd")),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#ffc107")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story += [banner, Spacer(1, 6)]

    story += [_meta_grid(report, st, W), Spacer(1, 10)]

    station_png = render_station_line(report["station_line"])
    if station_png:
        buffers.append(station_png)
        story.append(KeepTogether([
            Paragraph("Platform Entry Overview", st["section"]),
            _image(station_png, W, 1.5 / 10.5),
        ]))
        story.append(Spacer(1, 8))

    speed_png = render_speed_profile(samples, markers, brake_tests, report["violations"])
    if speed_png:
        buffers.append(speed_png)
        story.append(KeepTogether([
            Paragraph("Speed Profile Chart", st["section"]),
            _image(speed_png, W, 3.6 / 10),
        ]))

    segments = render_segment_charts(samples, markers, brake_tests)
    if segments:
        story.append(PageBreak())
        story.append(Paragraph("Segmented Speed Profiles", st["section"]))
        for caption, png in segments:
            buffers.append(png)
            story.append(KeepTogether([
                Paragraph(_ascii(caption), st["caption"]),
                _image(png, W, 2.4 / 10),
                Spacer(1, 8),
            ]))

    entry_charts = render_platform_entry_charts(samples, markers,
                                                report["platform_entry_data"])
    if entry_charts:
        story.append(CondPageBreak(200))
        story.append(Paragraph("Platform Entry Analysis", st["section"]))
        for caption, png in entry_charts:
            buffers.append(png)
            story.append(KeepTogether([
                _image(png, W, 2.8 / 10),
                Spacer(1, 8),
            ]))

    # Trip Summary
    story.append(PageBreak())
    story.append(Paragraph("Trip Summary", st["section"]))
    story += [_section_row("Platform Entry Speeds", st, W),
              _pf_table(report, st, W), Spacer(1, 8)]
    story += [_section_row("MPS/PSR Violations (PSR+3 Threshold)", st, W),
              _overspeed_table(report, st, W), Spacer(1, 8)]
    story += [_section_row("Brake Feel Test", st, W),
              _bft_table(report, st, W), Spacer(1, 8)]
    story += [_section_row("Abnormality Summary", st, W),
              _abnormality_table(report, st, W)]

    bft_png = render_brake_feel_chart(samples, brake_tests, report.get("first_halt_index"))
    if bft_png:
        buffers.append(bft_png)
        story.append(CondPageBreak(220))
        story.append(KeepTogether([
            Paragraph("Brake Feel Test", st["section"]),
            Paragraph(_ascii(report.get("bft_observation", "")), st["status"]),
            _image(bft_png, W, 2.8 / 10),
        ]))

    story += _footer_flowables(report, st, W)

    doc.build(story, onFirstPage=_page_furniture, onLaterPages=_page_furniture)
    return buf.getvalue()
