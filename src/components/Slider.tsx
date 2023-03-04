import { Component, For, createEffect, createSignal, onMount } from "solid-js"
import { Setting } from "../graphics/settingsStore"
import cn from "classnames"
import { useMousePosition } from "@solid-primitives/mouse";

const [dragStart, setDragStart] = createSignal<number>(0)

const Slider: Component<{
  setting: Setting,
  disabled: boolean,
  onChange: (s: Setting, v: number) => void
}> = (props) => {
  const initialOffset = 100 - (props.setting.value - props.setting.min) / (props.setting.max - props.setting.min) * 100
  const [offset, setOffset] = createSignal<number>(initialOffset)
  const [previousOffset, setPreviousOffset] = createSignal<number>(initialOffset)
  const [isDragging, setIsDragging] = createSignal<boolean>(false)
  const [isHover, setIsHover] = createSignal<boolean>(false)
  
  const stopDrag = () => {
    setIsDragging(false)
    setPreviousOffset(offset())
  }

  const pos = useMousePosition()

  const dragUpdate = () => {
    let newOffset = previousOffset() + (pos.y - dragStart())
    newOffset = Math.min(Math.max(newOffset, 0), 100)
    setOffset(newOffset)

    const newValue = ((100 - newOffset) / 100) * (props.setting.max - props.setting.min) + props.setting.min

    props.onChange(props.setting, newValue)
  }

  createEffect(() => {
    if (isDragging()) {
      dragUpdate()
    }
  })

  const onDragStart = (y: number) => {
    setDragStart(y)
    setIsDragging(true)
    addEventListener("mouseup", stopDrag, { once: true })
    addEventListener("dragend", stopDrag, { once: true })
    addEventListener("touchend", stopDrag, { once: true })
    dragUpdate()
  }

  const onTouchDown = (e: TouchEvent) => {
    const touch = e.changedTouches[0]
    if (!touch) return
    onDragStart(touch.pageY)
  }

  const onMouseDown = () => {
    onDragStart(pos.y)
  }

  const ticks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  return (
    <div class="w-16 flex flex-col items-center mb-2" onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)} draggable={false}>
      <div class="relative flex justify-center h-[140px] w-10 overflow-y-hidden overflow-x-hidden cursor-pointer" onMouseDown={onMouseDown} onTouchStart={onTouchDown} draggable={false}>

        <div class={`absolute flex flex-col items-center gap-[9px] -z-10 justify-self-start py-[14px] w-7
          [&>*:nth-child(even)]:w-7
          [&>*:nth-child(odd)]:w-6
        `}>
          <For each={ticks}>{t => 
            <div class={cn("w-6 border-t-2 border-pink-500 transition-opacity duration-300", (Math.round(offset()/10) === t) ? "opacity-80" : (isHover() || isDragging() ? "opacity-20" : "opacity-10"))}/>
          }
          </For>
        </div>

        <div class="w-2 shadow-inner shadow-black/50 bg-slate-800 rounded flex flex-col items-center mt-2"/>

        <div class="rotate-90 translate-x-5 relative w-0 h-0 overflow-x-visible" draggable={false}>
          <span class={cn("select-none text-slate-500 absolute", isHover() || isDragging() ? "opacity-100" : "opacity-70" )}>{props.setting.name}</span>
        </div>

        <div class="absolute flex flex-col items-center" style={{ top: `${offset() * 0.83}%` }}>
          <div 
            class={cn(
              "w-[16px] h-[22px] border-t border-b bg-slate-800 border-slate-600 flex items-center",
              isDragging() ? "shadow-lg shadow-pink-500/50" : ""
            )}
          >
            <div class={cn("w-full h-0.5 transition-opacity duration-200", isHover() || isDragging() ? "bg-pink-500" : "bg-slate-900" )}/>
          </div>
          <div class={cn("mt-1 w-0.5 h-[140px] bg-pink-600 transition-opacity duration-500", (isDragging() || isHover()) ? "opacity-60" : "opacity-30")} />
        </div>
        
      </div>
      
      <span class={cn("select-none text-slate-500 transition-opacity duration-200", isHover() || isDragging() ? "opacity-100" : "opacity-70" )}>{Number(props.setting.value).toFixed(1)}</span>
    </div>
  )
}

export default Slider
