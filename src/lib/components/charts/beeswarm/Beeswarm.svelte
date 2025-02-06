<script>
  import { getContext } from 'svelte'; // @ts-ignore
  import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
  import { onMount } from 'svelte';
  import { useMetric } from '../../../../stores/useMetric';
  import { get } from 'svelte/store';

  const { data, xGet, padding, height, config, custom } = getContext('LayerCake');

  export let r = 5;
  export let strokeWidth = 0;
  export let strokeColor = '#fff';
  export let spacing = 2;

  /**
	 * @type {{ data: { data: { name: any; date: any; sets: number; duration: any; workingTime: number; reps: number; avgWeight: number; totalVolume: any; }; }; } | null}
	 */
  let hoveredCircle = null;
  let tooltipPosition = { x: 0, y: 0 };
  let tooltipVisible = false;

  const handleMouseOver = (/** @type {FocusEvent & { currentTarget: EventTarget & SVGCircleElement; }} */ event, /** @type {any} */ circle) => {
    if (!tooltipVisible) {
      updateTooltipPosition(event, circle);
    }
  };

  const handleMouseOut = () => {
    if (!tooltipVisible) {
      hoveredCircle = null;
    }
  };

  const handleClick = (/** @type {MouseEvent & { currentTarget: EventTarget & SVGCircleElement; }} */ event, /** @type {any} */ circle) => {
    tooltipVisible = true;
    updateTooltipPosition(event, circle);
  };

  const updateTooltipPosition = (/** @type {FocusEvent & { currentTarget: EventTarget & SVGCircleElement; }} */ event, /** @type {any} */ circle) => {
    const container = document.getElementById('beeswarmContainer');
    if (container) {
      const rect = container.getBoundingClientRect();
      const target = event.target;
      if (target) { // @ts-ignore
        const targetRect = target.getBoundingClientRect();
        tooltipPosition = {
          x: targetRect.left + targetRect.width / 2 - rect.left,
          y: targetRect.top + targetRect.height / 2 - rect.top
        };
        hoveredCircle = circle;
        console.log(hoveredCircle);
        tooltipPosition = {
          x: targetRect.left + targetRect.width / 2 - rect.left,
          y: targetRect.top + targetRect.height / 2 - rect.top
        };
        hoveredCircle = circle;
        console.log(hoveredCircle);
      }
    }
  };

  const handleDocumentClick = (/** @type {MouseEvent} */ event) => { // @ts-ignore
    if (event.target && !event.target.closest('.tooltip-content') && !event.target.closest('circle')) {
      tooltipVisible = false;
      hoveredCircle = null;
    }
  };

  document.addEventListener('click', handleDocumentClick);

  $: circles = new AccurateBeeswarm($data, r + (spacing + strokeWidth) / 2, $xGet)
    .oneSided()
    .calculateYPositions()
    .map((/** @type {{ x: any; y: any; datum: any; }} */ d) => ({ x: d.x, y: d.y, data: d.datum }));

  const formatTime = (/** @type {number} */ seconds) => {
    const minutes = seconds / 60;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h > 0 ? h + "h" : ""} ${m}m`;
  };

  const formatSeconds = (/** @type {number} */ seconds) => {
    const m = seconds / 60;
    return `${m > 0 ? Math.round(m) + "m" : ""} ${Math.round(seconds)}s`;
  };

  const formatVolume = (/** @type {number} */ volume) => {
    const metric = get(useMetric);
    return metric 
        ? `${(volume / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg` 
        : `${(volume / 453.592).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} lbs`;
};
</script>

<g id="beeswarmContainer" class='bee-group'>
  {#each circles as d}
    <circle
      fill="#059"
      stroke={strokeColor}
      stroke-width={strokeWidth}
      cx={d.x}
      cy={$height - r - spacing - strokeWidth / 2 - d.y}
      r={r}
      role="button"
      tabindex="0"
      on:mouseover={(e) => handleMouseOver(e, d)}
      on:mouseout={handleMouseOut}
      on:focus={(e) => handleMouseOver(e, d)}
      on:blur={handleMouseOut}
      on:click={(e) => handleClick(e, d)}
    />
  {/each}
</g>

{#if hoveredCircle}
  <foreignObject x={tooltipPosition.x} y={tooltipPosition.y} width="200" height="300" class="tooltip">
    <div class="shadow-lg tooltip-content bg-background bg-opacity-90 p-2 rounded text-lg z-50 text-md font-medium text-foreground whitespace-nowrap">
      <h4 class="m-0 mb-1 font-bold">{hoveredCircle.data.data.name}</h4>
      <p class="m-0">
        <b>Date:</b> {hoveredCircle.data.data.date}
      </p>
      <p class="m-0">
        <b>Sets:</b> {hoveredCircle.data.data.sets}
      </p>
      <p class="m-0">
        <b>Duration:</b> {formatTime(hoveredCircle.data.data.duration)}
      </p>
      <p class="m-0">
        <b>Working Time:</b> {formatTime(hoveredCircle.data.data.workingTime)}
      </p>
      <p class="m-0">
        <b>Avg Time per Set:</b> {formatSeconds(hoveredCircle.data.data.workingTime / hoveredCircle.data.data.sets)}
      </p>
      <p class="m-0">
        <b>Reps:</b> {hoveredCircle.data.data.reps.toFixed(0)}
      </p>
      <p class="m-0">
        <b>Avg Weight:</b> {formatVolume(hoveredCircle.data.data.avgWeight)}
      </p>
      <p class="m-0">
        <b>Volume:</b> {formatVolume(hoveredCircle.data.data.totalVolume)}
      </p>
    </div>
  </foreignObject>
{/if}

<style>
  .tooltip-content {
    pointer-events: none;
  }
</style>