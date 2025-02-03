import { createMousePosition, createPositionToElement } from "@solid-primitives/mouse";
import { Component, createSignal } from "solid-js"
import { createSpring, animated, config } from "solid-spring";
import { Background } from "~/components/Background";

const snippets = [
  {
    title: "Music visualizer",
    path: "/snippets/visualiser",
    imageUrl: "https://live.staticflickr.com/65535/53454330580_a754211f15_k.jpg",
    text: "A WebGL music visualizer using web audio api. File & microphone support, and lots of tweakable sliders!"
  },
  {
    title: "Terrain generator",
    path: "/snippets/terrain",
    imageUrl: "https://live.staticflickr.com/65535/53453915506_a6ee5ec899_h.jpg",
    text: "Interactive terrain simulation with procedural generation, erosion and lighting. A little demonstration of how plain old WebGL can be used for general-purpose GPU compute."
  },
  {
    title: "A&A combat simulator",
    path: "/snippets/aa-combat-sim",
    imageUrl: "https://live.staticflickr.com/65535/53522237177_8ffbc5dc64_k.jpg",
    text: "A simple Axis & Allies combat simulator."
  },
  {
    title: "Three-body problem",
    path: "/snippets/threebody",
    imageUrl: "https://live.staticflickr.com/65535/53641516895_18e82c9df5_h.jpg",
    text: "Visit Alpha Centauri AKA Trisolaris and see the three-body problem in action."
  },
  {
    title: "Island",
    path: "/snippets/water",
    imageUrl: "https://live.staticflickr.com/65535/53914487061_c13c24abdf_h.jpg",
    text: "3D procedurally generated ocean & island"
  },
  {
    title: "VFD",
    path: "/snippets/vfd",
    imageUrl: "https://live.staticflickr.com/65535/54086978014_65b06268c5_h.jpg",
    text: "VFD displays in CSS"
  },
]

const projects = [
  {
    title: "Git Viz",
    url: "https://git-viz.vercel.app/",
    // <a data-flickr-embed="true" href="https://www.flickr.com/photos/199880417@N08/54305425270/in/dateposted-public/" title="git-viz"><img src="https://live.staticflickr.com/65535/54305425270_5d1f41bca2_h.jpg" width="1600" height="814" alt="git-viz"/></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>
    imageUrl: "https://live.staticflickr.com/65535/54305425270_5d1f41bca2_h.jpg",
    text: "Visualizing source code relations and code ownership: an interactive data visualization project",
  },
  {
    title: "City demo",
    url: "https://veikkosuhonen.github.io/three-deferred-rp",
    // <a data-flickr-embed="true" href="https://www.flickr.com/photos/199880417@N08/54305234064/in/dateposted-public/" title="threejs-city"><img src="https://live.staticflickr.com/65535/54305234064_d531489e5e_h.jpg" width="1600" height="888" alt="threejs-city"/></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>
    imageUrl: "https://live.staticflickr.com/65535/54305234064_d531489e5e_h.jpg",
    text: "A procedural city demonstrating some high quality deferred rendering techniques and effects (warning you need an M1 laptop or better to run this)",
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
        class="w-100 h-100 rounded-md shadow-xl shadow-sunset-600/50 hover:shadow-sunset-400/50 border border-black hover:border-sunset-300 text-transparent hover:text-white text-4xl font-bold flex items-center justify-center px-8 py-16 transition-colors duration-200 z-10"
        style={{ transform: styles().transform, "background-image": `url(${props.imageUrl})`, "background-size": "cover", "mix-blend-mode": "multiply" }}
        onMouseMove={updateRotation}
      >
        {props.title}
      </animated.a>
    </div>
  )
}

const ProjectCard: Component<{ title: string, path: string, imageUrl: string, text: string, nth: number }>  = (props) => {
  const [expanded, setExpanded] = createSignal(false)

  setTimeout(() => setExpanded(true), 100 * props.nth)

  const styles = createSpring(() => ({
    to: {
      translateY: expanded() ? 0 : -100,
      opacity: expanded() ? 1 : 0,
    },
    from: {
      translateY: -100,
      opacity: 0,
    },
    config: config.slow,
  }));

  return (
    <div class="aspect-[3/2] w-80">
      <ImageLink title={props.title} path={props.path} imageUrl={props.imageUrl}/>
      <animated.p class="text-slate-200 font-light rounded-lg p-4 mt-2 -z-10" style={styles()}>
        {props.text}
      </animated.p>
    </div>
  )
}

export default function Projects() {
  

  return (
    <>
    <Background bgUrl="/assets/grid.svg" bgSize={256} />
    <main class="flex-grow relative mt-12 mx-2">
      <article class="container mx-auto">
        <h1 class="text-6xl font-serif mt-8">
          Project Showcase
        </h1>
        <h2 class="text-3xl font-serif mt-8">
          Snippets
        </h2>
        <p class="text-slate-200 mb-8 mt-8 w-96 font-light">
          A small of some graphics-related web experiments I've made for fun and put on this website.
          All source code is in the{" "}
          <a href="https://github.com/Veikkosuhonen/veikkosuhonen/blob/master/src/experiments" class="text-sunset-300 underline">website's repo</a>
        </p>
        <section>
          <div class="flex flex-wrap gap-2">
            {snippets.map((snippet, idx) => (
              <ProjectCard title={snippet.title} path={snippet.path} imageUrl={snippet.imageUrl} text={snippet.text} nth={idx} />
            ))}
          </div>
        </section>
        <h2 class="text-3xl font-serif mt-8">
          Other projects you can try
        </h2>
        <p class="text-slate-200 mb-8 mt-8 w-96 font-light">
          I like making stuff available in the public web if I can. Here's a couple "research" projects I've made that you can try out.
        </p>
        <section>
          <div class="flex flex-wrap gap-2">
            {projects.map((project, idx) => (
              <ProjectCard title={project.title} path={project.url} imageUrl={project.imageUrl} text={project.text} nth={idx} />
            ))}
          </div>
        </section>
      </article>
    </main>
    </>
  )
}
