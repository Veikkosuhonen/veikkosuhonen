import { clientOnly } from "@solidjs/start"

// import ThreeBody from "~/experiments/threebody/ThreeBody";
const ThreeBody = clientOnly(() => import("../../experiments/threebody/ThreeBody"))

export default function() {
  return (

    <main class="flex-grow">
      <ThreeBody />
    </main>
  )
}
