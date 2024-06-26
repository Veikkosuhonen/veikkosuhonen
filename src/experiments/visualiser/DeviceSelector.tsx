import { Component, For, Show, createSignal, onMount } from "solid-js"
import { Surface } from "./Surface"
import { Button } from "./Button"

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
    const willOpen = !open()
    setOpen(willOpen)
    if (willOpen) {
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
      <Button onMouseDown={onOpen} isDown={!!props.deviceId}>{currentDevice()?.label ?? "Select input device"}</Button>
      <Show when={open()}>
        <div class="absolute">
          <Surface>
            <For each={devices()}
              fallback={<span>No devices!</span>}
            >{device => (
                <div class="mb-1">
                  <Button onMouseDown={() => onSelect(device)}>{device.label}</Button>
                </div>
              )}</For>
          </Surface>
        </div>
      </Show>
    </div>
  )
}

export default DeviceSelector
