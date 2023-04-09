import { onCleanup, onMount } from "solid-js"
import startRendering, { setCanvasSize } from "~/graphics/visualiser"
import { toast } from "../Toasts"

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

    try {
      if (canvas) {
        cleanup = startRendering(canvas)

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
    <canvas ref={canvas} width={1080} height={1080} 
      class="bg-transparent fixed top-0 w-full h-screen -z-50" 
    />
  )
}
