<script>
  import { getContext } from 'svelte';
  const { xScale, xRange, yRange } = getContext('LayerCake');

  export let tickMarks = false;
  export let gridlines = true;
  export let tickMarkLength = 6;
  export let baseline = false;
  export let format = (/** @type {any} */ d) => d;
  export let ticks = undefined;
  export let dy = 16;
  export let tickGutter = 0;

  $: tickVals = Array.isArray(ticks)
    ? ticks
    : typeof $xScale.ticks === 'function'
      ? $xScale.ticks(ticks)
      : $xScale.domain();

  $: isBandwidth = typeof $xScale.bandwidth === 'function';
  $: halfBand = isBandwidth ? $xScale.bandwidth() / 2 : 0;
</script>

<g class="axis-x">
  {#if baseline}
    <line
      x1={$xRange[0]}
      x2={$xRange[1]}
      y1={$yRange[1]}
      y2={$yRange[1]}
      stroke="#aaa"
      stroke-width="1"
    />
  {/if}
  {#each tickVals as tick}
    {#if gridlines}
      <line
        x1={$xScale(tick) + halfBand}
        x2={$xScale(tick) + halfBand}
        y1={$yRange[0]}
        y2={$yRange[1]}
        stroke="#eee"
        stroke-width="1"
      />
    {/if}
    {#if tickMarks}
      <line
        x1={$xScale(tick) + halfBand}
        x2={$xScale(tick) + halfBand}
        y1={$yRange[1]}
        y2={$yRange[1] + tickMarkLength}
        stroke="#aaa"
        stroke-width="1"
      />
    {/if}
    <text
      x={$xScale(tick) + halfBand}
      y={$yRange[1] + tickMarkLength + tickGutter + dy}
      text-anchor="middle"
      font-size="11"
      fill="#666"
    >
      {format(tick)}
    </text>
  {/each}
</g>