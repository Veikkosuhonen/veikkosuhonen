import { Icon } from "solid-heroicons"
import { sparkles } from "solid-heroicons/solid";
import { arrowTopRightOnSquare } from "solid-heroicons/solid-mini"
import { createSignal } from "solid-js"
import { EmbersCanvas } from "~/components/embers/Canvas"

export default function Home() {

  const [embersOn, setEmbersOn] = createSignal(true);
  let yearsProgrammed = new Date().getFullYear() - 2015
  let yearsStudied = new Date().getFullYear() - 2019

  return (

    <main class="flex-grow flex flex-col relative mt-12">
      <article class="px-8 font-light container mx-auto">
        <h1 class="text-4xl mt-8 font-serif flex gap-4">
          Hi and welcome to my website!
          <button onClick={() => setEmbersOn(!embersOn())}  class="hover:text-orange-600" classList={{ "text-red-600": embersOn() }}>
            <Icon path={sparkles} style="width: 24px"/>
          </button>
        </h1>
        <p class="mt-8">
          This site is mainly for random browser apps I sometimes get an irresistible urge to make, and for some of that portfolio stuff. I might even write a blogpost one day.
        </p>
        <h2 class="text-4xl mt-16 font-serif">About me</h2>
        <p class="mt-8">
          I'm Veikko, a software engineer from Helsinki, Finland with a positive look on life, the universe and everything.
          Like everybody else, I mostly work in the JavaScript land as a fullstack developer, 
          enjoying the holistic approach to solving real problems with tech. 
          <br/>
          <span class="text-xs">I won't bother namedropping the technologies, you can visit my 
          <a href="https://linkedin.com/in/veikko-suhonen-394751230" target="_blank" class="underline text-indigo-300">LinkedIn page <Icon path={arrowTopRightOnSquare} style="width: 12px; display: inline;"/></a></span>
        </p>
        <p class="mt-8">
          I've been studying computer science for <span>{yearsStudied}</span> years, with <span>{yearsProgrammed}</span> years of experience in programming.
          During that time, I've most enjoyed 
          <span>graphics & game programming</span>, <span>shader development</span>, writing a <a>compiler from scratch</a> and building a bunch of web apps.
          Some of the stuff I do is public at <a href="https://github.com/Veikkosuhonen" target="_blank" class="underline text-fuchsia-400">github.com/Veikkosuhonen <Icon path={arrowTopRightOnSquare} style="width: 12px; display: inline;"/></a>
        </p>
        <p class="mt-8">
          When I was a kid, I wanted to be a scientist. That hasn't really changed, 
          I think that the scientific method and quest for new knowledge and truth are the philosophies to live by.
          <br/>
          Lately I've been a little bit into astronomy and astrophotography and want to eventually develop my own 
          <a>lucky-imaging</a> software stack. Stay tuned for any results...
        </p>
      </article>
      <EmbersCanvas embersOn={embersOn()} />
    </main>
  )
}
