import { SetStoreFunction, createStore } from "solid-js/store";
import { Army, ArmyUnitState, UnitDefinitions, UnitKeys, createNewUnitState } from "./units";
import { Component, For, batch } from "solid-js";
import { UnitIcons } from "./icons";

const [attacker, setAttacker] = createStore<Army>({
  name: "Attacker",
  side: "attack",
  units: Object.fromEntries(UnitKeys.map((key) => [key, []])),
  priority: Object.fromEntries(UnitKeys.map((key) => [key, 0])),
})

const [defender, setDefender] = createStore<Army>({
  name: "Defender",
  side: "defense",
  units: Object.fromEntries(UnitKeys.map((key) => [key, []])),
  priority: Object.fromEntries(UnitKeys.map((key) => [key, 0])),
})

export default function AACombatSim() {

  const handleRoll = () => {
    batch(() => {
      UnitKeys.forEach((key) => {
        batch(() => {
          setAttacker("units", key, {}, "roll", () => Math.floor(Math.random() * 6) + 1)
          setDefender("units", key, {}, "roll", () => Math.floor(Math.random() * 6) + 1)
        })
      })
    })
  }

  const getArmyDamage = (army: Army) => {
    return UnitKeys.reduce((acc, key) => acc + (army.units[key]?.reduce((acc, unit) => acc + (unit.roll <= UnitDefinitions[key][army.side] ? 1 : 0), 0) ?? 0), 0)
  }

  return (
    <div class="container mx-auto my-16">
      <h1 class="text-4xl font-bold mb-16">Axis & Allies Combat Simulator</h1>
      <div class="flex mb-16">
        <ArmyPicker army={attacker} setArmy={setAttacker} />
        <ArmyPicker army={defender} setArmy={setDefender} />
      </div>
      <div class="flex">
        <ArmyBoard army={attacker} />
        <div class="basis-1/5 bg-stone-900 m-1 p-4">
          <button 
            onClick={handleRoll}
            class="w-full bg-red-900 p-2 rounded-md mb-2 hover:bg-red-700 shadow-md hover:shadow-red-700/50"
          >
            Roll
          </button>
          <div class="flex mt-4">
            <div class="flex-1 text-center">
              <p class="text-sm">Attacker damage:</p>
              <p>{getArmyDamage(attacker)}</p>
            </div>
            <div class="flex-1  text-center">
              <p class="text-sm">Defender damage:</p>
              <p>{getArmyDamage(defender)}</p>
            </div>
          </div>
        </div>
        <ArmyBoard army={defender} />
      </div>
    </div>
  ) 
}

const ArmyBoard: Component<{ army: Army }> = (props) => {
  return (
    <div class="basis-2/5">
      <h2 class="font-bold mb-4 px-4">{props.army.name}</h2>
      <div class="flex flex-col">
        <For each={[1, 2, 3, 4]}>{power => (
          <div class="flex flex-wrap gap-2 bg-stone-900 m-1 p-2">
            <p class="text-xs text-stone-300 mr-8">Power: {power}</p>
            <For each={UnitKeys.filter((key) => UnitDefinitions[key][props.army.side] === power)}>{(key) => (
              <div>
                <p class="text-xs font-bold w-16">{UnitDefinitions[key].name}</p>
                <div class="flex flex-col flex-wrap max-h-96">
                  <For each={props.army.units[key]}>{(unit) => (
                    <Unit unitKey={key} state={unit} side={props.army.side} />
                  )}</For>
                </div>
              </div>
            )}</For>
          </div>
        )}</For>
      </div>
    </div>
  )
}

const ArmyPicker: Component<{ army: Army, setArmy: SetStoreFunction<Army> }> = (props) => {
  return (
    <div class="flex-1 flex justify-center">
      <div>
        <h2 class="font-bold mb-4">{props.army.name}</h2>
        <div class="grid grid-cols-3 gap-2">
          <p class="text-xs font-bold">Unit name</p>
          <p class="text-xs font-bold">Count</p>
          <p class="text-xs font-bold">Priority</p>
          <For each={UnitKeys}>{(key) => (
            <>
              <p class="w-32">{UnitDefinitions[key].name}</p>
              <input 
                class="w-16 border border-stone-800 bg-black px-1 rounded-md" placeholder="0"
                type="number" min="0" value={props.army.units[key]?.length} 
                onInput={(e) => {
                  const value = e.target.valueAsNumber
                  if (value === 0) {
                    props.setArmy({ ...props.army, units: { ...props.army.units, [key]: [] } })
                  } else {
                    const units = []
                    for (let i = 0; i < value; i++) {
                      units.push(createNewUnitState(UnitDefinitions[key]))
                    }
                    props.setArmy({ ...props.army, units: { ...props.army.units, [key]: units } })
                  }
                }}
              />
              <input 
                class="w-16 border border-stone-800 bg-black px-1 rounded-md" placeholder="0"
                type="number" min="0" value={props.army.priority[key]} 
                onInput={(e) => {
                  const value = e.target.valueAsNumber
                  props.setArmy({ ...props.army, priority: { ...props.army.priority, [key]: value } })
                }}
              />
            </>
          )}</For>
        </div>
        <div class="w-64 border-b border-stone-500 mt-4 mb-2" />
        <div class="flex gap-2">
          <p class="font-bold">Total cost:</p>
          <p>{UnitKeys.reduce((acc, key) => acc + UnitDefinitions[key].cost * (props.army.units[key]?.length ?? 0), 0)} ipc</p>
        </div>
      </div>
    </div>
  )
}

const Unit: Component<{ unitKey: typeof UnitKeys[number], state: ArmyUnitState, side: "attack"|"defense" }> = (props) => {
  return (
    <div class="bg-black p-1 m-1 rounded-md">
      <img class="w-8 h-8" src={UnitIcons[props.unitKey]} />
      <p class="text-xs font-bold rounded-md px-1 text-stone-300" classList={{ "bg-red-500 text-black": !!props.state.roll && (props.state.roll <= UnitDefinitions[props.unitKey][props.side]) }}>Roll: {props.state.roll || "_"}</p>
    </div>
  )
}