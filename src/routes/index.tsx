import { Icon } from "solid-heroicons"
import { sparkles } from "solid-heroicons/solid";
import { arrowTopRightOnSquare } from "solid-heroicons/solid-mini"
import { createSignal } from "solid-js"
import { EmbersCanvas } from "~/experiments/embers/Canvas"

export default function Home() {

  const [embersOn, setEmbersOn] = createSignal(false);
  let yearsProgrammed = new Date().getFullYear() - 2015
  let yearsStudied = new Date().getFullYear() - 2019

  return (

    <main class="flex-grow flex flex-col relative mt-12">
      <article class="px-8 font-light container mx-auto">
        <h1 class="text-4xl mt-8 font-serif flex gap-4">
          Hi and welcome to my website!
          <button onMouseDown={() => setEmbersOn(!embersOn())}  class="hover:text-orange-600" classList={{ "text-red-600": embersOn() }}>
            <Icon path={sparkles} style="width: 24px"/>
          </button>
        </h1>
        <p class="mt-8">
          This place is mainly for random browser apps & experiments I sometimes get an irresistible urge to make.
        </p>
        <h2 class="text-4xl mt-16 font-serif">About me</h2>
        <p class="mt-8">
          I'm Veikko, a software engineer from Helsinki with a positive look on life, the universe and everything.
          Like everybody else, I mostly work in the JS mines, but I've also experience with Java, Python, Ruby, C++, C# and Rust.
          <br/>
          <span class="text-xs">If you care, you can check out my
          <a href="https://linkedin.com/in/veikko-suhonen-394751230" target="_blank" class="underline text-indigo-300">LinkedIn page <Icon path={arrowTopRightOnSquare} style="width: 12px; display: inline;"/></a></span>
        </p>
        <p class="mt-8">
          I've been studying computer science for <span>{yearsStudied}</span> years, with <span>{yearsProgrammed}</span> years of experience in programming.
          During that time, I've most enjoyed 
          <span>graphics & game development</span>, <span>shader development</span>, writing a <a>compiler from scratch</a> and building a bunch of web apps.
        </p>
        <p class="mt-8">
          Go check out the experiments section for some cool things
        </p>
      </article>
      <EmbersCanvas embersOn={embersOn()} />
    </main>
  )
}
