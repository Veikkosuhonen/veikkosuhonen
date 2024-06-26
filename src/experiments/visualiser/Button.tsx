import { Component, JSXElement } from "solid-js";

export const Button: Component<{ 
  disabled?: boolean, isDown?: boolean, children: JSXElement, onMouseDown: (e: any) => void 
}> = (props) => (
  <button disabled={props.disabled} onMouseDown={e => props.onMouseDown(e)} class={"select-none bg-zinc-900 border border-zinc-800 hover:border-pink-800 disabled:border-gray-800 disabled:text-slate-600 rounded-md shadow-lg p-1 text-center " + (props.isDown ? "shadow-pink-600/20" : "")}>{props.children}</button>
)