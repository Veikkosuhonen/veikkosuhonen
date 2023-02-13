import { Show, createResource, createSignal, For, onMount, Component, JSXElement, JSX } from "solid-js"
import Slider from "./Slider"
import { Setting, getValue, setValue, settings } from "../graphics/settingsStore"

let audioContext: AudioContext | null
const analysers: Array<AnalyserNode | null> = [null, null]
let dataArray1 = new Uint8Array(4096)
let dataArray2 = new Uint8Array(2048)
// let bufferLength

export const getTimeDomainData = () => {
  analysers[0]?.getByteFrequencyData(dataArray1)
  analysers[1]?.getByteFrequencyData(dataArray2)
  dataArray1.set(dataArray2, 2048)
  return dataArray1
}

const Surface: Component<{
   children: JSXElement, class?: string 
}> = (props) => (
  <div
    class={"p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded shadow-md " + props.class}
  >
    {props.children}
  </div>
)

const Button: Component<{ 
  disabled?: boolean, isDown?: boolean, children: JSXElement, onClick: (e: any) => void 
}> = (props) => (
  <button disabled={props.disabled} onClick={e => props.onClick(e)} class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 disabled:border-gray-800 disabled:text-slate-600 rounded-full shadow-lg p-1 text-center " + (props.isDown ? "shadow-pink-600/20" : "")}>{props.children}</button>
)

const DeviceSelector: Component<{
   selectDevice: (device: MediaDeviceInfo) => void, deviceId?: string
}> = (props) => {

  const [open, setOpen] = createSignal(false)

  const [devices, {refetch}] = createResource(async () => {
    console.log("looking for devices...")
    const devices = await navigator.mediaDevices.enumerateDevices()
    console.log("found devices: ", devices)
    const audioDevices = devices.filter((d) => d.kind === "audioinput")
    return audioDevices
  }, { ssrLoadFrom: "initial", initialValue: [] })
  onMount(() => refetch())

  const onSelect = (device: MediaDeviceInfo) => {
    props.selectDevice(device)
    console.log(device)
    setOpen(false)
  }

  const currentDevice = () => {
    const matchingDevices = devices().filter(d => d.deviceId === props.deviceId)
    if (matchingDevices.length) {
      return matchingDevices[0]
    } else {
      return null
    }
  }

  return (
    <div class="relative">
      <Button onClick={() => setOpen(!open())} isDown={!!props.deviceId}>{currentDevice()?.label ?? "Select input device"}</Button>
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
  const [audio, setAudio] = createSignal<HTMLAudioElement|null>(null)
  let splitterNode: ChannelSplitterNode|null = null
  const [microphoneNode, setMicrophoneNode] = createSignal<MediaStreamAudioSourceNode|null>(null)
  let trackNode: MediaElementAudioSourceNode|null = null
  let delayNode: DelayNode|null = null
  let gainNode: GainNode|null = null
  const [microphoneOn, setMicrophoneOn] = createSignal(false)
  const [name, setName] = createSignal<string|null>(null)
  const [deviceId, { refetch: refetchDeviceId, mutate: mutateDeviceId }] = createResource<string|undefined>(() => {
    console.log("looking for device id from localstorage...")
    const deviceId = localStorage.getItem('deviceId') ?? undefined
    if (deviceId) console.log("Using previous device ", deviceId)
    return deviceId
  }, { ssrLoadFrom: "initial" })

  const [isPlaying, setIsPlaying] = createSignal(false)

  onMount(() => {
    refetchDeviceId()
  
    const AudioContext = window.AudioContext

    audioContext = new AudioContext()

    splitterNode = audioContext.createChannelSplitter(2)
    analysers[0] = audioContext.createAnalyser()
    analysers[1] = audioContext.createAnalyser()
    analysers[0].fftSize = 4096
    analysers[1].fftSize = 4096

    splitterNode.connect(analysers[0], 0)
    splitterNode.connect(analysers[1], 1)

    const mergerNode = audioContext.createChannelMerger(2)
    analysers[0].connect(mergerNode, 0, 0)
    analysers[1].connect(mergerNode, 0, 1)

    gainNode = audioContext.createGain()
    mergerNode.connect(gainNode)
    gainNode.connect(audioContext.destination)

    settings.forEach(s => onSettingsChange(s, s.value))
  })

  const setAudioSource = (file: File) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    setName(file.name)
    setAudio(audio)
    trackNode = audioContext?.createMediaElementSource(audio) ?? null
    if (trackNode && splitterNode && audioContext) {
      trackNode.connect(splitterNode)
    }

    audio.onended = () => setIsPlaying(false)
  }

  const toggleMicrophone = async () => {
    if (!audioContext) return
    if (microphoneOn()) {
      setMicrophoneOn(false)
      microphoneNode()?.disconnect()
      return
    } else if (microphoneNode() && delayNode) {
      microphoneNode()?.connect(delayNode)
    }
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }

    if (!microphoneNode() && deviceId() && splitterNode && audioContext) {
      // access microphone
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId(),
          noiseSuppression: false,
          echoCancellation: false,
        },
      })

      const microphoneNode = audioContext.createMediaStreamSource(mediaStream) ?? null
      if (microphoneNode) {
        delayNode = audioContext.createDelay()
        delayNode.delayTime.value = getValue("delay")
        microphoneNode.connect(delayNode)
        delayNode.connect(splitterNode)
        setMicrophoneNode(microphoneNode)
      }
    }

    setMicrophoneOn(true)
  }

  const togglePlay = () => {
    if (!audioContext) return
    const audioElement = audio()
    if (!audioElement) return
  
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }
    if (!isPlaying()) {
      console.log("playing now")
      audioElement.play()
      setIsPlaying(true)
    } else {
      audioElement.pause()
      console.log("stopping now")
      setIsPlaying(false)
    }
  }

  const onSettingsChange = (setting: Setting, value: number) => {
    setValue(setting.name, value)
    if (setting.stage === "audio") {
      analysers.forEach(a => a && Object.assign(a, { [setting.name]: value }))
      if (delayNode && setting.name === "delay")
        delayNode.delayTime.value = value
      if (gainNode && setting.name === "volume")
        gainNode.gain.value = value
    }
  }

  const onAudioUpload = (event: any) => {
    const files: FileList = event.target.files
    if (!(files.length > 0)) return
    setAudioSource(files[0])
  }

  const onDeviceSelect = (device: MediaDeviceInfo) => {
    localStorage.setItem("deviceId", device.deviceId)
    mutateDeviceId(device.deviceId)
  }

  return (
    <div class="flex flex-wrap items-stretch text-slate-300 text-sm gap-2">
      <div class="flex items-center p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded">
        <button onClick={togglePlay} class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 rounded-full shadow-lg p-1 w-16 text-center " + (isPlaying() ? "shadow-pink-600/20" : "")}>
          {isPlaying() ? "Pause" : "Play"}
        </button>
        <For each={settings}>{setting => 
          <Slider setting={setting} disabled={!audio() && !microphoneNode()} onChange={onSettingsChange} />
        }</For>
      </div>

      <div class="flex flex-col items-center p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded-md">
        <label for="audioFile" class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 rounded-full shadow-lg px-2 py-1 cursor-pointer text-center " + (audio() ? "shadow-pink-600/20" : "")} >
          {name() ?? "Choose a file"}
          <input id="audioFile" type="file" onChange={onAudioUpload} accept="audio/*" class="hidden"/>
        </label>
        <DeviceSelector deviceId={deviceId()} selectDevice={onDeviceSelect} />
        <Button onClick={toggleMicrophone} disabled={!deviceId() || !audioContext}>{microphoneOn() ? "Turn off mic" : "Turn on mic"}</Button>
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
