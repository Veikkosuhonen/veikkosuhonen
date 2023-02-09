// @refresh reload
import { Suspense } from "solid-js"
import {
  useLocation,
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
import "./root.css"
export default function Root() {
  const location = useLocation()
  const active = (path) =>
    path == location.pathname
      ? "border-pink-800"
      : "border-transparent hover:border-pink-800"
  return (
    <Html lang="en" class="h-full">
      <Head>
        <Title>SolidStart - With TailwindCSS</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body class="bg-zinc-900 m-0 h-full flex flex-col">
        <Suspense>
          <ErrorBoundary>
            <nav class="bg-zinc-900">
              <ul class="container flex items-center p-3 text-gray-200">
                <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
                  <A href="/">Music visualizer</A>
                </li>
              </ul>
            </nav>
            <Routes>
              <FileRoutes />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  )
}
