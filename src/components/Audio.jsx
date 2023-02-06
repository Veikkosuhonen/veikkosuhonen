import { createSignal, onMount } from "solid-js";

let audioContext;
let analyser;
let dataArray = new Uint8Array(2048);
let timeArray = new Uint8Array(1024);
let bufferLength;

export const getTimeDomainData = () => {
  analyser?.getByteFrequencyData(dataArray);
  // analyser?.getByteTimeDomainData(timeArray);
  dataArray.set(timeArray, 1024);
  return dataArray;
}

export default function Audio() {
  const [isPlaying, setIsPlaying] = createSignal(false)
  const [settings, setSettings] = createSignal({  })

  let audio;

  onMount(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    audioContext = new AudioContext();
    console.log(audio)
    console.log(audioContext)
    const track = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048;

    const delayNode = new DelayNode(audioContext, { delayTime: 0.05 })

    track.connect(analyser);
    analyser.connect(delayNode)
    delayNode.connect(audioContext.destination)

    bufferLength = analyser.frequencyBinCount;
  
    setSettings({
      minDecibels: analyser.minDecibels,
      maxDecibels: analyser.maxDecibels, 
      smoothingTimeConstant: analyser.smoothingTimeConstant
    })
  })

  const onClick = () => {
    console.log("click")
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    if (!isPlaying()) {
      console.log("playing")
      audio.play()
      setIsPlaying(true)
    } else {
      console.log("pausing")
      audio.pause()
      setIsPlaying(false)
    }
  }

  const onSettingsChange = (value) => {
    console.log(value)
    console.log(settings())
    setSettings({ ...settings(), ...value })
    Object.assign(analyser, value)
  }

  return (
    <div>
      <audio ref={audio} src="howls_moving_castle.mp3"/>
      <button onClick={onClick}>
        {isPlaying() ? "Pause" : "Play"}
      </button>
      <input type="range" min="-200" max={settings().maxDecibels} value={settings().minDecibels} onInput={event => onSettingsChange({ minDecibels: event.target.valueAsNumber })}/>
      <input type="range" min={settings().minDecibels} max="0" value={settings().maxDecibels} onInput={event => onSettingsChange({ maxDecibels: event.target.valueAsNumber })}/>
      <input type="range" min="0" max="100" value={settings().smoothingTimeConstant * 100} onInput={event => onSettingsChange({ smoothingTimeConstant: event.target.valueAsNumber / 100 })}/>
    </div>
  );
}
