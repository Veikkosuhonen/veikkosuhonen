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
    min: -80,
    max: -40,
    value: -65,
    step: 1,
    stage: "audio",
  },
  {
    name: "maxDecibels",
    min: -50,
    max: 30,
    value: -35,
    step: 1,
    stage: "audio",
  },
  {
    name: "smoothingConstant",
    min: 0,
    max: 1,
    value: 0.75,
    step: 0.05,
    stage: "audio",
  },
  {
    name: "freqScale",
    min: 5200,
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
