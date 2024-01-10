export type UnitType = "land" | "air" | "sea"

export type ArmyUnit = {
  name: string;
  type: UnitType;
  attack: number;
  defense: number;
  cost: number;
  initialState: ArmyUnitState;
}

export type ArmyUnitState = {
  hp: number;
  hasArtillerySupport: boolean;
  roll: number;
}

const createInitialState = (hp: number): ArmyUnitState => ({
  hp,
  hasArtillerySupport: false,
  roll: NaN,
})

export type Army = {
  name: string;
  side: "defense" | "attack";
  units: {
    [key in keyof typeof UnitDefinitions]?: ArmyUnitState[];
  };
  priority: {
    [key in keyof typeof UnitDefinitions]?: number;
  };
}

const INFANTRY: ArmyUnit = {
  name: "Infantry",
  type: "land",
  attack: 1,
  defense: 2,
  cost: 3,
  initialState: createInitialState(1),
} as const

const ARTILLERY: ArmyUnit = {
  name: "Artillery",
  type: "land",
  attack: 2,
  defense: 2,
  cost: 4,
  initialState: createInitialState(1),
} as const

const TANK: ArmyUnit = {
  name: "Tank",
  type: "land",
  attack: 3,
  defense: 3,
  cost: 5,
  initialState: createInitialState(1),
} as const

const FIGHTER: ArmyUnit = {
  name: "Fighter",
  type: "air",
  attack: 3,
  defense: 4,
  cost: 10,
  initialState: createInitialState(1),
} as const

const BOMBER: ArmyUnit = {
  name: "Bomber",
  type: "air",
  attack: 4,
  defense: 1,
  cost: 12,
  initialState: createInitialState(1),
} as const

const SUBMARINE: ArmyUnit = {
  name: "Submarine",
  type: "sea",
  attack: 2,
  defense: 1,
  cost: 6,
  initialState: createInitialState(1),
} as const

const TRANSPORT: ArmyUnit = {
  name: "Transport",
  type: "sea",
  attack: 0,
  defense: 0,
  cost: 7,
  initialState: createInitialState(1),
} as const

const DESTROYER: ArmyUnit = {
  name: "Destroyer",
  type: "sea",
  attack: 2,
  defense: 2,
  cost: 8,
  initialState: createInitialState(1),
} as const

const CRUISER: ArmyUnit = {
  name: "Cruiser",
  type: "sea",
  attack: 3,
  defense: 3,
  cost: 12,
  initialState: createInitialState(1),
} as const

const CARRIER: ArmyUnit = {
  name: "Carrier",
  type: "sea",
  attack: 1,
  defense: 2,
  cost: 14,
  initialState: createInitialState(1),
} as const

const BATTLESHIP: ArmyUnit = {
  name: "Battleship",
  type: "sea",
  attack: 4,
  defense: 4,
  cost: 20,
  initialState: createInitialState(2),
} as const

const AA_GUN: ArmyUnit = {
  name: "AA Gun",
  type: "land",
  attack: 0,
  defense: 0,
  cost: 6,
  initialState: createInitialState(1),
} as const

const UnitDefinitions = {
  INFANTRY,
  ARTILLERY,
  TANK,
  FIGHTER,
  BOMBER,
  SUBMARINE,
  TRANSPORT,
  DESTROYER,
  CRUISER,
  CARRIER,
  BATTLESHIP,
  AA_GUN,
}

export const UnitKeys = Object.keys(UnitDefinitions) as (keyof typeof UnitDefinitions)[]

export const createNewUnitState = (unit: ArmyUnit): ArmyUnitState => ({
  ...unit.initialState,
})

export {
  INFANTRY,
  ARTILLERY,
  TANK,
  FIGHTER,
  BOMBER,
  SUBMARINE,
  TRANSPORT,
  DESTROYER,
  CRUISER,
  CARRIER,
  BATTLESHIP,
  AA_GUN,
  UnitDefinitions,
}
