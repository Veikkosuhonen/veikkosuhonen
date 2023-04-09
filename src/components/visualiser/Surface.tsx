import { Component, JSXElement } from "solid-js";

export const Surface: Component<{
  children: JSXElement, class?: string 
}> = (props) => (
 <div
   class={"w-fit p-4 rounded-md backdrop-blur bg-zinc-900/40 border-zinc-800/50 border-2 transition-colors duration-300 hover:bg-zinc-900/50 hover:border-zinc-800 shadow-md " + props.class}
 >
   {props.children}
 </div>
)