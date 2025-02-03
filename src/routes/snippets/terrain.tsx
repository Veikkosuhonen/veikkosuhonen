import { clientOnly } from "@solidjs/start"

// import CanvasContainer from "~/experiments/terrain/CanvasContainer"
const CanvasContainer = clientOnly(() => import("~/experiments/terrain/CanvasContainer"))

export default function Terrain() {
  return (

    <main class="flex-grow">
      <CanvasContainer />
    </main>
  )
}
