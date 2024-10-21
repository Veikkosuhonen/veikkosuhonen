import { Icon } from "solid-heroicons"
import { sparkles } from "solid-heroicons/solid";
import { arrowTopRightOnSquare } from "solid-heroicons/solid-mini"
import { Component, createSignal, JSXElement } from "solid-js"
import { Background } from "~/components/Background";
import { CloudSvg } from "~/components/CloudSvg";
import { EmbersCanvas } from "~/experiments/embers/Canvas"
import { WeekendCounter } from "~/experiments/weekendCounter/WeekendCounter";

export default function Home() {

  const [embersOn, setEmbersOn] = createSignal(false);
  let yearsProgrammed = new Date().getFullYear() - 2015
  let yearsStudied = new Date().getFullYear() - 2019

  return (
    <>
    <Background bgUrl="/assets/reflections.svg" bgSize={512} />
    <main class="flex-grow flex flex-col relative items-center">
      <CloudSvg />
      <article class="p-8 sm:p-16 md:p-32 font-light container mx-auto">
        <h1 class="text-4xl font-serif flex gap-4 text-slate-900">
          Hi and welcome to my website!
          <button onMouseDown={() => setEmbersOn(!embersOn())}  class="hover:text-orange-600" classList={{ "text-red-600": embersOn() }}>
            <Icon path={sparkles} style="width: 24px"/>
          </button>
        </h1>
        <p class="mt-8 text-slate-900">
          This place is mainly for random browser apps & experiments I sometimes get an irresistible urge to make.
        </p>
        <div class="h-96 flex">
          <img src="/assets/me.jpg" class="h-20 w-20 md:h-32 md:w-32 object-cover ml-auto mt-auto brightness-75 rounded-full shadow-lg" />
        </div>
        <h2 class="text-4xl font-serif">About me</h2>
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
        <p class="mt-8 mb-48">
          Go check out the experiments section for some cool things
        </p>
        <WeekendCounter />
      </article>
    </main>
    </>
  )
}
