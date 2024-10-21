import { Component, createSignal, onMount } from "solid-js";

export const Background: Component<{
  bgUrl: string;
  bgSize: number;
}> = (props) => {

  const [h, setH] = createSignal("100vh");
  onMount(() => {
    setH(document.body.scrollHeight + "px");
  })

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: h(),
        "z-index": -10,
        background: `url(${props.bgUrl})`,
        "background-size": `${props.bgSize}px`,
      }}
    />
  );
}

