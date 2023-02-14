import { Show, createResource, createSignal, For, onMount, Component, JSXElement, JSX } from "solid-js"
import Slider from "./Slider"
import { Setting, getValue, setValue, settings } from "../graphics/settingsStore"
import { toast } from "./Toasts"

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

  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([])

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

  const loadDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioDevices = devices.filter((d) => d.kind === "audioinput")
    setDevices(audioDevices)
  }

  const onOpen = async () => {
    setOpen(!open())
    if (open()) {
      loadDevices()
    }
  }

  onMount(() => {
    if (props.deviceId) {
      loadDevices()
    }
  })

  return (
    <div class="relative">
      <Button onClick={onOpen} isDown={!!props.deviceId}>{currentDevice()?.label ?? "Select input device"}</Button>
      <Show when={open()}>
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
  let microphoneGainNode: GainNode|null = null
  let gainNode: GainNode|null = null
  const [microphoneOn, setMicrophoneOn] = createSignal(false)
  const [name, setName] = createSignal<string|null>(null)
  const [deviceId, { refetch: refetchDeviceId, mutate: mutateDeviceId }] = createResource<string|undefined>(() => {
    console.log("looking for device id from localstorage...")
    const deviceId = localStorage.getItem('deviceId') ?? undefined
    if (deviceId) toast("Using saved device " + deviceId)
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

    settings.forEach(s => onSliderChange(s, s.value))

    toast("Audio initialised")
  })

  const setAudioSource = (file: File) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    setName(file.name)
    setAudio(audio)
    trackNode = audioContext?.createMediaElementSource(audio) ?? null
    if (trackNode && splitterNode && audioContext) {
      trackNode.connect(splitterNode)
      toast(file.name + " ready to play")
    }

    audio.onended = () => setIsPlaying(false)
  }

  const toggleMicrophone = async () => {
    if (!audioContext) return
    if (microphoneOn()) {
      setMicrophoneOn(false)
      microphoneNode()?.disconnect()
      return
    } else if (microphoneNode() && microphoneGainNode) {
      microphoneNode()?.connect(microphoneGainNode)
    }
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }

    if (!microphoneNode() && splitterNode && audioContext) {
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
        microphoneGainNode = audioContext.createGain()
        microphoneGainNode.gain.value = getValue("microphoneGain")
        microphoneNode.connect(microphoneGainNode)
        microphoneGainNode.connect(splitterNode)
        toast("Microphone connected")
        setMicrophoneNode(microphoneNode)
        setValue("volume", 0)
        updateAudioSetting("volume", 0)
        toast("Volume set to 0 to prevent feedback")
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
      audioElement.play()
      setIsPlaying(true)
    } else {
      audioElement.pause()
      setIsPlaying(false)
    }
  }

  const onSliderChange = (setting: Setting, value: number) => {
    setValue(setting.name, value)
    if (setting.stage === "audio") {
      updateAudioSetting(setting.name, value)
    }
  }

  const updateAudioSetting = (name: string, value: number) => {
    if (microphoneGainNode && name === "microphoneGain") {
      microphoneGainNode.gain.value = value
    } else if (gainNode && name === "volume") {
      gainNode.gain.value = value
    } else {
      analysers.forEach(a => a && Object.assign(a, { [name]: value }))
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
    toast("Selected device " + device.label)
  }

  return (
    <div class="flex flex-wrap items-stretch text-slate-300 text-sm gap-2">
      <div class="flex items-center p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded">
        <Button disabled={!audio()} onClick={togglePlay}>
          {isPlaying() ? "Pause" : "Play"}
        </Button>
        <For each={settings}>{setting => 
          <Slider setting={setting} disabled={!audio() && !microphoneNode()} onChange={onSliderChange} />
        }</For>
      </div>

      <div class="flex flex-col items-center gap-1 p-4 backdrop-blur bg-zinc-900/30 border-zinc-900 border-2 rounded-md">
        <label for="audioFile" class={"bg-zinc-900 border border-zinc-800 hover:border-pink-800 rounded-full shadow-lg px-2 py-1 cursor-pointer text-center " + (audio() ? "shadow-pink-600/20" : "")} >
          {name() ?? "Choose a file"}
          <input id="audioFile" type="file" onChange={onAudioUpload} accept="audio/*" class="hidden"/>
        </label>
        <DeviceSelector deviceId={deviceId()} selectDevice={onDeviceSelect} />
        <Button onClick={toggleMicrophone} disabled={false}>{microphoneOn() ? "Turn off mic" : "Turn on mic"}</Button>
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
