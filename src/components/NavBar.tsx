import { useLocation, A, useBeforeLeave } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import { createSpring, animated, config } from "solid-spring";

const links: { href:string, text:string, el:HTMLAnchorElement|undefined }[] = [
  { href: "/", text: "Home", el: undefined },
  { href: "/projects", text: "Project Showcase", el: undefined },
]

const NavBar = () => {
  const location = useLocation()

  const [offsetLeft, setOffsetLeft] = createSignal("0px")
  const [previousOffsetLeft, setPreviousOffsetLeft] = createSignal("0px")
  const [width, setWidth] = createSignal("0px")
  const [previousWidth, setPreviousWidth] = createSignal("0px")

  const styles = createSpring(() => ({
    to: {
      left: offsetLeft(),
      width: width(),
    },
    from: {
      left: previousOffsetLeft(),
      width: previousWidth(),
    },
    config: config.gentle,
  }));

  const handleLocationChange = (to: string|number) => {
    setPreviousOffsetLeft(offsetLeft())
    setPreviousWidth(width())
    const nextLink = links.find(link => link.href === to)
    if (nextLink) {
      setOffsetLeft(`${nextLink.el?.offsetLeft}px`)
      setWidth(`${nextLink.el?.offsetWidth}px`)
    }
  }

  useBeforeLeave((e) => handleLocationChange(e.to))

  onMount(() => handleLocationChange(location.pathname))

  return (
    <nav class="z-10 relative mb-10">
      <div class="h-[2px] mb-4"/>
      <ul class="container flex flex-wrap items-center p-1 text-gray-300 overflow-hidden">
        {links.map((link) => (
          <li class='mx-1.5 sm:mx-6'>
            <A 
              href={link.href} 
              ref={link.el}
              class="hover:text-white transition-colors duration-200 text-nowrap font-serif"
              activeClass="text-pink-50"
            >
              {link.text}
            </A>
          </li>
        ))}
      </ul>
      <animated.div class="absolute top-11 left-0 right-0 h-2 bg-gradient-to-r from-sunset-100 to-sunset-400 rounded-md" style={styles()} />
    </nav>
  )
}

export default NavBar