import { onMount } from "solid-js"
import Canvas, { frameTime } from "./Canvas"
import Toasts, { toast } from "../../components/Toasts"

export default function CanvasContainer() {
  onMount(() => toast("Hi there!"))

  return (
    <div class="bg-blue relative flex flex-col">
      <div class="w-full overflow-x-hidden">
        <div class="flex w-full">
          <Toasts />
          <section class="ml-auto bg-black/30 rounded-md m-1 p-2 text-slate-200">
            <h3 class="text-lg">Guide</h3>
            <div class="text-sm">WASD to move around</div>
            <div class="text-sm">Scroll to zoom</div>
            <div class="text-sm">Hold E to water your island</div>
            <div class="text-sm">Reload to get a new island</div>
            <div class="text-sm">Warning: may eat your battery life!</div>
            <div class="text-sm">Fps: {(1000.0 / frameTime()).toFixed()}</div>
          </section>
        </div>
      </div>
      <Canvas />
    </div>
  )
}
