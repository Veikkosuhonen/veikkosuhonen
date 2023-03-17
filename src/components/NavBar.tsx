import { A, useLocation } from "solid-start"

const NavBar = () => {
  const location = useLocation()
  const active = (path: string) =>
    path == location.pathname
      ? "border-pink-900"
      : "border-transparent hover:border-pink-900"

  return (
    <nav class="z-10">
      <ul class="container flex items-center p-2 text-gray-200">
        <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
          <A href="/">Home</A>
        </li>
        <li class={`border-b-2 ${active("/visualiser")} mx-1.5 sm:mx-6`}>
          <A href="/visualiser">Music visualizer</A>
        </li>
      </ul>
    </nav>
  )
}

export default NavBar