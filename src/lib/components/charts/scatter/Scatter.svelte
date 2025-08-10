<script>
  import { getContext } from 'svelte';
  const { data, xGet, yGet, xScale, yScale } = getContext('LayerCake');

  export let r = 5;
  export let fill = '#0cf';
  export let stroke = '#000';
  export let strokeWidth = 1;
  export let xKey;
  export let yKey;
  export let groupBy;
  export let tooltipFormat = {};
</script>

<g>
  {#each $data as d}
    <circle
      cx={$xGet(d)}
      cy={$yGet(d)}
      r={r}
      fill={fill}
      stroke={stroke}
      stroke-width={strokeWidth}
    />
  {/each}
</g>