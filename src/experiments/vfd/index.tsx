import { createSignal, For } from "solid-js"

export default function() {
  const [value, setValue] = createSignal(123)
  const [text, setText] = createSignal("hello world")

  return (
    <main class="container mx-auto">
      <h1 class="my-4">
        <Tint color="#F4DDBC">
          <VFDText value="7-segment displays using CSS" width="32px" height="64px" />
        </Tint>
      </h1>
      <div class="mb-8">
        <a href="https://github.com/Veikkosuhonen/veikkosuhonen/blob/master/src/experiments/vfd/index.tsx" class="text-sunset-300 underline">(source code)</a>
      </div>
      <input 
        class="bg-black text-sunset-300 p-1 my-2 border border-sunset-400"
        type="number" 
        value={value()} 
        onInput={(e) => setValue((parseInt((e.target as HTMLInputElement).value) || 0) % 1000)} 
      />
      <Tint color="#9AEEFF">
        <VFDNumber value={value()} />
      </Tint>
      <input 
        class="bg-black text-sunset-300 p-1 my-2 border border-sunset-400"
        value={text()} 
        onInput={(e) => setText((e.target as HTMLInputElement).value)}
      />
      <Tint color="#EBFEFE">
        <VFDText value={text()} width="16px" height="32px" />
      </Tint>
      <div class="my-4" />
      <Tint color="#aaffaa">
        <VFDText glowRadius="2rem" value="As you can see 7 segments is not quite enough for nice text. It's still somewhat readable though. Some letters, such as M and N are not distinguishable, instead they rely on the readers ability to guess. For example, KNIGHT, XENON and HERO are quite ugly" width="12px" height="24px" />
      </Tint>
      <Tint color="#aaaaff">
        <VFDText value="Ive hardcoded the character-segment encodings so most special characters dont work" width="14px" height="28px" />
      </Tint>
    </main>
  )
}

export const VFDText = (props: { value: string, width: string, height: string, glowRadius?: string }) => {
  const glowR = props.glowRadius || '1rem'

  const charsSegments = () => props.value.split('').map((char) => vfd_alphabet_segments[char.toLocaleLowerCase()] || [0, 0, 0, 0, 0, 0, 0])

  return (
    <div class="flex flex-wrap gap-4">
      <For each={charsSegments()}>
        {(segments) => <VFDDigit segments={segments} width={props.width} height={props.height} glowRadius={glowR} />}
      </For>
    </div>
  )
}

const VFDNumber = (props: { value: number }) => {
  const d0 = () => Math.floor(props.value / 100)
  const d1 = () => Math.floor(props.value / 10) % 10
  const d2 = () => props.value % 10

  return (
    <div class="flex gap-8">
      <VFDDigit segments={vfd_digit_segments[d0()]} width="32px" height="64px" />
      <VFDDigit segments={vfd_digit_segments[d1()]} width="32px" height="64px" />
      <VFDDigit segments={vfd_digit_segments[d2()]} width="32px" height="64px" />
    </div>
  )
}

const VFDDigit = (props: { segments: number[], width: string, height: string, glowRadius?: string }) => {
  const glowR = props.glowRadius || '1rem'

  const hw = '80%'
  const hh = '6.25%'
  const vw = '12.5%'
  const vh = '45%'


  return (
    <div style={{ position: "relative", width: props.width, height: props.height, transform: "skew(-7deg)" }}>
      <VFDSegment on={props.segments[0]} w={hw} h={hh} glowRadius={glowR}class={`absolute right-[10%] rounded-b-3xl`}  />

      <VFDSegment on={props.segments[1]} w={vw} h={vh} glowRadius={glowR}class={`absolute top-[2.5%] rounded-r-3xl`} />
      <VFDSegment on={props.segments[2]} w={vw} h={vh} glowRadius={glowR}class={`absolute top-[2.5%] right-0 rounded-l-3xl`} />

      <VFDSegment on={props.segments[3]} w={hw} h={hh} glowRadius={glowR}class={`absolute top-[46.75%] right-[10%] rounded-t-3xl rounded-b-3xl`} />

      <VFDSegment on={props.segments[4]} w={vw} h={vh} glowRadius={glowR}class={`absolute bottom-[2.5%] rounded-r-3xl`} />
      <VFDSegment on={props.segments[5]} w={vw} h={vh} glowRadius={glowR}class={`absolute bottom-[2.5%] right-0 rounded-l-3xl`} />

      <VFDSegment on={props.segments[6]} w={hw} h={hh} glowRadius={glowR} class={`absolute bottom-0 right-[10%] rounded-t-3xl`} />
    </div>
  )
}

const VFDSegment = (props: { on: number, class: string, h: string, w: string, glowRadius: string }) => {
  return (
    <div class={props.class + (props.on ? ' bg-white' : ' bg-white/10')}
      style={{
        width: props.w,
        height: props.h,
        "box-shadow": props.on ? `0 0 ${props.glowRadius} 0px white` : 'none',
      }}
    />
  )
}

export const Tint = (props: { children: any, color: string }) => {
  return (
    <div class="relative p-[1rem]">
      {props.children}
      <div style={{
        "background-color": props.color,
        "mix-blend-mode": "multiply",
        "position": "absolute",
        "top": 0,
        "left": 0,
        "right": 0,
        "bottom": 0,
      }}/>
    </div>
  )
}


const vfd_digit_segments = [
  [1, 1, 1, 0, 1, 1, 1], // 0
  [0, 0, 1, 0, 0, 1, 0], // 1
  [1, 0, 1, 1, 1, 0, 1], // 2
  [1, 0, 1, 1, 0, 1, 1], // 3
  [0, 1, 1, 1, 0, 1, 0], // 4
  [1, 1, 0, 1, 0, 1, 1], // 5
  [1, 1, 0, 1, 1, 1, 1], // 6
  [1, 0, 1, 0, 0, 1, 0], // 7
  [1, 1, 1, 1, 1, 1, 1], // 8
  [1, 1, 1, 1, 0, 1, 1], // 9
]

const vfd_alphabet_segments: Record<string, number[]> = {
  "a": [1, 1, 1, 1, 1, 1, 0],
  "b": [0, 1, 0, 1, 1, 1, 1],
  "c": [1, 1, 0, 0, 1, 0, 1],
  "d": [0, 0, 1, 1, 1, 1, 1],
  "e": [1, 1, 0, 1, 1, 0, 1],
  "f": [1, 1, 0, 1, 1, 0, 0],
  "g": [1, 1, 0, 0, 1, 1, 1],
  "h": [0, 1, 0, 1, 1, 1, 0],
  "i": [0, 1, 0, 0, 1, 0, 0],
  "j": [0, 0, 1, 0, 0, 1, 1],
  "k": [0, 1, 0, 1, 1, 0, 0],
  "l": [0, 1, 0, 0, 1, 0, 1],
  "m": [0, 0, 0, 1, 1, 1, 0],
  "n": [1, 1, 1, 0, 1, 1, 0],
  "o": [0, 0, 0, 1, 1, 1, 1],
  "p": [1, 1, 1, 1, 1, 0, 0],
  "q": [1, 1, 1, 1, 0, 1, 0],
  "r": [0, 0, 0, 1, 1, 0, 0],
  "s": [1, 1, 0, 1, 0, 1, 1],
  "t": [0, 1, 0, 1, 1, 0, 1],
  "u": [0, 1, 1, 0, 1, 1, 1],
  "v": [0, 1, 1, 0, 1, 1, 1],
  "w": [0, 0, 0, 0, 1, 1, 1],
  "x": [0, 1, 1, 1, 1, 1, 0],
  "y": [0, 1, 1, 1, 0, 1, 1],
  "z": [1, 0, 1, 1, 0, 1, 1],
  "7": [1, 0, 1, 0, 0, 1, 0],
  "-": [0, 0, 0, 1, 0, 0, 0],
}