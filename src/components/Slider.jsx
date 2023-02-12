export default function Slider(props) {

  return (
    <div class="h-16 flex flex-col items-center mb-4">
      <input type="range" orient="vertical" min={props.setting.min} max={props.setting.max} step={props.setting.step}
        onInput={e => props.onChange(props.setting, e.target.valueAsNumber)} value={props.setting.value} 
        style={{"-webkit-appearance": "slider-vertical"}}
        disabled={props.disabled}
        class="h-14"
      />
      <span class="select-none text-slate-400">{Number(props.setting.value).toFixed(1)}</span>
      <span class="select-none text-slate-500">{props.setting.name}</span>
    </div>
  )
}
