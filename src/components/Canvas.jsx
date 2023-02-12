import { onCleanup, onMount } from "solid-js"
import { getTimeDomainData } from "./Audio"
import startRendering from "~/graphics/visualiser"

export default function Canvas() {
  let canvas
  let cleanup

  onMount(() => {

    const textures = [
      {
        size: [512, 2],
        provider: () => getTimeDomainData(),
        name: "u_freq",
      },
    ]

    cleanup = startRendering(
      canvas, textures,
    )
  })

  onCleanup(() => {
    if (cleanup) cleanup()
  })

  return (
    <canvas ref={canvas} width="1280" height="720" class="bg-transparent w-full h-[90vh]"/>
  )
}
