// @refresh reload
import { Suspense } from "solid-js"
import {
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start"
import NavBar from "./components/NavBar"
import "./root.css"
export default function Root() {
  
  return (
    <Html lang="en" class="h-full">
      <Head>
        <Title>SolidStart - With TailwindCSS</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body class="bg-black m-0 flex flex-col">
        <Suspense>
          <ErrorBoundary>
            <NavBar />
            <Routes>
              <FileRoutes />
            </Routes>
            <footer class="p-16 text-slate-600 text-xs select-none">
              Look at this footer, it's wonderful isn't it. Imagine all the things it could do, it could have a quick sitemap for you to get around, or perhaps display links to my socials such as twitter, instagram and linkedin where im so very active and it could advertise my discord and slack fan club servers which I definitely have or beg you to give me money in patreon or kofi, and of course have big button for my youtube and twitch where I literally never have even commented anything. yes as you may have guessed, this footer is actually completely useless, because I dont have any links to show to you. otherwise I wouldnt write this extremely awkward lorem ipsum. Anyways, one link might be interesting if you want to check out the source code (beware, its quite a mayhem at times). its 
              <a class="text-pink-600 hover:underline" href="https://www.github.com/Veikkosuhonen/veikkosuhonen">github.com/Veikkosuhonen/veikkosuhonen</a>. see you around!
            </footer>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  )
}
