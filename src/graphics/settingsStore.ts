import { createStore, produce } from "solid-js/store";

export type Setting = {
  value: number,
  min: number,
  max: number,
  name: string,
  step: number,
  stage: "post" | "render" | "audio"
}

export const [settings, setSettings] = createStore<Setting[]>([
  {
    name: "minDecibels",
    min: -120,
    max: -40,
    value: -80,
    step: 10,
    stage: "audio",
  },
  {
    name: "maxDecibels",
    min: -60,
    max: 30,
    value: -30,
    step: 10,
    stage: "audio",
  },
  {
    name: "smoothingConstant",
    min: 0,
    max: 1,
    value: 0,
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
    name: "freqScale",
    min: 7200,
    max: 17200,
    value: 8800,
    step: 200,
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
    value: 2.2,
    step: 0.1,
    stage: "post",
  }
])

export const setValue = (name: string, newValue: number) => {
  setSettings(
    (setting) => setting.name === name,
    "value",
    newValue
  )
}

export const getValue = (name: string) => settings.filter(s => s.name === name)[0].value
