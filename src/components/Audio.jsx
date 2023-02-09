import { Show, createResource, createSignal, For, createEffect, onMount } from "solid-js"
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

const Surface = (props) => (
  <div
    class={"p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded shadow-md " + props.class}
  >
    {props.children}
  </div>
)

const Button = (props) => (
  <button disabled={props.disabled} onClick={e => props.onClick(e)} class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 rounded-full shadow-lg p-1 text-center " + (props.isDown ? "shadow-pink-600/20" : "")}>{props.children}</button>
)

const DeviceSelector = (props) => {

  const [open, setOpen] = createSignal(false)

  const [devices, {refetch}] = createResource(async () => {
    console.log("looking for devices...")
    const devices = await navigator.mediaDevices.enumerateDevices()
    console.log("found devices")
    const audioDevices = devices.filter((d) => d.kind === "audioinput")
    return audioDevices
  }, { ssrLoadFrom: "initial", initialValue: [] })
  onMount(() => refetch())

  const onSelect = (device) => {
    props.selectDevice(device)
    console.log(device)
    setOpen(false)
  }

  return (
    <div class="relative">
      <Button onClick={() => setOpen(!open())} isDown={props.audioDevice}>{props.audioDevice ? props.audioDevice.label : "Select input device"}</Button>
      <Show when={open() && !devices.loading}>
        <div class="absolute">
          <Surface>
            <For each={devices()}
              fallback={<span>No devices!</span>}
            >{device => (
                <div class="mb-1">
                  <Button onClick={() => onSelect(device)}>{device.label}</Button>
                </div>
              )}</For>
          </Surface>
        </div>
      </Show>
    </div>
  )
}

export default function AudioPlayer() {
  const [audio, setAudio] = createSignal(null)
  const [name, setName] = createSignal(null)
  const [audioDevice, setAudioDevice] = createSignal(null)
  const [isPlaying, setIsPlaying] = createSignal(false)
  const [isRecording, setIsRecording] = createSignal(false)
  const [settings, setSettings] = createSignal({  })

  const setAudioSource = (file, inputType) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    setName(file.name)
    setAudio(audio)
    initAudioSystem(audio, inputType)
    console.log(audio)
    audio.onended = () => setIsPlaying(false)
  }

  const record = async () => {
    console.log("record clicked")
    if (isRecording() || !audioDevice()) return
    setIsRecording(true)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: audioDevice().deviceId,
      },
    })
    console.log(stream)

    const mediaRecorder = new MediaRecorder(stream)

    let chunks = []
    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data)
    }

    mediaRecorder.onstop = async () => {
      setIsRecording(false)
      // A "blob" combines all the audio chunks into a single entity
      console.log(await chunks[0].arrayBuffer())
      const blob = new Blob(chunks, {"type": "audio/mp3"})
      console.log(blob)
      chunks = [] // clear buffer
    
      setAudioSource(blob, "mic")
      console.log("recording stopped")
    }

    mediaRecorder.start()
    console.log("recording")
    setTimeout(() => {
      mediaRecorder.stop()
    }, 5_000)
  }

  const initAudioSystem = (audio, inputType) => {
    const AudioContext = window.AudioContext

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
    const mono = inputType === "mic"
    console.log(inputType)

    splitter.connect(analysers[0], 0)
    splitter.connect(analysers[1], mono ? 0 : 1)
    //analysers[0].connect(merger, 0, 0)
    //analysers[0].connect(merger, 0, 1)
    splitter.connect(merger, 0, 0)
    splitter.connect(merger, mono ? 0 : 1, 1)
    merger.connect(audioContext.destination)
  
    onSettingsChange({
      minDecibels: -65,
      maxDecibels: -30,
      smoothingTimeConstant: 0.75
    })
  }

  const onClick = () => {
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }
    if (!isPlaying()) {
      console.log(audio())
      console.log("playing now")
      audio().play()
      setIsPlaying(true)
    } else {
      audio().pause()
      console.log("stopping now")
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
    setAudioSource(files[0], "file")
  }

  return (
    <div class="flex flex-wrap items-stretch text-slate-300 text-sm gap-2">
      <div class="flex items-center p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded">
        <button onClick={onClick} class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 rounded-full shadow-lg p-1 w-16 text-center " + (isPlaying() ? "shadow-pink-600/20" : "")}>
          {isPlaying() ? "Pause" : "Play"}
        </button>
        <Slider min="-100" max={settings().maxDecibels} value={settings().minDecibels} onChange={event => onSettingsChange({ minDecibels: event.target.valueAsNumber })}/>
        <Slider min={settings().minDecibels} max="-10" value={settings().maxDecibels} onChange={event => onSettingsChange({ maxDecibels: event.target.valueAsNumber })}/>
        <Slider min="50" max="90" value={settings().smoothingTimeConstant * 100} onChange={event => onSettingsChange({ smoothingTimeConstant: event.target.valueAsNumber / 100 })}/>
      </div>

      <div class="flex flex-col items-center p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded-md">
        <label for="audioFile" class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 rounded-full shadow-lg px-2 py-1 cursor-pointer text-center " + (audio() ? "shadow-pink-600/20" : "")} >
          {name() ?? "Choose a file"}
          <input id="audioFile" type="file" onChange={onAudioUpload} accept="audio/*" class="hidden"/>
        </label>
        <DeviceSelector audioDevice={audioDevice()} selectDevice={setAudioDevice} />
        <Button onClick={record} disabled={!audioDevice()}>{isRecording() ? "Recording..." : "Record"}</Button>
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
