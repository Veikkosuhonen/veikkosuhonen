import { Component, JSX, Show, createEffect, createSignal, onMount } from "solid-js";
import { Icon } from "solid-heroicons";
import { pause, play } from "solid-heroicons/solid";
import cn from "classnames"

const ScalingIcon: Component<{ path: { path: JSX.Element, outline: boolean, mini: boolean } }> = (props) => {

  return (
    <Icon 
      path={props.path} 
      class="w-6 h-6 sm:w-8 sm:h-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
    />
  )
}

const Player: Component<{ audio: HTMLAudioElement|null, name: string|null, duration: number, isMicrophone: boolean, isPlaying: boolean, togglePlay: () => void }> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false)
  const [currentTime, setCurrentTime] = createSignal(0)

  const onSeek = (time: number) => {
    if (props.audio) {
      props.audio.currentTime = time
      setCurrentTime(time)
    }
  }

  onMount(() => {
    setInterval(() => {
      if (props.audio && !isDragging()) {
        setCurrentTime(props.audio.currentTime)
      }
    }, 100)
    props.audio?.addEventListener("ended", () => setCurrentTime(0))
  })

  return (
    <div class={cn("fixed top-0 left-0 w-screen h-screen flex place-items-center place-content-center transition-opacity duration-700", (props.audio || props.isMicrophone) ? "opacity-100" : "opacity-25")}>
      <div class="flex flex-col items-center w-full">
        <div class="text-slate-400 text-light text-sm sm:text-base md:text-lg lg:text-xl p-2 select-none">
          {props.name?.slice(0, props.name.lastIndexOf('.')) ?? (props.isMicrophone ? "Listening to your microphone" : "Select a track to play or turn on microphone")}
        </div>
        
        <input 
          type="range" 
          min={0} 
          max={props.duration} 
          step={props.duration / 200} 
          value={currentTime()} 
          onInput={(e) => onSeek(e.currentTarget.valueAsNumber)} 
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          disabled={!props.duration}
          class="w-[30%]"
        />

        <div>
          <button onClick={props.togglePlay} class="m-1 p-1 text-slate-400 hover:text-slate-300 transition-colors duration-500" disabled={!props.duration}>
            <Show when={props.isPlaying} fallback={<ScalingIcon path={play} />}>
              <ScalingIcon path={pause} />
            </Show>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Player