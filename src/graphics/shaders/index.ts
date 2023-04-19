import basicVertex from "./basic.vert?raw"
import basicGles3Vertex from "./basicGles3.vert?raw"
import basicFragment from "./basic.frag?raw"
import hdrFragment from "./hdr.frag?raw"
import baseGeneration from "./baseGeneration.frag?raw"
import map from "./map.frag?raw"
import erosion from "./erosion.frag?raw"
import shadow from "./shadow.frag?raw"

const shaders = {
  basicVertex,
  basicGles3Vertex,
  basicFragment,
  hdrFragment,
  baseGeneration,
  map,
  erosion,
  shadow,
}

export default shaders