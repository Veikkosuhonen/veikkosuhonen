import { createStore, produce } from "solid-js/store";

export type Setting = {
  value: number,
  min: number,
  max: number,
  name: string,
  step: number,
  stage: "post" | "render" | "audio",
}

export const [settings, setSettings] = createStore<Setting[]>([
  {
    name: "minDecibels",
    min: -110,
    max: -30,
    value: -53,
    step: 10,
    stage: "audio",
  },
  {
    name: "maxDecibels",
    min: -60,
    max: 30,
    value: -27,
    step: 10,
    stage: "audio",
  },
  {
    name: "smoothingTimeConstant",
    min: 0.1,
    max: 0.9,
    value: 0.1,
    step: 0.1,
    stage: "audio",
  },
  {
    name: "delay",
    min: 0,
    max: 2,
    value: 0,
    step: 0.1,
    stage: "audio",
  },
  {
    name: "volume",
    min: 0,
    max: 1,
    value: 0.5,
    step: 0.1,
    stage: "audio",
  },
  {
    name: "microphoneGain",
    min: 0,
    max: 1,
    value: 1.0,
    step: 0.1,
    stage: "audio",
  },
  {
    name: "freqScale",
    min: 4_000,
    max: 10_000,
    value: 8800,
    step: 200,
    stage: "render",
  },
  {
    name: "freqRange",
    min: 0.1,
    max: 1.0,
    value: 0.7,
    step: 0.1,
    stage: "render",
  },
  {
    name: "ringRadius",
    min: 0.0,
    max: 1.0,
    value: 0.45,
    step: 0.1,
    stage: "render",
  },
  {
    name: "speed",
    min: 0.1,
    max: 1.0,
    value: 0.3,
    step: 0.1,
    stage: "render",
  },
  {
    name: "exposure",
    min: 0.1,
    max: 2.2,
    value: 1.0,
    step: 0.1,
    stage: "post",
  },
  {
    name: "gamma",
    min: 0.1,
    max: 3.0,
    value: 1.1,
    step: 0.1,
    stage: "post",
  },
  {
    name: "hue",
    min: 0.0,
    max: 3.14,
    step: 0.1,
    value: 0.9,
    stage: "render",
  },
  {
    name: "brightness",
    min: 0.05,
    max: 1.0,
    step: 0.05,
    value: 0.6,
    stage: "render",
  },
])

export const setValue = (name: string, newValue: number) => {
  setSettings(
    (setting) => setting.name === name,
    "value",
    newValue
  )
}

export const getValue = (name: string) => settings.filter(s => s.name === name)[0].value
