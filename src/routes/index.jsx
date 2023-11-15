import { For, createSignal, onMount } from "solid-js"
import { isServer } from "solid-js/web"
import { createSpring, animated } from "solid-spring"

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
]

const createFilter = () => {
  const count = Math.ceil(Math.random() * 2.0)
  let filter = ""
  for (let i = 0; i < count; i++) {
    filter += filters.at(Math.floor(Math.random() * filters.length))() + " "
  }

  return filter
}

const RandomFilter = (props) => {

  const [filter, setFilter] = createSignal(createFilter())

  return (
    <animated.div class="absolute" style={{
      transform: `rotateX(20deg) rotateY(${props.rotation}deg) translateZ(700px)`
    }}>
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
    </animated.div>
  )
}

export default function Home() {
  const rows = []
  for (let i = 0; i < 15; i++) {
    rows.push(i)
  }

  
  //const [targetRotation, setTargetRotation] = createSignal(0)
  // const [previousTargetRotation, setPreviousTargetRotation] = createSignal(0)

  /*onMount(() => {
    if (!isServer) {
      window.addEventListener("scroll", () => {
        setTargetRotation(window.scrollY / 10)
      })
    }
  })*/

  /*const spring = createSpring(() => ({
    from: {
      value: previousTargetRotation()
    },
    to: {
      value: targetRotation()
    },
  
    onRest: () => setPreviousTargetRotation(targetRotation()),
  }))*/

  return (

    <main class="flex-grow relative">
      <div class="w-full my-20" style={{
        transform: "scale(0.5) translateX(500px)",
        rotate: "0",
      }}>
        <For each={rows}>{(y) => 
          <div class="relative" style={{ transform: `translateY(${(15 - y) * 220}px)` }}>
            <For each={rows}>{(i) =>
              <RandomFilter rotation={i * (360 / 15)} y={y} />
            }</For>
          </div>
        }</For>
      </div>
      
    </main>
  )
}
