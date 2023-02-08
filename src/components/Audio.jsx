import { createSignal, onMount } from "solid-js";

let audioContext;
const analysers = [null, null];
let dataArray1 = new Uint8Array(4096);
let dataArray2 = new Uint8Array(2048);
let bufferLength;

export const getTimeDomainData = () => {
  analysers[0]?.getByteFrequencyData(dataArray1);
  analysers[1]?.getByteFrequencyData(dataArray2);
  dataArray1.set(dataArray2, 2048);
  return dataArray1;
}

export default function Audio() {
  const [audioUrl, setAudioUrl] = createSignal(null)
  const [isPlaying, setIsPlaying] = createSignal(false)
  const [settings, setSettings] = createSignal({  })

  let audio;

  onMount(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    audioContext = new AudioContext();
  
    const track = audioContext.createMediaElementSource(audio);
    const splitter = audioContext.createChannelSplitter(2);
    track.connect(splitter);
    const merger = audioContext.createChannelMerger(2);
    analysers[0] = audioContext.createAnalyser()
    analysers[1] = audioContext.createAnalyser()
    analysers[0].fftSize = 4096;
    analysers[1].fftSize = 4096;
//
    //const delayNode = new DelayNode(audioContext, { delayTime: 0.05 })
//
    splitter.connect(analysers[0], 0);
    splitter.connect(analysers[1], 1);
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
      audioContext.resume();
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
  }

  return (
    <div>
      <audio ref={audio} src={audioUrl()}/>
      <button onClick={onClick}>
        {isPlaying() ? "Pause" : "Play"}
      </button>
      <input type="range" min="-100" max={settings().maxDecibels} value={settings().minDecibels} onInput={event => onSettingsChange({ minDecibels: event.target.valueAsNumber })}/>
      <input type="range" min={settings().minDecibels} max="-10" value={settings().maxDecibels} onInput={event => onSettingsChange({ maxDecibels: event.target.valueAsNumber })}/>
      <input type="range" min="50" max="90" value={settings().smoothingTimeConstant * 100} onInput={event => onSettingsChange({ smoothingTimeConstant: event.target.valueAsNumber / 100 })}/>
      <input type="file" onChange={onAudioUpload} />
    </div>
  );
}
