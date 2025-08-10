<script>
  import { getContext } from 'svelte';
  const { yScale, xRange, yRange } = getContext('LayerCake');

  export let tickMarks = false;
  export let gridlines = true;
  export let tickMarkLength = 6;
  export let format = (/** @type {any} */ d) => d;
  export let ticks = undefined;
  export let dx = -8;
  export let tickGutter = 0;

  $: tickVals = Array.isArray(ticks)
    ? ticks
    : typeof $yScale.ticks === 'function'
      ? $yScale.ticks(ticks)
      : $yScale.domain();

  $: isBandwidth = typeof $yScale.bandwidth === 'function';
  $: halfBand = isBandwidth ? $yScale.bandwidth() / 2 : 0;
</script>

<g class="axis-y">
  {#each tickVals as tick}
    {#if gridlines}
      <line
        x1={$xRange[0]}
        x2={$xRange[1]}
        y1={$yScale(tick) + halfBand}
        y2={$yScale(tick) + halfBand}
        stroke="#eee"
        stroke-width="1"
      />
    {/if}
    {#if tickMarks}
      <line
        x1={$xRange[0] - tickMarkLength}
        x2={$xRange[0]}
        y1={$yScale(tick) + halfBand}
        y2={$yScale(tick) + halfBand}
        stroke="#aaa"
        stroke-width="1"
      />
    {/if}
    <text
      x={$xRange[0] + dx}
      y={$yScale(tick) + halfBand + 4}
      text-anchor="end"
      font-size="11"
      fill="#666"
      alignment-baseline="middle"
    >
      {format(tick)}
    </text>
  {/each}
</g>