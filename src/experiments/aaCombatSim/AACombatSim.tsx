import { SetStoreFunction, createStore } from "solid-js/store";
import { Army, ArmyUnitState, UnitDefinitions, UnitKeys, createNewUnitState } from "./units";
import { Component, For, Show, batch, createSignal } from "solid-js";
import { UnitIcons } from "./icons";
import { Icon } from "solid-heroicons";
import { xMark } from "solid-heroicons/solid-mini";

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

type UnitCount = {
  [key in typeof UnitKeys[number]]: number
}

type ArmyRound = {
  damage: UnitCount,
  losses: UnitCount,
}

type Round = {
  attacker: ArmyRound,
  defender: ArmyRound,
}

type BattleResult = undefined|"attacker victory"|"defender victory"|"draw"

type BattleState = {
  started: boolean,
  result: BattleResult,
  rounds: Round[],
  attackerIPCLosses?: number,
  defenderIPCLosses?: number,
}

const [battleState, setBattleState] = createStore<BattleState>({
  started: false,
  result: undefined,
  rounds: [],
})

const [simulationHistory, setSimulationHistory] = createStore({
  battles: [] as BattleState[],
})

const getArmyUnitsDamage = (army: Army): UnitCount => 
  Object.fromEntries(UnitKeys.map((key) => [key, army.units[key]?.reduce((acc, unit) => acc + (unit.hp > 0 && (unit.roll <= UnitDefinitions[key][army.side]) ? 1 : 0), 0) ?? 0])) as UnitCount

const applyArmyDamage = (army: Army, setArmy: SetStoreFunction<Army>, damage: number): UnitCount => {
  const losses = {} as { [key in typeof UnitKeys[number]]: number }
  let remainingDamage = damage
  
  const prioritisedArmyUnits = UnitKeys.map(key => ({ key, priority: army.priority[key] ?? 0, cost: UnitDefinitions[key].cost }))
    .sort((a, b) => {
      if (a.priority === b.priority) {
        return a.cost - b.cost
      }
      return a.priority - b.priority
    })
    .map(({ key }) => key)
  
  // Mark losses in order of army's priorities
  prioritisedArmyUnits.forEach((key) => {
    const units = army.units[key]?.filter(unit => unit.hp > 0) ?? []
    units.forEach((unit) => {
      if (remainingDamage > 0) {
        remainingDamage -= 1
        losses[key] = (losses[key] ?? 0) + 1
      }
    })
  })

  // Reduce hp of units
  batch(() => {
    UnitKeys.forEach((key) => {
      const units = army.units[key] ?? []
      let remainingLosses = losses[key] ?? 0
      units.forEach((unit, idx) => {
        if (remainingLosses > 0 && unit.hp > 0) {
          remainingLosses -= 1
          setArmy("units", key, idx, "hp", (hp) => hp - 1)
        }
      })
    })
  })

  return losses
}

const getTotalDamage = (damageCount: UnitCount) => {
  return Object.values(damageCount).reduce((acc, damage) => acc + damage)
}

const getTotalIPCLosses = (army: Army) => {
  return UnitKeys.reduce((acc, key) => acc + (UnitDefinitions[key].cost * (army.units[key]?.filter(unit => unit.hp === 0)?.length ?? 0)), 0)
}

const finishBattle = (result: BattleResult) => batch(() => {
  setBattleState("result", result)
  setBattleState("attackerIPCLosses", getTotalIPCLosses(attacker))
  setBattleState("defenderIPCLosses", getTotalIPCLosses(defender))
  setSimulationHistory("battles", [...simulationHistory.battles, { ...battleState, rounds: [...battleState.rounds] } ])
})

export default function AACombatSim() {

  const [isSimulating, setIsSimulating] = createSignal(false)

  const handleRound = () => batch(() => {

    setBattleState("started", true)

    setAttacker("units", UnitKeys, {}, (state) => ({ ...state, roll: state.hp ? Math.floor(Math.random() * 6) + 1 : 0 }))
    setDefender("units", UnitKeys, {}, (state) => ({ ...state, roll: state.hp ? Math.floor(Math.random() * 6) + 1 : 0 }))
    

    const attackerDamage = getArmyUnitsDamage(attacker)
    const attackerTotalDamage = Object.values(attackerDamage).reduce((acc, damage) => acc + damage, 0)

    const defenderDamage = getArmyUnitsDamage(defender)
    const defenderTotalDamage = Object.values(defenderDamage).reduce((acc, damage) => acc + damage, 0)

    const attackerLosses = applyArmyDamage(attacker, setAttacker, defenderTotalDamage)
    const defenderLosses = applyArmyDamage(defender, setDefender, attackerTotalDamage)

    setBattleState("rounds", [...battleState.rounds, {
      attacker: {
        damage: attackerDamage,
        losses: attackerLosses,
      },
      defender: {
        damage: defenderDamage,
        losses: defenderLosses,
      },
    }])

    const attackerUnitsLeft = Object.values(attacker.units).reduce((acc, units) => acc + units.filter(unit => unit.hp).length, 0)
    const defenderUnitsLeft = Object.values(defender.units).reduce((acc, units) => acc + units.filter(unit => unit.hp).length, 0)

    if (attackerUnitsLeft === 0) {
      if (defenderUnitsLeft === 0) {
        finishBattle("draw")
      } else {
        finishBattle("defender victory")
      }
    } else if (defenderUnitsLeft === 0) {
      finishBattle("attacker victory")
    }
  })

  const handleResetBattle = () => batch(() => {
    UnitKeys.forEach((key) => {
      setAttacker("units", key, {}, () => createNewUnitState(UnitDefinitions[key]))
      setDefender("units", key, {}, () => createNewUnitState(UnitDefinitions[key]))
    })
    setBattleState({
      started: false,
      result: undefined,
      rounds: [],
    })
  })

  const handleArmyChange = () => {
    if ((simulationHistory.battles.length > 0 || battleState.started)) {
      if (!window.confirm('Changing army will reset the battle and stats. Are you sure?')) return false
      handleResetBattle()
      setSimulationHistory("battles", [])
    }
    return true
  }

  const handleSwapSides = () => batch(() => {
    if (!handleArmyChange()) return
  
    const tempArmy = {
      units: attacker.units,
      priority: attacker.priority,
    }

    setAttacker({
      name: "Attacker",
      side: "attack",
      units: defender.units,
      priority: defender.priority,
    })

    setDefender({
      name: "Defender",
      side: "defense",
      units: tempArmy.units,
      priority: tempArmy.priority,
    })
  })

  const playToEnd = (msPerRound: number) => new Promise<void>(resolve => {
    const playRound = (resolve: () => void) => {
      if (!battleState.result) {
        handleRound()
        setTimeout(() => playRound(resolve), msPerRound)
      } else {
        resolve()
      }
    }

    playRound(resolve)
  })

  const handlePlayToEnd = async () => {
    setIsSimulating(true)
    await playToEnd(200)
    setIsSimulating(false)
  }

  const handlePlayNTimes = async (n: number) => {
    setIsSimulating(true)
    while (n > 0) {
      await playToEnd(16)
      handleResetBattle()
      console.log(n)
      n--
    }
    setIsSimulating(false)
  }

  const lastRound = () => battleState.rounds[battleState.rounds.length - 1]

  const attackerWins = () => simulationHistory.battles.filter(battle => battle.result === "attacker victory").length

  const attackerAverageLoss = () => {
    const totalLosses = simulationHistory.battles.reduce((acc, battle) => acc + (battle.attackerIPCLosses ?? 0), 0)
    return (totalLosses / simulationHistory.battles.length).toFixed(1)
  }

  const defenderAverageLoss = () => {
    const totalLosses = simulationHistory.battles.reduce((acc, battle) => acc + (battle.defenderIPCLosses ?? 0), 0)
    return (totalLosses / simulationHistory.battles.length).toFixed(1)
  }

  return (
    <div class="container mx-auto my-16">
      <h1 class="text-4xl font-bold mb-4">Axis & Allies Combat Simulator</h1>
      <p class="mb-32 font-light whitespace-pre-wrap">
        A quick tool for testing combat, based on the rules of Axis & Allies Anniversary Edition.

        Choose the number of units for each side, and optionally set the priority for each unit. 
        The priority determines the order in which losses are assigned: lowest priority units take damage first. 
        In case of equal priority (the default), the cheapest unit takes damage first.

        Some rules are not yet implemented, such as artillery support, submerging submarines, battleship hull damage priority and retreating.
      </p>
      <div class="flex mb-16">
        <ArmyPicker army={attacker} setArmy={setAttacker} handleArmyChange={handleArmyChange} />
        <div class="flex items-center">
          <button class="rounded-md border border-stone-500 p-2 text-sm" onMouseDown={handleSwapSides}>
            Swap sides
          </button>
        </div>
        <ArmyPicker army={defender} setArmy={setDefender} handleArmyChange={handleArmyChange} />
      </div>
      <div class="flex">
        <ArmyBoard army={attacker} />
        <div class="basis-1/5 bg-stone-900 m-1 p-4">
          <Show when={!battleState.result || isSimulating()} fallback={<>
            <p class="mb-2">{battleState.result} in {battleState.rounds.length} rounds</p>
            <button onMouseDown={handleResetBattle} class="bg-red-900 p-2 rounded-md mb-2 hover:bg-red-700 shadow-md hover:shadow-red-700/50">
              Restart battle
            </button>
          </>}>
            <button 
              disabled={isSimulating()}
              onMouseDown={handleRound}
              class="w-full bg-red-900 p-2 rounded-md mb-2 hover:bg-red-700 shadow-md hover:shadow-red-700/50"
            >
              Roll
            </button>
            <button 
              disabled={isSimulating()}
              onMouseDown={handlePlayToEnd}
              class="w-full p-1 rounded-md mb-2 border border-red-900 hover:border-red-700 text-xs"
            >
              Play to end
            </button>
            <button 
              disabled={isSimulating()}
              onMouseDown={() => handlePlayNTimes(100)}
              class="w-full p-1 rounded-md mb-2 border border-red-900 hover:border-red-700 text-xs"
            >
              Play 100 times
            </button>
          </Show>
          <Show when={battleState.started}>
            <div class="flex mt-4">
              <div class="flex-1">
                <p class="text-sm text-stone-300">Attacker damage:</p>
                <p>{getTotalDamage(lastRound().attacker.damage)}</p>
                <p class="text-sm text-stone-300">Attacker losses:</p>
                <p>{getTotalIPCLosses(attacker)} ipc</p>
              </div>
              <div class="flex-1">
                <p class="text-sm text-stone-300">Defender damage:</p>
                <p>{getTotalDamage(lastRound().defender.damage)}</p>
                <p class="text-sm text-stone-300">Defender losses:</p>
                <p>{getTotalIPCLosses(defender)} ipc</p>
              </div>
            </div>
          </Show>
          <Show when={simulationHistory.battles.length > 0}>
            <div class="mt-4">
              <p class="text-sm text-stone-300">Attacker wins:</p>
              <p>{attackerWins()}/{simulationHistory.battles.length} ({(100 * (attackerWins() / simulationHistory.battles.length)).toFixed(1)} %)</p>
              <p class="text-sm mt-2 text-stone-300">Attacker average loss:</p>
              <p>{attackerAverageLoss()} ipc</p>
              <p class="text-sm mt-2 text-stone-300">Defender average loss:</p>
              <p>{defenderAverageLoss()} ipc</p>
            </div>
          </Show>
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

const ArmyPicker: Component<{ army: Army, setArmy: SetStoreFunction<Army>, handleArmyChange: () => boolean }> = (props) => {
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
                  if (!props.handleArmyChange()) return
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
                  if (!props.handleArmyChange()) return
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
      <div class="relative">
        <img class="w-8 h-8" src={UnitIcons[props.unitKey]} />
        <Show when={props.state.hp === 0}>
          <Icon path={xMark} class="absolute top-0 left-0 w-8 h-8 text-red-500" />
        </Show>
      </div>
      <p class="text-xs font-bold rounded-md px-1 text-stone-300" 
        classList={{ 
          "bg-red-500 text-black": !!props.state.roll && (props.state.roll <= UnitDefinitions[props.unitKey][props.side]) 
        }}
      >
        Roll: {props.state.roll || "_"}
      </p>
    </div>
  )
}
