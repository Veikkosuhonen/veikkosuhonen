import Audio from "./Audio"
import Canvas from "./Canvas"

export default function CanvasContainer() {
  return (
    <div class="bg-blue border border-b-8 border-zinc-900 relative h-full flex flex-col">
      <div class="object-left-bottom absolute m-4">
        <Audio />
      </div>
      <div class="flex-grow">
        <Canvas />
      </div>
    </div>
  )
}
