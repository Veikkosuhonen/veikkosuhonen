import { onCleanup, onMount } from "solid-js"
import { getTimeDomainData } from "./Audio"
import startRendering, { setCanvasSize, TextureConfig } from "~/graphics/visualiser"
import { toast } from "./Toasts"

export default function Canvas() {
  let canvas: HTMLCanvasElement|undefined
  let cleanup: () => void|undefined

  const resize = () => {
    const size = [
      canvas?.offsetWidth ?? 1080,
      canvas?.offsetHeight ?? 1080,
    ]
    setCanvasSize(size)
  }

  onMount(() => {

    const textures: TextureConfig[] = [
      {
        size: [512, 2],
        provider: () => getTimeDomainData(),
        name: "u_freq",
      },
    ]
    try {
      if (canvas) {
        cleanup = startRendering(
          canvas, textures,
        )

        addEventListener("resize", resize)
        resize()
      }

    } catch (error: any) {
      toast(error.message)
    }
  })

  onCleanup(() => {
    if (cleanup) cleanup()
  })

  return (
    <canvas ref={canvas} width={1080} height={1080} class="bg-transparent w-full h-[94vh]" 
    />
  )
}
