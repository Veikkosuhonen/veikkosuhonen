export const CloudSvg = () => (
  <div class="absolute -z-10 h-[100vh] container mx-auto flex flex-col">
    <div class="mx-6 flex-1 rounded-t-xl relative" style={{
      "background-color": "rgb(249,221,185)",
      background: "linear-gradient(90deg, rgba(249,221,185,1) 0%, rgba(244,188,150,1) 25%, rgba(238,129,111,1) 50%, rgba(163,95,94,1) 75%, rgba(84,77,98,1) 100%)",
    }}>
      <div class="w-full h-full absolute -top-[150px]">
        <div 
          class="w-full h-[1000px]"
          style={{ 
          'background-image': `url(assets/clouds.svg)`,
          'background-size': 'cover',
          scale: '1 0.8'
        }}/>
      </div>
    </div>
    <div class="mx-6 flex-1 bg-[#182542] rounded-b-xl flex flex-col">
      <div class="mt-auto" style={{
        rotate: "-90deg",
        translate: "49% -48vw",
        "font-size": "0.6rem",
      }}>
        <p class="font-mono z-20 text-sunset-400">Colors from https://youtu.be/vDQPSLAyleI</p>
      </div>
    </div>
  </div>
)