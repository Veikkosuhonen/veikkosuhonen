import { clientOnly } from "@solidjs/start"

const Water = clientOnly(() => import("../../experiments/water/Water"))

export default function() {
  return (

    <main class="flex-grow">
      <Water />
    </main>
  )
}
