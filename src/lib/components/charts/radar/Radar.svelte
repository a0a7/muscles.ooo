<script>
  import { getContext } from 'svelte';
  import { line, curveCardinalClosed } from 'd3-shape';

  const { data, width, height, xGet, config } = getContext('LayerCake');

  /**  @type {String} [fill='#f0c'] The radar's fill color. This is technically optional because it comes with a default value but you'll likely want to replace it with your own color. */
  export let fill = '#079';

  /**  @type {String} [stroke='#f0c'] The radar's stroke color. This is technically optional because it comes with a default value but you'll likely want to replace it with your own color. */
  export let stroke = '#079';

  /**  @type {Number} [stroke=2] The radar's stroke color. */
  export let strokeWidth = 2;

  /**  @type {Number} [fillOpacity=0.5] The radar's fill opacity. */
  export let fillOpacity = 0.5;

  /**  @type {Number} [r=4.5] Each circle's radius. */
  export let r = 4.5;

  /**  @type {String} [circleFill="#f0c"] Each circle's fill color. This is technically optional because it comes with a default value but you'll likely want to replace it with your own color. */
  export let circleFill = '#068';

  /**  @type {String} [circleStroke="#fff"] Each circle's stroke color. This is technically optional because it comes with a default value but you'll likely want to replace it with your own color. */
  export let circleStroke = '#079';

  /**  @type {Number} [circleStrokeWidth=1] Each circle's stroke width. */
  export let circleStrokeWidth = 0;

  $: angleSlice = (Math.PI * 2) / $config.x.length;

  $: path = line()
    .curve(curveCardinalClosed) // @ts-ignore
    .x((d, i) => d * Math.cos(angleSlice * i - Math.PI / 2))    // @ts-ignore
    .y((d, i) => d * Math.sin(angleSlice * i - Math.PI / 2));
</script>

<g transform="translate({$width / 2}, {$height / 2})">
  {#each $data as row}
    {@const xVals = $xGet(row)}
    {#if path(xVals)}
      <!-- Draw a line connecting all the dots -->
      <path
        class="path-line"
        d={path(xVals)}
        {stroke}
        stroke-width={strokeWidth}
        {fill}
        fill-opacity={fillOpacity}
      ></path>

      <!-- Plot each dots -->
      {#each xVals as circleR, i}
        {@const thisAngleSlice = angleSlice * i - Math.PI / 2}
        <circle
          cx={circleR * Math.cos(thisAngleSlice)}
          cy={circleR * Math.sin(thisAngleSlice)}
          r={r}
          fill={circleFill}
          stroke={circleStroke}
          stroke-width={circleStrokeWidth}>
        </circle>
      {/each}
    {/if}
  {/each}
</g>

<style>
  .path-line {
    stroke-linejoin: round;
    stroke-linecap: round;
  }
</style>