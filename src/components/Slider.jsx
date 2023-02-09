export default function Slider(props) {

  return (
    <div class="h-16 flex flex-col items-center">
      <input type="range" orient="vertical" min={props.min} max={props.max} 
        onInput={e => props.onChange(e)} value={props.value} 
        style={{"-webkit-appearance": "slider-vertical"}}
        class="h-14"
      />
      <span class="select-none text-slate-400">{Number(props.value).toFixed()}</span>
    </div>
  )
}
