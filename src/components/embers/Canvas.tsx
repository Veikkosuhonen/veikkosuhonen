import { Component, createSignal, onMount } from "solid-js";

type Particle = {
    x: number,
    y: number,
    y0: number,
    vx: number,
    vy: number,
    fr: number,
}

const bbColors = [
    "#d63306",
    "#ff3800",
    "#ff5300",
    "#ff6500",
    "#ff7300",
    "#ff7e00",
    "#ff8912",
    "#ff932c",
    "#ff9d3f",
    "#ffa54f",
    "#ffad5e",
    "#ffb46b",
    "#ffbb78",
    "#ffc184",
    "#ffc78f",
    "#ffcc99",
].reverse()

const getBBColor = (frame: number) => bbColors[Math.min(bbColors.length - 1, Math.round(frame / 20))]

export const EmbersCanvas: Component<{ embersOn: boolean }> = (props) => {
    let canvas: HTMLCanvasElement|undefined;
    const [w, setW] = createSignal(0);
    const [h, setH] = createSignal(0);

    onMount(() => {
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false })
        if (!ctx) return;

        const resize = () => {
            setW(window.innerWidth / 4);
            setH(window.innerHeight / 4);
            // console.log(w(), h())
        }
        window.addEventListener("resize", resize)
        resize()

        
        const N = 50;

        const particles: Particle[] = []
        for (let i = 0; i < N; i++) {
            const y0 = h() + Math.random() * h()
            particles.push({
                x: Math.random() * w(),
                y: y0,
                y0,
                vx: (Math.random() - 0.5) * 0.2,
                vy: -0.2,
                fr: 2 * h() - y0,
            })
        }

        // const grad = ctx.createLinearGradient(0, h(), 0, 0);
        // bbColors.forEach((col, idx) => {
        //     grad.addColorStop((idx / bbColors.length), col)
        // })

        let frame = 0;
        let start = performance.now()

        const render = () => {
            if (!canvas) return
            ctx.clearRect(0, 0, w(), h())
            
            if (props.embersOn) {
                for (let i = 0; i < N; i++) {
                    if (particles[i].y < 0) {
                        particles[i].y = particles[i].y0;
                        particles[i].vy = -0.2;
                        particles[i].fr = frame;
                    }
                    if (particles[i].x < 0) particles[i].x = w()
                    if (particles[i].x > w()) particles[i].x = 0
                    particles[i].vy += 0.03 * (Math.random() - 0.5) - 0.001;
                    particles[i].vx += 0.03 * (Math.random() - 0.5);
                    particles[i].vy *= 1 - (particles[i].vy * particles[i].vy) * 0.01;
                    particles[i].vx *= 1 - (particles[i].vx * particles[i].vx) * 0.01;
                    particles[i].x += particles[i].vx
                    particles[i].y += particles[i].vy
                    ctx.fillStyle = getBBColor(frame - particles[i].fr);
                    ctx.fillRect(particles[i].x,particles[i].y, 1.5, 1.5);
                }
                frame++;
            }
            let end = performance.now()
            // console.log((end - start));
            start = end;
            requestAnimationFrame(render)
        }

        render()
    })

    return (
        <div class="fixed top-0 w-full h-screen -z-50 blur-md">
            <canvas style={{ background: "black" }} width={w()} height={h()} ref={canvas} class="bg-transparent fixed top-0 w-full h-screen -z-50"/>
        </div>
    )
}