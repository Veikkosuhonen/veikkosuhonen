import { createSignal, onMount } from "solid-js"

const fridayNumber = 5
const fivePmMs = 17 * 60 * 60 * 1000
const maxMsUntilWeekend = 4 * 24 * 60 * 60 * 1000 + fivePmMs
const maxSecondsUntilWeekend = Math.floor(maxMsUntilWeekend / 1000)
const canvasW = Math.ceil(Math.sqrt(maxSecondsUntilWeekend))

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function sfc32(a: number, b: number, c: number, d: number) {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

// Current week number
const seed = Math.floor(Date.now() / 1000 / 60 / 60 / 24 / 7)
const rng = sfc32(seed, seed * 0.3570, seed * 1.19715, seed * 3.654901)

const createPixelMapping = () => {
  const mapping = Array.from({ length: maxSecondsUntilWeekend }).map((_, i) => i)
  // Shuffle the array in-place (https://bost.ocks.org/mike/shuffle/)
  let m = mapping.length, t, i;
  while (m) {
    i = Math.floor(rng() * m--);
    t = mapping[m];
    mapping[m] = mapping[i];
    mapping[i] = t;
  }
  return mapping
}

const getSecondsUntilWeekend = () => {
  const start = new Date()
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const daysUntilFriday = fridayNumber - day
  const msSinceMidnight = start.getTime() - midnight.getTime()
  const fivePmMs = 17 * 60 * 60 * 1000
  const msUntilFivePm = fivePmMs - msSinceMidnight
  const msUntilWeekend = msUntilFivePm + daysUntilFriday * 24 * 60 * 60 * 1000
  const secondsUntilWeekend = Math.floor(msUntilWeekend / 1000)
  return secondsUntilWeekend
}

export const WeekendCounter = () => {
  const [pixelsRemaining, setPixelsRemaining] = createSignal(maxSecondsUntilWeekend)
  let canvas: HTMLCanvasElement|undefined

  onMount(() => {
    if (!canvas) return
    const ctx = canvas?.getContext("2d")
    if (!ctx) return

    const start = () => {
      console.log("Starting weekend counter")

      const mapping = createPixelMapping()

      const catchUp = () => {
        const secondsUntilWeekend = getSecondsUntilWeekend()

        const imageData = ctx.getImageData(0, 0, canvasW, canvasW)
        const data = imageData.data
        for (let i = 0; i < mapping.length; i ++) {
          if (mapping[i] < secondsUntilWeekend) {
            data[4 * i] = 50
            data[4 * i + 1] = 180
            data[4 * i + 2] = 80
            data[4 * i + 3] = 255
          }
        }

        ctx.putImageData(imageData, 0, 0)
      }

      catchUp()

      const update = () => {

        const start = new Date()
        const midnight = new Date()
        midnight.setHours(0, 0, 0, 0)
        const day = start.getDay()
        const daysUntilFriday = fridayNumber - day
        const msSinceMidnight = start.getTime() - midnight.getTime()
        const fivePmMs = 17 * 60 * 60 * 1000
        const msUntilFivePm = fivePmMs - msSinceMidnight
        const msUntilWeekend = msUntilFivePm + daysUntilFriday * 24 * 60 * 60 * 1000
        const secondsUntilWeekend = Math.floor(msUntilWeekend / 1000)

        setPixelsRemaining(secondsUntilWeekend)

        // Color this pixel white
        const pixel = mapping[secondsUntilWeekend]
        let x = pixel % canvasW
        let y = Math.floor(pixel / canvasW)
    
        ctx.fillStyle = "green"
        ctx.fillRect(x, y, 1, 1)

        setTimeout(update, 1000)
      }

      update()
    }

    // Start once canvas becomes visible
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        start()
        observer.disconnect()
      }
    }, { threshold: 0.3 })

    observer.observe(canvas)
  })

  return (
    <div class="flex">
      <div class="mx-auto">
        <canvas ref={canvas} width={canvasW} height={canvasW} class="bg-black" />
        <h1 class="font-serif mt-2 text-lg">
          Weekend Countdown
        </h1>
        <p>
          Every second, one pixel turns green. The image is completely green at Friday 5pm.
        </p>
        <p>
          Only <span class="font-mono font-light">{pixelsRemaining()}</span> pixels remaining!
        </p>
      </div>
    </div>
  )
}