# Builds the hardcoded POC dataset from KITTI (nateraw/kitti on Hugging Face).
# Downloads 10 object-detection street scenes + ground-truth boxes, generates one
# transformed variant per image using deterministic CV transforms (from the FYP spec),
# authors the simulated model predictions / oracle outcome, and emits:
#   public/dataset/*.jpg
#   src/data/generated/dataset.json
import json, math, os, random, io
import numpy as np
import cv2
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_IMG = os.path.join(ROOT, "public", "dataset")
OUT_JSON = os.path.join(ROOT, "src", "data", "generated")
os.makedirs(OUT_IMG, exist_ok=True)
os.makedirs(OUT_JSON, exist_ok=True)

ROWS_CACHE = os.path.join(ROOT, "data_work", "rows.json")
if os.path.exists(ROWS_CACHE):
    rows = json.load(open(ROWS_CACHE))
else:
    print("fetching KITTI rows from Hugging Face…")
    rows = requests.get(
        "https://datasets-server.huggingface.co/first-rows"
        "?dataset=nateraw/kitti&config=default&split=train", timeout=120).json()["rows"]
    json.dump(rows, open(ROWS_CACHE, "w"))
KEEP = {"Car": "car", "Van": "car", "Truck": "truck",
        "Pedestrian": "pedestrian", "Person_sitting": "pedestrian", "Cyclist": "cyclist"}

def load(idx):
    r = rows[idx]["row"]
    url = r["image"]["src"]
    data = requests.get(url, timeout=90).content
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    objs = []
    for l in r["label"]:
        if l["type"] in KEEP:
            b = [float(x) for x in l["bbox"]]
            objs.append({"cls": KEEP[l["type"]], "bbox": [round(v, 1) for v in b],
                         "occluded": int(l.get("occluded", 0)),
                         "area": (b[2] - b[0]) * (b[3] - b[1])})
    return img, objs

# ---------- deterministic transforms ----------
def t_brightness(img):
    return cv2.convertScaleAbs(img, alpha=1.12, beta=48)

def t_contrast(img):
    return cv2.convertScaleAbs(img, alpha=0.72, beta=14)

def t_blur(img):
    return cv2.GaussianBlur(img, (0, 0), 2.4)

def t_bgr(img):
    return img[:, :, ::-1].copy()

def t_rotate(img, ang=9.0):
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0)
    out = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return out, M

def rot_boxes(boxes, M):
    res = []
    for b in boxes:
        pts = np.array([[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]], np.float32)
        P = np.hstack([pts, np.ones((4, 1), np.float32)]) @ M.T
        res.append([float(P[:, 0].min()), float(P[:, 1].min()),
                    float(P[:, 0].max()), float(P[:, 1].max())])
    return res

def t_fog(img):
    h, w = img.shape[:2]
    f = img.astype(np.float32)
    grad = np.linspace(0.62, 0.20, h)[:, None]        # denser fog near the horizon (top)
    grad = np.repeat(grad, w, axis=1)[..., None]
    fog = np.full_like(f, 214.0)
    out = f * (1 - grad) + fog * grad
    out = cv2.convertScaleAbs(out, alpha=0.82, beta=24)
    return cv2.GaussianBlur(out, (0, 0), 1.1)

def t_night(img):
    f = img.astype(np.float32) / 255.0
    f = np.power(f, 1.7)                               # gamma darken
    f[..., 0] = np.clip(f[..., 0] * 1.20, 0, 1)        # boost blue (BGR)
    f[..., 2] = np.clip(f[..., 2] * 0.80, 0, 1)        # cut red
    hsv = cv2.cvtColor((f * 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] *= 0.65
    hsv[..., 2] *= 0.82
    out = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    h, w = out.shape[:2]                               # vignette
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    vig = np.clip(1.12 - 0.38 * d, 0.62, 1.0)[..., None]
    return np.clip(out * vig, 0, 255).astype(np.uint8)

def t_rain(img):
    h, w = img.shape[:2]
    rng = np.random.default_rng(7)
    layer = np.zeros((h, w), np.float32)
    for _ in range(int(h * w / 650)):
        x, y = int(rng.integers(0, w)), int(rng.integers(0, h))
        ln = int(rng.integers(9, 22))
        cv2.line(layer, (x, y), (x - 4, y + ln), float(rng.integers(120, 210)), 1)
    layer = cv2.GaussianBlur(layer, (0, 0), 1.0)
    out = img.astype(np.float32)
    out += layer[..., None]
    out = cv2.convertScaleAbs(out, alpha=0.88, beta=-6)
    out = out.astype(np.float32)
    out[..., 0] = np.clip(out[..., 0] + 10, 0, 255)
    out = cv2.GaussianBlur(out, (0, 0), 0.9)
    return np.clip(out, 0, 255).astype(np.uint8)

def t_haze(img):
    f = img.astype(np.float32)
    haze = np.full_like(f, 205.0)
    haze[..., 0] += 12  # slight blue cast (BGR)
    out = f * 0.55 + haze * 0.45
    out = cv2.convertScaleAbs(out, alpha=0.78, beta=20)
    return cv2.GaussianBlur(out, (0, 0), 0.8)

def t_motionblur(img, k=17):
    kernel = np.zeros((k, k), np.float32)
    kernel[k // 2, :] = 1.0 / k
    return cv2.filter2D(img, -1, kernel)

def t_dusk(img):
    f = img.astype(np.float32) / 255.0
    f = np.power(f, 1.35)
    f[..., 2] = np.clip(f[..., 2] * 1.18, 0, 1)   # warm: boost red (BGR)
    f[..., 1] = np.clip(f[..., 1] * 1.03, 0, 1)
    f[..., 0] = np.clip(f[..., 0] * 0.82, 0, 1)   # cut blue
    out = np.clip(f * 255, 0, 255).astype(np.uint8).astype(np.float32)
    h, w = out.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    vig = np.clip(1.1 - 0.28 * d, 0.72, 1.0)[..., None]
    return np.clip(out * vig, 0, 255).astype(np.uint8)

def t_glare(img, center):
    h, w = img.shape[:2]
    cx, cy = int(center[0]), int(center[1])
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    rad = 0.42 * min(h, w) * 2.4
    g = np.clip(1.0 - r / rad, 0, 1) ** 1.6
    g = cv2.GaussianBlur(g, (0, 0), min(h, w) * 0.05)[..., None]
    out = img.astype(np.float32)
    out = out * (1 - g * 0.9) + 255.0 * (g * 0.95)
    return np.clip(out, 0, 255).astype(np.uint8)

def t_occlusion(img, target):
    out = img.copy()
    x1, y1, x2, y2 = [int(v) for v in target]
    bw, bh = x2 - x1, y2 - y1
    ox1 = max(0, x1 - int(bw * 0.15))
    ox2 = ox1 + int(bw * 0.62)
    oy1 = y1 + int(bh * 0.12)
    oy2 = min(out.shape[0], y2 + int(bh * 0.06))
    slab = out[oy1:oy2, ox1:ox2].astype(np.float32)
    grey = np.full_like(slab, (58, 58, 64))
    out[oy1:oy2, ox1:ox2] = (slab * 0.12 + grey * 0.88).astype(np.uint8)
    cv2.rectangle(out, (ox1, oy1), (ox2, oy2), (90, 92, 100), 2)
    return out, [ox1, oy1, ox2, oy2]

def t_insert(img, car_patch):
    out = img.copy()
    h, w = out.shape[:2]
    tw = int(w * 0.115)
    th = int(tw * car_patch.shape[0] / car_patch.shape[1])
    patch = cv2.resize(car_patch, (tw, th), interpolation=cv2.INTER_CUBIC)
    patch = cv2.addWeighted(patch, 1.6, cv2.GaussianBlur(patch, (0, 0), 1.2), -0.6, 0)
    cx = int(w * 0.62)
    cy = int(h * 0.565)
    x1, y1 = cx - tw // 2, cy - th // 2
    x1 = max(0, min(x1, w - tw)); y1 = max(0, min(y1, h - th))
    mask = np.zeros((th, tw), np.float32)
    cv2.ellipse(mask, (tw // 2, th // 2), (int(tw * 0.5), int(th * 0.48)), 0, 0, 360, 1, -1)
    mask = cv2.GaussianBlur(mask, (0, 0), tw * 0.03)[..., None]
    roi = out[y1:y1 + th, x1:x1 + tw].astype(np.float32)
    out[y1:y1 + th, x1:x1 + tw] = (roi * (1 - mask) + patch.astype(np.float32) * mask).astype(np.uint8)
    return out, [x1, y1, x1 + tw, y1 + th]

# ---------- prediction authoring ----------
CONF = {"car": (0.90, 0.97), "truck": (0.88, 0.95),
        "pedestrian": (0.76, 0.90), "cyclist": (0.70, 0.86)}

def base_preds(objs, seed):
    rng = random.Random(seed)
    out = []
    for o in objs:
        lo, hi = CONF[o["cls"]]
        # more occluded -> lower confidence
        c = rng.uniform(lo, hi) - 0.05 * min(o["occluded"], 2)
        out.append({"cls": o["cls"], "conf": round(max(0.55, c), 2), "bbox": o["bbox"]})
    return out

def jitter(preds, seed, drop=(0.02, 0.06)):
    rng = random.Random(seed)
    return [{"cls": p["cls"], "conf": round(max(0.5, p["conf"] - rng.uniform(*drop)), 2),
             "bbox": p["bbox"]} for p in preds]

def counts_text(preds):
    from collections import Counter
    c = Counter(p["cls"] for p in preds)
    order = ["car", "truck", "pedestrian", "cyclist"]
    parts = []
    for k in order:
        if c[k]:
            parts.append(f"{c[k]} {k}{'s' if c[k] > 1 else ''}")
    return " + ".join(parts) if parts else "no objects"

# ---------- the 10 cases ----------
random.seed(42)
CASES = [
    dict(idx=19, mr="MR-03", style="brightness", name="Brightness +42",
         reason="Baseline scene is well-lit with clean, well-separated vehicles — start with a low-risk photometric MR to confirm invariance.",
         result="PASS"),
    dict(idx=60, mr="GMR-05", style="haze", name="Clear -> Hazy",
         reason="First generative probe — light atmospheric haze reduces contrast at range without changing scene content.",
         result="PASS"),
    dict(idx=43, mr="GMR-09", style="motionblur", name="Camera motion blur",
         reason="Directional blur simulates a moving mount / rolling-shutter smear, a realistic on-vehicle camera condition.",
         result="PASS"),
    dict(idx=64, mr="MR-07", style="rotate", name="Rotation 9 degrees",
         reason="One geometric check — rotation verifies the detector equivariantly transforms box coordinates.",
         result="PASS"),
    dict(idx=24, mr="GMR-02", style="fog", name="Clear -> Foggy",
         reason="Low-visibility conditions are high priority for the declared domain and untested so far. Generative fog edit.",
         result="VIOLATION", failure="object disappearance", pick="smallest"),
    dict(idx=74, mr="GMR-01", style="rain", name="Clear -> Rainy",
         reason="Two cyclists present; rain streaks degrade thin bicycle structure and have caused vulnerable-road-user errors in similar models.",
         result="VIOLATION", failure="class confusion", pick="cyclist"),
    dict(idx=63, mr="GMR-03", style="night", name="Day -> Night",
         reason="Testing memory shows fog and haze already degraded distant detections; low-light is a correlated condition worth probing.",
         result="VIOLATION", failure="confidence degradation", pick="pedestrian"),
    dict(idx=25, mr="DMR-01", style="occlusion", name="Partial pedestrian occlusion",
         reason="Domain-specific MR. Four pedestrians present; occlusion is the top-ranked untested domain risk from the failure profile.",
         result="VIOLATION", failure="false negative", pick="pedestrian_mid"),
    dict(idx=31, mr="GMR-06", style="dusk", name="Day -> Dusk",
         reason="Between the low-light failures — dusk lighting with warm colour cast checks the softer end of the illumination range.",
         result="PASS"),
    dict(idx=68, mr="GMR-10", style="glare", name="Low-sun lens glare",
         reason="Generative glare bloom over part of the frame — checks whether detections survive a blown-out region near the sun.",
         result="VIOLATION", failure="false negative", pick="glare_ped"),
]

# a clean car patch for the insertion case
_carimg, _carobjs = load(4)   # idx 4 has a large, cleanly-framed vehicle
_cb = sorted([o for o in _carobjs if o["cls"] in ("car", "truck")], key=lambda o: -o["area"])[0]["bbox"]
CAR_PATCH = _carimg[int(_cb[1]):int(_cb[3]), int(_cb[0]):int(_cb[2])].copy()

DISPLAY_CLASSES = {"car", "truck", "pedestrian", "cyclist"}
records = []

for n, c in enumerate(CASES, 1):
    img, objs = load(c["idx"])
    objs = [o for o in objs if o["cls"] in DISPLAY_CLASSES]
    # keep the frame readable: cap at 6 largest objects
    objs = sorted(objs, key=lambda o: -o["area"])[:6]
    h, w = img.shape[:2]
    cid = f"IMG-{n:02d}"
    style = c["style"]
    orig_preds = base_preds(objs, seed=c["idx"])
    tboxes_disp = None
    extra = {}

    if style == "brightness":
        tr = t_brightness(img)
    elif style == "haze":
        tr = t_haze(img)
    elif style == "motionblur":
        tr = t_motionblur(img)
    elif style == "dusk":
        tr = t_dusk(img)
    elif style == "bgr":
        tr = t_bgr(img)
    elif style == "rotate":
        tr, M = t_rotate(img)
        tboxes_disp = rot_boxes([p["bbox"] for p in orig_preds], M)
    elif style == "fog":
        tr = t_fog(img)
    elif style == "rain":
        tr = t_rain(img)
    elif style == "night":
        tr = t_night(img)
    elif style == "glare":
        gp = [i for i, p in enumerate(orig_preds) if p["cls"] == "pedestrian"]
        gp.sort(key=lambda i: -orig_preds[i]["bbox"][3])  # nearest (largest y2) pedestrian
        target_i = gp[0] if gp else 0
        b = orig_preds[target_i]["bbox"]
        tr = t_glare(img, ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2))
        extra["target_i"] = target_i
        extra["glare_center"] = [round((b[0] + b[2]) / 2, 1), round((b[1] + b[3]) / 2, 1)]
    elif style == "occlusion":
        peds = [i for i, p in enumerate(orig_preds) if p["cls"] == "pedestrian"]
        peds.sort(key=lambda i: (orig_preds[i]["bbox"][2] - orig_preds[i]["bbox"][0]))
        target_i = peds[len(peds) // 2] if peds else 0
        tr, occ = t_occlusion(img, orig_preds[target_i]["bbox"])
        extra["occluder"] = occ
        extra["target_i"] = target_i
    elif style == "insert":
        tr, ib = t_insert(img, CAR_PATCH)
        extra["insert_box"] = ib

    # ---- author transformed predictions ----
    if c["result"] == "PASS":
        tp = jitter(orig_preds, seed=c["idx"] + 1)
        if style == "rotate":
            for p, bb in zip(tp, tboxes_disp):
                p["bbox"] = [round(v, 1) for v in bb]
        if style == "insert":
            ib = extra["insert_box"]
            rng = random.Random(c["idx"])
            tp = jitter(orig_preds, seed=c["idx"] + 1, drop=(0.01, 0.03))
            tp.append({"cls": "truck", "conf": round(rng.uniform(0.83, 0.9), 2),
                       "bbox": [round(v, 1) for v in ib]})
        actual = counts_text(tp)
        expected = counts_text(orig_preds) + (" · boxes follow the 9 degrees rotation" if style == "rotate" else "")
        failure = None
    else:
        ft = c["failure"]
        if style == "fog":
            areas = [( (p["bbox"][2]-p["bbox"][0])*(p["bbox"][3]-p["bbox"][1]), i) for i, p in enumerate(orig_preds)]
            drop_i = min(areas)[1]
            tp = []
            for i, p in enumerate(orig_preds):
                if i == drop_i:
                    continue
                tp.append({"cls": p["cls"], "conf": round(max(0.5, p["conf"] - random.uniform(0.06, 0.14)), 2), "bbox": p["bbox"]})
            aff = orig_preds[drop_i]["cls"]
            observed = (f"A distant {aff} (baseline confidence {orig_preds[drop_i]['conf']:.2f}) is no longer "
                        f"detected after the fog transformation; remaining detections lost 0.06–0.14 confidence.")
            cause = "The detector is sensitive to atmospheric contrast loss for small, low-confidence objects at range."
            severity = "MEDIUM"
        elif style == "rain":
            ci = next((i for i, p in enumerate(orig_preds) if p["cls"] == "cyclist"), 0)
            tp = []
            for i, p in enumerate(orig_preds):
                if i == ci:
                    tp.append({"cls": "pedestrian", "conf": 0.55, "bbox": p["bbox"]})
                else:
                    tp.append({"cls": p["cls"], "conf": round(max(0.5, p["conf"] - random.uniform(0.03, 0.09)), 2), "bbox": p["bbox"]})
            aff = "cyclist"
            observed = ("Under rain the cyclist (baseline 0.%d) is re-classified as a pedestrian (0.55). "
                        "Rain streaks and lens droplets blur the bicycle frame, removing the distinguishing cue."
                        % int(orig_preds[ci]['conf'] * 100))
            cause = "The cyclist vs pedestrian boundary depends on thin bicycle structure that rain degrades."
            severity = "MEDIUM"
        elif style == "night":
            tp = []
            for p in orig_preds:
                if p["cls"] == "pedestrian":
                    tp.append({"cls": "pedestrian", "conf": round(random.uniform(0.34, 0.44), 2), "bbox": p["bbox"]})
                else:
                    tp.append({"cls": p["cls"], "conf": round(max(0.6, p["conf"] - random.uniform(0.02, 0.06)), 2), "bbox": p["bbox"]})
            aff = "pedestrian"
            observed = ("Pedestrian detection confidence collapses from ~0.88 to ~0.40 (below the 0.50 "
                        "decision threshold) under the night transformation, while vehicle detections stay stable.")
            cause = "Low-light pedestrian examples are under-represented in training; vehicles keep strong lighting cues that pedestrians lack at night."
            severity = "HIGH"
        elif style == "occlusion":
            ti = extra["target_i"]
            tp = [ {"cls": p["cls"], "conf": round(max(0.55, p["conf"] - random.uniform(0.0, 0.04)), 2), "bbox": p["bbox"]}
                   for i, p in enumerate(orig_preds) if i != ti ]
            aff = "pedestrian"
            observed = ("A pedestrian with ~45% occlusion (head, torso and one leg still visible) is not "
                        f"detected at all; baseline confidence was {orig_preds[ti]['conf']:.2f}.")
            cause = "The detector relies on near-complete pedestrian silhouettes; occluded-pedestrian augmentation is missing."
            severity = "HIGH"
        elif style == "glare":
            ti = extra["target_i"]
            tp = [ {"cls": p["cls"], "conf": round(max(0.55, p["conf"] - random.uniform(0.02, 0.07)), 2), "bbox": p["bbox"]}
                   for i, p in enumerate(orig_preds) if i != ti ]
            aff = "pedestrian"
            observed = ("A pedestrian standing inside the glare bloom is lost entirely; the blown-out "
                        f"region erases edge and texture cues (baseline confidence {orig_preds[ti]['conf']:.2f}).")
            cause = "Over-exposed regions collapse local contrast; the detector has little high-dynamic-range or lens-flare augmentation."
            severity = "HIGH"
        actual = counts_text(tp)
        expected = counts_text(orig_preds) + "  (all retained)"
        failure = {"category": ft, "affectedClass": aff, "severity": severity,
                   "observed": observed, "likelyCause": cause}

    # ---- write images (JPEG, keep native resolution) ----
    cv2.imwrite(os.path.join(OUT_IMG, f"{cid}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    cv2.imwrite(os.path.join(OUT_IMG, f"{cid}_t.jpg"), tr, [cv2.IMWRITE_JPEG_QUALITY, 90])

    clip_initial = 0.79 if style == "fog" else (0.81 if style == "glare" else None)
    clip = {"fog": 0.91, "glare": 0.90}.get(style) or {
        "brightness": 0.97, "haze": 0.93, "motionblur": 0.92, "rotate": 0.93,
        "rain": 0.90, "night": 0.88, "dusk": 0.94, "occlusion": 0.92, "bgr": 0.90,
    }[style]

    records.append({
        "id": cid,
        "src": c["idx"],
        "image": f"dataset/{cid}.jpg",
        "transformedImage": f"dataset/{cid}_t.jpg",
        "width": w, "height": h,
        "title": "KITTI street scene",
        "caption": counts_text(orig_preds).capitalize() + " in an urban driving scene.",
        "transformedCaption": counts_text(tp).capitalize() + f" — {c['name'].lower()}.",
        "sceneSummary": counts_text(orig_preds) + " with ground-truth annotations.",
        "mrId": c["mr"],
        "transformName": c["name"],
        "transformStyle": style,
        "selectionReason": c["reason"],
        "clipThreshold": 0.85,
        "clipInitial": clip_initial,
        "regenerated": clip_initial is not None,
        "clipScore": clip,
        "semanticPreserved": True,
        "originalPreds": orig_preds,
        "transformedPreds": tp,
        "transformedBoxes": tboxes_disp,
        "occluder": extra.get("occluder"),
        "insertBox": extra.get("insert_box"),
        "expectedSummary": expected,
        "actualSummary": actual,
        "result": c["result"],
        "failure": failure,
    })
    print(f"{cid}  idx={c['idx']:>3}  {style:<10} {c['result']:<9} {counts_text(orig_preds)}")

json.dump({"source": "nateraw/kitti (KITTI Vision Benchmark) · Hugging Face",
          "license": "CC BY-NC-SA 3.0",
          "domain": "autonomous driving",
          "cases": records},
         open(os.path.join(OUT_JSON, "dataset.json"), "w"), indent=1)
print("\nwrote", os.path.join(OUT_JSON, "dataset.json"))
