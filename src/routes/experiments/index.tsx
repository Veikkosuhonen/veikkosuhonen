import { createMousePosition, createPositionToElement } from "@solid-primitives/mouse";
import { Component, createSignal } from "solid-js"
import { createSpring, animated, config } from "solid-spring";

const experiments = [
  {
    title: "Music visualizer",
    path: "/experiments/visualiser",
    imageUrl: "https://live.staticflickr.com/65535/53454330580_a754211f15_k.jpg",
    text: "A WebGL music visualizer using web audio api. File & microphone support, and lots of tweakable sliders!"
  },
  {
    title: "Terrain generator",
    path: "/experiments/terrain",
    imageUrl: "https://live.staticflickr.com/65535/53453915506_a6ee5ec899_h.jpg",
    text: "Interactive terrain simulation with procedural generation, erosion and lighting. A little demonstration of how plain old WebGL can be used for general-purpose GPU compute."
  },
  {
    title: "A&A combat simulator",
    path: "/experiments/aa-combat-sim",
    imageUrl: "https://live.staticflickr.com/65535/53522237177_8ffbc5dc64_k.jpg",
    text: "A simple Axis & Allies combat simulator."
  },
  {
    title: "Three-body problem",
    path: "/experiments/threebody",
    imageUrl: "https://live.staticflickr.com/65535/53641516895_18e82c9df5_h.jpg",
    text: "Visit Alpha Centauri AKA Trisolaris and see the three-body problem in action."
  }
]
const ImageLink: Component<{ title: string, path: string, imageUrl: string }>  = (props) => {
  let cardElement: HTMLDivElement|undefined
  const mouse = createMousePosition(cardElement);
  const relative = createPositionToElement(() => cardElement, () => mouse);
  const [rotation, setRotation] = createSignal([0, 0])

  const styles = createSpring(() => ({
    to: {
      transform: `rotateX(${-rotation()[1]}deg) rotateY(${rotation()[0]}deg)`,
    },
    from: {
      transform: `rotateX(0deg) rotateY(0deg)`,
    },
    config: config.wobbly,
  }));

  const updateRotation = () => {
    if (!cardElement || !mouse.isInside) return
    const x = relative.x / cardElement.offsetWidth - 0.5
    const y = relative.y / cardElement.offsetHeight - 0.5
    setRotation([x * 30, y * 30])
  }

  return (
    <div class="overflow-visible w-100 h-100 font-serif" ref={cardElement} style={{ perspective: "800px" }} onMouseLeave={() => setRotation([0, 0])}>
      <animated.a 
        href={props.path}
        class="w-100 h-100 rounded-md shadow-xl shadow-slate-800/50 hover:shadow-fuchsia-500/50 border border-black hover:border-fuchsia-200 text-transparent hover:text-white text-4xl font-bold flex items-center justify-center px-8 py-16 transition-colors duration-200 z-10"
        style={{ transform: styles().transform, "background-image": `url(${props.imageUrl})`, "background-size": "cover", "mix-blend-mode": "multiply" }}
        onMouseMove={updateRotation}
      >
        {props.title}
      </animated.a>
    </div>
  )
}

const Experiment: Component<{ title: string, path: string, imageUrl: string, text: string }>  = (props) => {
  const [expanded, setExpanded] = createSignal(false)
  let timeoutId: number|undefined

  const styles = createSpring(() => ({
    to: {
      translateY: expanded() ? 0 : -100,
      opacity: expanded() ? 1 : 0,
    },
    from: {
      translateY: -100,
      opacity: 0,
    },
    config: config.gentle,
  }));

  const onMouseEnter = () => {
    clearTimeout(timeoutId)
    setExpanded(true)
  }

  const onMouseLeave = () => {
    timeoutId = setTimeout(() => setExpanded(false), 1000) as any as number
  }

  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} class="aspect-[3/2] w-[30vw]">
      <div class="rounded-lg bg-slate-900 px-2 pt-1 pb-2">
        <ImageLink title={props.title} path={props.path} imageUrl={props.imageUrl}/>
      </div>
      <animated.p class="text-slate-200 font-light rounded-lg p-4 mt-2 -z-10 bg-slate-900/90" style={styles()}>
        {props.text}
      </animated.p>
    </div>
  )
}

export default function Experiments() {
  

  return (

    <main class="flex-grow relative mt-12">
      <article class="container mx-auto">
        <h1 class="text-6xl font-serif mt-8">
          Experiments
        </h1>
        <p class="text-slate-200 mb-8 mt-8 w-96 font-light">
          This is a small collection of some graphics-related web experiments I've made for fun, and put on this website.
        </p>
        <section>
          <div class="flex gap-4 mb-4">
            {experiments.map((experiment) => (
              <Experiment title={experiment.title} path={experiment.path} imageUrl={experiment.imageUrl} text={experiment.text} />
            ))}
          </div>
        </section>
      </article>
    </main>
  )
}
  