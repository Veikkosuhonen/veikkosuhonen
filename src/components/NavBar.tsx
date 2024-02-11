import { useLocation, A, useBeforeLeave } from "@solidjs/router";
import { createEffect, createSignal, onMount } from "solid-js";
import { createSpring, animated, config } from "solid-spring";

const links: { href:string, text:string, el:HTMLAnchorElement|undefined }[] = [
  { href: "/", text: "Home", el: undefined },
  { href: "/experiments", text: "Experiments", el: undefined },
  { href: "/about", text: "About me", el: undefined },
  { href: "/a-long-text-for-testing", text: "A long text for testing this spring navbar effect :D", el: undefined },
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
    <nav class="z-10 relative mb-2">
      <div class="h-[2px] bg-gradient-to-r from-purple-900 to-pink-900 mb-4"/>
      <ul class="container flex items-center p-2 text-gray-300">
        {links.map((link) => (
          <li class='mx-1.5 sm:mx-6'>
            <A 
              href={link.href} 
              ref={link.el}
              class="hover:text-white transition-colors duration-200"
              activeClass="text-pink-50"
            >
              {link.text}
            </A>
          </li>
        ))}
      </ul>
      <animated.div class="absolute top-12 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md" style={styles()} />
    </nav>
  )
}

export default NavBar