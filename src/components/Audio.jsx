import { createSignal, onMount } from "solid-js"
import Slider from "./Slider"

let audioContext
const analysers = [null, null]
let dataArray1 = new Uint8Array(4096)
let dataArray2 = new Uint8Array(2048)
// let bufferLength

export const getTimeDomainData = () => {
  analysers[0]?.getByteFrequencyData(dataArray1)
  analysers[1]?.getByteFrequencyData(dataArray2)
  dataArray1.set(dataArray2, 2048)
  return dataArray1
}

export default function Audio() {
  const [audioUrl, setAudioUrl] = createSignal(null)
  const [name, setName] = createSignal(null)
  const [isPlaying, setIsPlaying] = createSignal(false)
  const [settings, setSettings] = createSignal({  })

  let audio

  onMount(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext

    audioContext = new AudioContext()
  
    const track = audioContext.createMediaElementSource(audio)
    const splitter = audioContext.createChannelSplitter(2)
    track.connect(splitter)
    const merger = audioContext.createChannelMerger(2)
    analysers[0] = audioContext.createAnalyser()
    analysers[1] = audioContext.createAnalyser()
    analysers[0].fftSize = 4096
    analysers[1].fftSize = 4096
    //
    //const delayNode = new DelayNode(audioContext, { delayTime: 0.05 })
    //
    splitter.connect(analysers[0], 0)
    splitter.connect(analysers[1], 1)
    //analysers[0].connect(merger, 0, 0)
    //analysers[0].connect(merger, 0, 1)
    splitter.connect(merger, 0, 0)
    splitter.connect(merger, 1, 1)
    merger.connect(audioContext.destination)
  
    onSettingsChange({
      minDecibels: -65,
      maxDecibels: -30, 
      smoothingTimeConstant: 0.75
    })
  })

  const onClick = () => {
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }
    if (!isPlaying()) {
      audio.play()
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const onSettingsChange = (value) => {
    setSettings({ ...settings(), ...value })
    analysers.forEach(a => Object.assign(a, value))
  }

  const onAudioUpload = (event) => {
    const files = event.target.files
    if (!(files.length > 0)) return
    const url = URL.createObjectURL(files[0])
    setAudioUrl(url)
    setName(files[0].name)
  }

  return (
    <div class="flex items-stretch text-slate-300 text-sm gap-2">
      <audio ref={audio} src={audioUrl()}/>
      <div class="flex items-center p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded">
        <button onClick={onClick} class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 rounded-full shadow-lg p-1 w-16 text-center " + (isPlaying() ? "shadow-pink-600/20" : "")}>
          {isPlaying() ? "Pause" : "Play"}
        </button>
        <Slider min="-100" max={settings().maxDecibels} value={settings().minDecibels} onChange={event => onSettingsChange({ minDecibels: event.target.valueAsNumber })}/>
        <Slider min={settings().minDecibels} max="-10" value={settings().maxDecibels} onChange={event => onSettingsChange({ maxDecibels: event.target.valueAsNumber })}/>
        <Slider min="50" max="90" value={settings().smoothingTimeConstant * 100} onChange={event => onSettingsChange({ smoothingTimeConstant: event.target.valueAsNumber / 100 })}/>
      </div>

      <div class="flex items-center p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded-md">
        <label for="audioFile" class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 rounded-full shadow-lg px-2 py-1 cursor-pointer text-center " + (name() ? "shadow-pink-600/20" : "")} >
          {name() ?? "Choose a file"}
          <input id="audioFile" type="file" onChange={onAudioUpload} accept="audio/*" class="hidden"/>
        </label>
      </div>
      <div class="flex items-center px-16 select-none">
        <h1 class="first-letter:font-extrabold first-letter:text-pink-800 text-4xl font-light">
          VISUALIZER
        </h1>
        <div class="flex flex-col pl-4 text-slate-400">
          <span>wow very cool</span>
          <div class="flex gap-2">by <div class="first-letter:font-extrabold first-letter:text-pink-600 font-light text-slate-300">Veikkosuhonen</div></div>
        </div>
      </div>
    </div>
  )
}
