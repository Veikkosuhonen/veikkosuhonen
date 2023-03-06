import { onMount } from "solid-js"
import AudioPlayer from "./Audio"
import Canvas from "./Canvas"
import Toasts, { toast } from "./Toasts"

export default function CanvasContainer() {
  onMount(() => toast("Hi there!"))

  return (
    <div class="bg-blue relative flex flex-col">
      <div class="w-full overflow-x-hidden">
        <AudioPlayer />
        <Toasts />
      </div>
      <div class="h-screen"/>
      <Canvas />
    </div>
  )
}
