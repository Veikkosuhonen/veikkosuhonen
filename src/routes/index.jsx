import { For, createSignal } from "solid-js"

const images = [
  "https://lh6.googleusercontent.com/qTbpnImpsm9m2fXHJiG9bPhw2d7FJQBH96tVBehwZlyuFNaAhK1pWbgCbsVJXOc_OPw=w2400",
]

const f = (a) => Math.floor(Math.random() * a)

const filters =[
  () => `grayscale(${f(100)}%)`,
  () => `blur(${f(5)}px)`,
  () => `invert(${f(100)}%)`,
  () => `hue-rotate(${f(360)}deg)`,
  () => `saturate(${f(100)}%)`,
  () => `sepia(${f(100)}%)`,
  () => `contrast(${f(50) + 75}%)`,
  () => `drop-shadow(3px 3px 6px hsl(${f(9751) % 360}, ${f(75391) % 100}%, ${f(135917) % 40}%))`,
]

const createFilter = () => {
  const count = Math.ceil(Math.random() * 2.0)
  let filter = ""
  for (let i = 0; i < count; i++) {
    filter += filters.at(Math.floor(Math.random() * filters.length))() + " "
  }

  return filter
}

const RandomFilter = () => {
  const [filter, setFilter] = createSignal(createFilter())

  return (
    <div class="m-2 relative">
      <img 
        src={images[0]}
        loading="lazy" 
        crossOrigin="anonymous"
        width="300px"
        style={{ filter: filter() }}
        class="opacity-100 hover:opacity-10 transition-opacity duration-300"
        onClick={() => setFilter(createFilter())}
      />
      <div class="absolute w-full h-full bg-black text-white -z-10 text-xs font-mono top-0 p-1 overflow-hidden">
        {filter()}
      </div>
    </div>
  )
}

export default function Home() {
  const rows = []
  for (let i = 0; i < 15; i++) {
    rows.push(i)
  }

  return (

    <main class="flex-grow relative">
      <div class="w-full my-20">
        <For each={rows}>{() => 
          <div class="flex">
            <For each={rows}>{() =>
              <RandomFilter />
            }</For>
          </div>
        }</For>
      </div>
      
    </main>
  )
}
