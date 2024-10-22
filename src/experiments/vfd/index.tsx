import { createSignal, For, onMount } from "solid-js"

export const Vfd = () => {
  const [value, setValue] = createSignal(123)
  const [text, setText] = createSignal("hello world")

  // onMount(() => {
  //   const interval = setInterval(() => {
  //     setValue((value() + 1) % 1000)
  //   }, 100)
// 
  //   return () => clearInterval(interval)
  // })

  return (
    <main class="container mx-auto">
      <h1 class="my-4">
        <Tint color="#F4DDBC">
          <VFDText value="7-segment displays using CSS" />
        </Tint>
      </h1>
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
        <VFDText value={text()} />
      </Tint>
    </main>
  )
}

export const VFDText = (props: { value: string }) => {

  const charsSegments = () => props.value.split('').map((char) => vfd_alphabet_segments[char.toLocaleLowerCase()] || [0, 0, 0, 0, 0, 0, 0])

  return (
    <div class="flex gap-4">
      <For each={charsSegments()}>
        {(segments) => <VFDDigit segments={segments} width="32px" height="64px" />}
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

const VFDDigit = (props: { segments: number[], width: string, height: string }) => {

  const horizontalWidth = '80%'
  const horizontalHeight = '6.25%'
  const verticalWidth = '12.5%'
  const verticalHeight = '45%'
  const borderRadius = '3xl'


  return (
    <div style={{ position: "relative", width: props.width, height: props.height, transform: "skew(-7deg)" }}>
      <VFDSegment on={props.segments[0]} class={`absolute h-[${horizontalHeight}] w-[${horizontalWidth}] right-[10%] rounded-b-${borderRadius}`}  />

      <VFDSegment on={props.segments[1]} class={`absolute h-[${verticalHeight}] w-[${verticalWidth}] top-[2.5%] rounded-r-${borderRadius}`} />
      <VFDSegment on={props.segments[2]} class={`absolute h-[${verticalHeight}] w-[${verticalWidth}] top-[2.5%] right-0 rounded-l-${borderRadius}`} />

      <VFDSegment on={props.segments[3]} class={`absolute h-[${horizontalHeight}] w-[${horizontalWidth}] top-[46.75%] right-[10%] rounded-t-${borderRadius} rounded-b-${borderRadius}`} />

      <VFDSegment on={props.segments[4]} class={`absolute h-[${verticalHeight}] w-[${verticalWidth}] bottom-[2.5%] rounded-r-${borderRadius}`} />
      <VFDSegment on={props.segments[5]} class={`absolute h-[${verticalHeight}] w-[${verticalWidth}] bottom-[2.5%] right-0 rounded-l-${borderRadius}`} />

      <VFDSegment on={props.segments[6]} class={`absolute h-[${horizontalHeight}] w-[${horizontalWidth}] bottom-0 right-[10%] rounded-t-${borderRadius}`} />
    </div>
  )
}

const VFDSegment = (props: { on: number, class: string }) => {
  return (
    <div class={props.class + (props.on ? ' bg-white' : ' bg-white/10')}
      style={{
        "box-shadow": props.on ? '0 0 1rem 0px white' : 'none',
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
  "g": [1, 1, 1, 1, 0, 1, 1],
  "h": [0, 1, 0, 1, 1, 1, 0],
  "i": [0, 0, 1, 0, 0, 1, 0],
  "j": [0, 1, 1, 0, 0, 1, 1],
  "k": [0, 1, 0, 1, 1, 0, 0],
  "l": [0, 1, 0, 0, 1, 0, 1],
  "m": [1, 1, 1, 0, 1, 1, 0],
  "n": [0, 0, 0, 1, 1, 1, 0],
  "o": [0, 0, 0, 1, 1, 1, 1],
  "p": [1, 1, 1, 1, 1, 0, 0],
  "q": [1, 1, 1, 1, 1, 1, 1],
  "r": [0, 0, 0, 1, 1, 0, 0],
  "s": [1, 1, 0, 1, 0, 1, 1],
  "t": [0, 1, 0, 1, 1, 0, 0],
  "u": [0, 1, 1, 0, 1, 1, 1],
  "v": [0, 1, 1, 0, 1, 1, 1],
  "w": [0, 0, 0, 0, 1, 1, 1],
  "x": [0, 1, 0, 1, 1, 0, 1],
  "y": [0, 1, 1, 1, 0, 1, 0],
  "z": [1, 0, 1, 1, 0, 1, 1],
}