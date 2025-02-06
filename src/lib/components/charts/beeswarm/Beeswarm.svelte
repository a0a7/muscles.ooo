<script>
  import { getContext } from 'svelte'; // @ts-ignore
  import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
  // @ts-ignore
  // @ts-ignore
  import { onMount } from 'svelte';

  // @ts-ignore
  // @ts-ignore
  const { data, xGet, padding, height, config, custom } = getContext('LayerCake');

  export let r = 5;
  export let strokeWidth = 0;
  export let strokeColor = '#fff';
  export let spacing = 2;

  /**
   * @type {{ data: { data: { name: any; date: any; sets: any; workingTime: any; duration: any; reps: any; avgWeight: any; totalVolume: any; }; }} | null}
   */
  let hoveredCircle = null;
  let tooltipPosition = { x: 0, y: 0 };
  let tooltipVisible = false;

  const handleMouseOver = (/** @type {(MouseEvent | FocusEvent) & { currentTarget: EventTarget & SVGCircleElement; }} */ event, /** @type {{ data: { name: any; date: any; sets: any; duration: any; reps: any; avgWeight: any; totalVolume: any; }; } | null} */ circle) => {
    if (!tooltipVisible) {
      updateTooltipPosition(event, circle);
    }
  };

  const handleMouseOut = () => {
    if (!tooltipVisible) {
      hoveredCircle = null;
    }
  };

  const handleClick = (/** @type {MouseEvent & { currentTarget: EventTarget & SVGCircleElement; }} */ event, /** @type {{ data: { name: any; date: any; sets: any; duration: any; reps: any; avgWeight: any; totalVolume: any; }; } | null} */ circle) => {
    tooltipVisible = true;
    updateTooltipPosition(event, circle);
  };

  const updateTooltipPosition = (/** @type {MouseEvent | FocusEvent} */ event, /** @type {{ data: { name: any; date: any; sets: any; duration: any; reps: any; avgWeight: any; totalVolume: any; }; } | null} */ circle) => {
    const container = document.getElementById('beeswarmContainer');
    if (container) {
      const rect = container.getBoundingClientRect();
      const target = event.target;
      // @ts-ignore
      const targetRect = target.getBoundingClientRect();
      tooltipPosition = {
        x: targetRect.left + targetRect.width / 2 - rect.left,
        y: targetRect.top + targetRect.height / 2 - rect.top
      };
      // @ts-ignore
      hoveredCircle = circle;
      console.log(hoveredCircle);
    }
  };

  const handleDocumentClick = (/** @type {MouseEvent} */ event) => {
    // @ts-ignore
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
  <foreignObject x={tooltipPosition.x} y={tooltipPosition.y} width="200" height="150" class="tooltip">
    <div class="tooltip-content bg-[#eee] bg-opacity-90 p-2 rounded shadow-lg z-50 text-md font-medium text-gray-800 whitespace-nowrap">
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
        <b>Avg Weight:</b> {hoveredCircle.data.data.avgWeight.toFixed(0)}
      </p>
      <p class="m-0">
        <b> Volume:</b> {hoveredCircle.data.data.totalVolume}
      </p>
    </div>
  </foreignObject>
{/if}

<style>
  .tooltip-content {
    pointer-events: none;
  }
</style>