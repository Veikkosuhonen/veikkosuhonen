import { clientOnly } from "@solidjs/start"

const CanvasContainer = clientOnly(() => import("~/experiments/visualiser/CanvasContainer"))

export default function Visualiser() {
  return (

    <main class="flex-grow">
      <CanvasContainer />
    </main>
  )
}
