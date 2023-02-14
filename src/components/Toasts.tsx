import { Component, createSignal, For, onMount, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";

let nextId = 0;

type ToastData = {
  id: number,
  extraDelay: number,
  message: string,
}

const [toasts, setToasts] = createStore<ToastData[]>([])

export const toast = (message: string) => {
  const id = nextId++
  const extraDelay = toasts.length * 120
  setToasts(produce(toasts => toasts.push({ id, message, extraDelay })))
  setTimeout(() => {
    setToasts(toasts => toasts.filter(t => id !== t.id))
  }, 5_000 + extraDelay)
}

const Toast: Component<{ message: string, extraDelay: number }> = (props) => {
  const [hidden, setHidden] = createSignal(false)
  onMount(() => {
    setTimeout(() => {
      setHidden(true)
    }, 4_500 + props.extraDelay)
  })
  return (
    <div class={"transition-opacity ease-out duration-500 " + (hidden() ? "opacity-0" : "")}>
      {props.message}
    </div>
  )
}

const Toasts: Component = () => {

  return (
    <div class="absolute p-2 mt-4 text-slate-500 text-xs font-mono select-none">
      <For each={toasts}>{toast => 
        <Toast message={toast.message} extraDelay={toast.extraDelay}/>
      }</For>
    </div>
  )
}

export default Toasts