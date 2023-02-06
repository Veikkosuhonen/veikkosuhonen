import Audio from "~/components/Audio";
import Canvas from "~/components/Canvas";

export default function CanvasPage() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">
        Shader canvas
      </h1>
      <div class="flex justify-center w-full">
        <Canvas />
      </div>
      <div class="m-1">
        <Audio />
      </div>
    </main>
  )
};
