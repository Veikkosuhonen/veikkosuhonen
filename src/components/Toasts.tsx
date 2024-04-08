import cn from "classnames";
import { Component, createSignal, For, onMount } from "solid-js";
import { createStore, produce } from "solid-js/store";

let nextId = 0;

type Severity = "error" | "info" | "success" | "warning"

type ToastData = {
  id: number,
  extraDelay: number,
  message: string,
  severity: Severity,
}

const [toasts, setToasts] = createStore<ToastData[]>([])

export const toastError = (message: any) => {
  console.error(message)
  toast(message, "error")
}

export const toast = (message: any, severity: Severity = "info") => {
  if (typeof message !== "string") message = JSON.stringify(message)

  const id = nextId++
  const extraDelay = toasts.length * 120
  setToasts(produce(toasts => toasts.push({ id, message, extraDelay, severity })))
  setTimeout(() => {
    setToasts(toasts => toasts.filter(t => id !== t.id))
  }, 10_000 + extraDelay)
}

const Toast: Component<{ toast: ToastData }> = (props) => {
  const [hidden, setHidden] = createSignal(false)
  onMount(() => {
    setTimeout(() => {
      setHidden(true)
    }, 9_500 + props.toast.extraDelay)
  })
  return (
    <div class={cn(
      "transition-opacity ease-out duration-500",
      { "opacity-0": hidden(), 
      "text-red-400": props.toast.severity === "error" }
    )}>
      {props.toast.message}
    </div>
  )
}

const Toasts: Component = () => {

  return (
    <div class="absolute p-2 mt-4 m-1 text-slate-400 text-xs font-mono select-none bg-black/30 rounded-md">
      <For each={toasts}>{toast => 
        <Toast toast={toast} />
      }</For>
    </div>
  )
}

export default Toasts