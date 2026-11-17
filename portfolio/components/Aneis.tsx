"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { reduzMovimento } from "@/lib/scroll";

type V3 = [number, number, number];

// Quatro anéis finos que giram sozinhos, cada um em torno de um eixo diferente, como um giroscópio. Um marcador azul percorre o
// primeiro anel, como no fio da página. Para mexer, é só clicar nos anéis e arrastar: eles
// giram na direção do arrasto e, ao soltar, seguem com a inércia até voltar ao giro calmo.
// Com "reduzir movimento", aparecem parados.
const aneis = [
  // wx e wz: velocidade com que cada anel gira em torno de seus próprios eixos (rad/s).
  { r: 1.0, rx: 1.15, rz: 0.2, v: 0.35, wx: 0.42, wz: 0.16, azul: true },
  { r: 0.82, rx: 0.2, rz: 1.1, v: -0.28, wx: -0.36, wz: 0.3, azul: false },
  { r: 0.64, rx: 0.8, rz: 0.9, v: 0.45, wx: 0.3, wz: -0.5, azul: false },
  { r: 1.18, rx: 1.45, rz: 0.55, v: 0.2, wx: -0.22, wz: -0.18, azul: false },
];

const GIRO_CALMO = 0.28; // rad/s

function girar([x, y, z]: V3, yaw: number, pitch: number): V3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}

export default function Aneis({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = host.current;
    const cv = tela.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    // yaw/pitch: orientação do conjunto. extra: velocidade ganha com o arrasto (decai sozinha).
    const est = { yaw: 0, pitch: 0.3, extra: 0 };
    let tempoAnterior = 0;

    const desenhar = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.33;
      const cx = w / 2;
      const cy = h / 2;

      aneis.forEach((an, k) => {
        const N = 120;
        const pts: { x: number; y: number; z: number; f: number }[] = [];
        for (let i = 0; i <= N; i++) {
          const ang = (i / N) * Math.PI * 2 + t * an.v;
          let q: V3 = [Math.cos(ang) * an.r, 0, Math.sin(ang) * an.r];
          const rx = an.rx + t * an.wx;
          const c1 = Math.cos(rx);
          const s1 = Math.sin(rx);
          q = [q[0], q[1] * c1 - q[2] * s1, q[1] * s1 + q[2] * c1];
          const rz = an.rz + t * an.wz;
          const c2 = Math.cos(rz);
          const s2 = Math.sin(rz);
          q = [q[0] * c2 - q[1] * s2, q[0] * s2 + q[1] * c2, q[2]];
          const r = girar(q, est.yaw, est.pitch);
          const f = 3 / (3 + r[2]);
          pts.push({ x: cx + r[0] * R * f, y: cy + r[1] * R * f, z: r[2], f });
        }
        for (let i = 0; i < N; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const prof = 1 - (a.z / an.r + 1) / 2;
          ctx.strokeStyle = `rgba(222,226,234,${0.12 + prof * 0.55})`;
          ctx.lineWidth = 0.6 + prof * 0.9;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        // marcador percorrendo o anel
        const m = pts[Math.floor(((t * 0.12 * (k + 1)) % 1) * N)];
        ctx.fillStyle = an.azul ? "#4c85ee" : "#f2f2f0";
        if (an.azul) {
          ctx.shadowColor = "#346dcc";
          ctx.shadowBlur = 14;
        }
        ctx.beginPath();
        ctx.arc(m.x, m.y, (an.azul ? 4.2 : 2.4) * (0.7 + m.f * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.fillStyle = "#4c85ee";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const parado = reduzMovimento();
    const medir = () => {
      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      if (parado) desenhar(1.2);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (parado) return () => ro.disconnect();

    // Arrastar: gira na direção do movimento.
    let arrastando = false;
    let ultimoX = 0;
    let ultimoY = 0;
    let ultimoT = 0;
    const baixo = (e: PointerEvent) => {
      arrastando = true;
      ultimoX = e.clientX;
      ultimoY = e.clientY;
      ultimoT = performance.now();
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = "grabbing";
    };
    const mover = (e: PointerEvent) => {
      if (!arrastando) return;
      const agora = performance.now();
      const dt = Math.max(1, agora - ultimoT) / 1000;
      const dx = (e.clientX - ultimoX) * 0.012;
      const dy = (e.clientY - ultimoY) * 0.012;
      est.yaw += dx;
      est.pitch = gsap.utils.clamp(-1.3, 1.3, est.pitch + dy);
      est.extra = gsap.utils.clamp(-8, 8, dx / dt);
      ultimoX = e.clientX;
      ultimoY = e.clientY;
      ultimoT = agora;
    };
    const solto = (e: PointerEvent) => {
      arrastando = false;
      cv.style.cursor = "grab";
      if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
    };
    cv.style.cursor = "grab";
    cv.style.touchAction = "pan-y";
    cv.addEventListener("pointerdown", baixo);
    cv.addEventListener("pointermove", mover);
    cv.addEventListener("pointerup", solto);
    cv.addEventListener("pointercancel", solto);

    let visivel = true;
    const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting));
    io.observe(el);
    const loop = (t: number) => {
      if (!visivel) return;
      const dt = Math.min(0.05, t - tempoAnterior);
      tempoAnterior = t;
      if (!arrastando) {
        est.yaw += (GIRO_CALMO + est.extra) * dt;
        est.extra *= 0.97; // a inércia do arrasto some aos poucos
        est.pitch += (0.3 + Math.sin(t * 0.25) * 0.08 - est.pitch) * 0.02; // volta à inclinação calma
      }
      desenhar(t);
    };
    gsap.ticker.add(loop);

    return () => {
      gsap.ticker.remove(loop);
      cv.removeEventListener("pointerdown", baixo);
      cv.removeEventListener("pointermove", mover);
      cv.removeEventListener("pointerup", solto);
      cv.removeEventListener("pointercancel", solto);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={host} className={className}>
      <canvas ref={tela} role="img" aria-label="Anéis orbitais em rotação. Clique e arraste para girar." className="block" />
    </div>
  );
}
