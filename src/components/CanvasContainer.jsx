import { onMount } from "solid-js"
import AudioPlayer from "./Audio"
import Canvas from "./Canvas"
import Toasts, { toast } from "./Toasts"

export default function CanvasContainer() {
  onMount(() => toast("Hi there!"))

  return (
    <div class="bg-blue relative h-full flex flex-col">
      <div class="object-left-bottom absolute w-full overflow-hidden">
        <AudioPlayer />
        <Toasts />
      </div>
      <div class="flex-grow">
        <Canvas />
      </div>
    </div>
  )
}
