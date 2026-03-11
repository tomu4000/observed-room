import math
import random
import wave
import struct

SAMPLE_RATE = 44100
DURATION = 60.0
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)
OUTPUT_FILE = "bgm.wav"

random.seed(42)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def smoothstep(t: float) -> float:
    t = clamp(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def loop_envelope(t: float, total: float) -> float:
    """
    ループの頭と終わりで不自然になりにくいように、
    真ん中が少し濃く、端が少し薄い包絡を作る
    """
    phase = t / total
    return 0.72 + 0.28 * math.sin(math.pi * phase) ** 2


def low_lfo(t: float, speed: float, depth: float) -> float:
    return 1.0 + depth * math.sin(2.0 * math.pi * speed * t)


def particle_envelope(local_t: float, length: float) -> float:
    """
    短い粒子音用の減衰エンベロープ
    """
    if local_t < 0.0 or local_t > length:
        return 0.0
    x = local_t / length
    attack = min(1.0, x / 0.08)
    decay = math.exp(-4.8 * x)
    return attack * decay


def generate_particle_events(duration: float):
    """
    高域の粒子音イベントをランダム生成
    """
    events = []
    t = 0.0
    while t < duration:
        # 粒子音ちょい多め
        t += random.uniform(0.18, 0.65)
        if t >= duration:
            break

        freq = random.choice([
            random.uniform(900.0, 1400.0),
            random.uniform(1500.0, 2200.0),
            random.uniform(2400.0, 3400.0),
        ])
        length = random.uniform(0.08, 0.28)
        amp = random.uniform(0.020, 0.060)
        pan = random.uniform(-0.7, 0.7)

        events.append({
            "start": t,
            "freq": freq,
            "length": length,
            "amp": amp,
            "pan": pan,
            "phase": random.uniform(0.0, math.tau),
        })
    return events


def write_wav_stereo(filename: str, left_samples, right_samples):
    with wave.open(filename, "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(SAMPLE_RATE)

        frames = bytearray()
        for l, r in zip(left_samples, right_samples):
            li = int(clamp(l, -1.0, 1.0) * 32767.0)
            ri = int(clamp(r, -1.0, 1.0) * 32767.0)
            frames.extend(struct.pack("<hh", li, ri))

        wf.writeframes(frames)


def main():
    particle_events = generate_particle_events(DURATION)

    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES

    # ドローンの基本周波数
    drone_f1 = 62.0
    drone_f2 = 93.0
    drone_f3 = 124.0

    # 中域の薄い空気層
    pad_f1 = 210.0
    pad_f2 = 320.0

    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE
        env = loop_envelope(t, DURATION)

        # ==========
        # 低音ドローン
        # ==========
        d1 = math.sin(2 * math.pi * drone_f1 * t * low_lfo(t, 0.031, 0.0025))
        d2 = math.sin(2 * math.pi * drone_f2 * t * low_lfo(t, 0.021, 0.0018) + 0.9)
        d3 = math.sin(2 * math.pi * drone_f3 * t * low_lfo(t, 0.017, 0.0014) + 1.7)

        drone = (
            0.16 * d1 +
            0.10 * d2 +
            0.06 * d3
        )

        # ==========
        # 中域の揺れる空気
        # ==========
        pad_mod = 0.5 + 0.5 * math.sin(2 * math.pi * 0.014 * t + 1.2)
        p1 = math.sin(2 * math.pi * pad_f1 * t + 0.35 * math.sin(2 * math.pi * 0.09 * t))
        p2 = math.sin(2 * math.pi * pad_f2 * t + 0.25 * math.sin(2 * math.pi * 0.07 * t + 1.1))
        pad = (0.030 * p1 + 0.022 * p2) * (0.55 + 0.45 * pad_mod)

        # ==========
        # 微細ノイズ層
        # ==========
        noise = random.uniform(-1.0, 1.0)
        shimmer_noise = 0.008 * noise * (0.45 + 0.55 * math.sin(2 * math.pi * 0.19 * t + 0.6) ** 2)

        # ==========
        # 粒子音
        # ==========
        particle_l = 0.0
        particle_r = 0.0

        for ev in particle_events:
            local_t = t - ev["start"]
            if local_t < 0.0:
                continue
            if local_t > ev["length"]:
                continue

            penv = particle_envelope(local_t, ev["length"])
            # 少しガラスっぽい倍音
            base = math.sin(2 * math.pi * ev["freq"] * local_t + ev["phase"])
            overtone = 0.45 * math.sin(2 * math.pi * ev["freq"] * 2.02 * local_t + ev["phase"] * 0.7)
            sparkle = (base + overtone) * ev["amp"] * penv

            pan_l = 1.0 - max(0.0, ev["pan"])
            pan_r = 1.0 + min(0.0, ev["pan"])

            particle_l += sparkle * pan_l
            particle_r += sparkle * pan_r

        # ==========
        # 全体ミックス
        # ==========
        center = (drone + pad + shimmer_noise) * env

        # わずかに左右差をつける
        stereo_wobble = 0.012 * math.sin(2 * math.pi * 0.027 * t)
        l = center * (1.0 - stereo_wobble) + particle_l
        r = center * (1.0 + stereo_wobble) + particle_r

        # 最終音量
        left[i] = l * 0.85
        right[i] = r * 0.85

    write_wav_stereo(OUTPUT_FILE, left, right)
    print(f"書き出し完了: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()