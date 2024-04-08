import fighterIcon from './airplane.svg';
import antiAircraftIcon from './anti-aircraft-gun.svg';
import tankIcon from './battle-tank.svg';
import battleShipIcon from './battleship.svg';
import bomberIcon from './carpet-bombing.svg';
import infantryIcon from './brodie-helmet.svg';
import carrierIcon from './carrier.svg';
import cruiserIcon from './cruiser.svg';
import destroyerIcon from './cruiser.svg';
import transportIcon from './cargo-ship.svg';
import submarineIcon from './submarine.svg';
import artilleryIcon from './field-gun.svg';

export const UnitIcons = {
  INFANTRY: infantryIcon,
  ARTILLERY: artilleryIcon,
  TANK: tankIcon,
  FIGHTER: fighterIcon,
  BOMBER: bomberIcon,
  SUBMARINE: submarineIcon,
  TRANSPORT: transportIcon,
  DESTROYER: destroyerIcon,
  CRUISER: cruiserIcon,
  CARRIER: carrierIcon,
  BATTLESHIP: battleShipIcon,
  AA_GUN: antiAircraftIcon,
} as const;
