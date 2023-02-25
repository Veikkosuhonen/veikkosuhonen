import { onCleanup, onMount } from "solid-js"
import { getTimeDomainData } from "./Audio"
import startRendering from "~/graphics/visualiser"
import { toast } from "./Toasts"

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
    try {
      cleanup = startRendering(
        canvas, textures,
      )
    } catch (error) {
      toast(error.message)
    }
  })

  onCleanup(() => {
    if (cleanup) cleanup()
  })

  return (
    <canvas ref={canvas} width="1280" height="720" class="bg-transparent w-full h-[90vh]"/>
  )
}
