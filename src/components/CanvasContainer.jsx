import { onMount } from "solid-js"
import AudioPlayer from "./Audio"
import Canvas from "./Canvas"
import Toasts, { toast } from "./Toasts"

export default function CanvasContainer() {
  onMount(() => toast("Hi there!"))

  return (
    <div class="bg-blue border border-b-8 border-zinc-900 relative h-full flex flex-col">
      <div class="object-left-bottom absolute m-4">
        <AudioPlayer />
        <Toasts />
      </div>
      <div class="flex-grow">
        <Canvas />
      </div>
    </div>
  )
}
