<script>
    import { getContext } from 'svelte'; // @ts-ignore
    import { AccurateBeeswarm } from 'accurate-beeswarm-plot';
    import { onMount } from 'svelte';
    import { useMetric } from '../../../../stores/useMetric';
    import { get } from 'svelte/store';
    import { scaleLog, scaleLinear } from 'd3-scale';
    import { extent } from 'd3-array';

    const { data: dataStore, padding, height, width, config, custom } = getContext('LayerCake');

    export let r = 3;
    export let strokeWidth = 0;
    export let strokeColor = '#fff';
    export let spacing = 1;
    export let useLogScale = true;

    let data = [];
    let hoveredCircle = null;
    let tooltipPosition = { x: 0, y: 0 };
    let tooltipVisible = false;
    let xScale;
    let circles = [];

    dataStore.subscribe(value => {
        data = value;
    });

    const handleMouseOver = (event, circle) => {
      if (!tooltipVisible) {
        updateTooltipPosition(event, circle);
      }
    };

    const handleMouseOut = () => {
      if (!tooltipVisible) {
        hoveredCircle = null;
      }
    };

    const handleClick = (event, circle) => {
      tooltipVisible = true;
      updateTooltipPosition(event, circle);
    };

    const updateTooltipPosition = (event, circle) => {
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
        }
      }
    };

    const handleDocumentClick = (event) => { // @ts-ignore
      if (event.target && !event.target.closest('.tooltip-content') && !event.target.closest('circle')) {
        tooltipVisible = false;
        hoveredCircle = null;
      }
    };

    document.addEventListener('click', handleDocumentClick);

    const xGet = d => {
        if (!custom || !custom.x) {
            console.error('custom.x is not defined');
            return null;
        }
        return d[custom.x];
    };

    $: {
        console.log('Custom object:', custom);
        if (!custom || !custom.x) {
            console.error('custom.x is not defined');
        } else if (!Array.isArray(data)) {
            console.error('Data is not an array:', data);
        } else {
            const values = data.map(xGet).filter(v => v != null);
            if (values.length === 0) {
                console.warn('No valid values found for xGet:', xGet);
            }
            xScale = useLogScale ? scaleLog() : scaleLinear();
            xScale.domain(extent(values)).range([padding.left, width - padding.right]);
            console.log('xScale domain:', xScale.domain());
            console.log('xScale range:', xScale.range());
        }
    }

    $: {
        if (!custom || !custom.x) {
            console.error('custom.x is not defined');
        } else if (!Array.isArray(data)) {
            console.error('Data is not an array:', data);
        } else {
            console.log('Data:', data);
            circles = new AccurateBeeswarm(data, r + (spacing + strokeWidth) / 2, (d) => {
                return xScale(xGet(d));
            })
            .oneSided()
            .calculateYPositions()
            .map((d) => ({ x: d.x, y: d.y, data: d.datum }));
            console.log('Circles:', circles);
        }
    }

    const formatTime = (seconds) => {
      const minutes = seconds / 60;
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      return `${h > 0 ? h + "h" : ""} ${m}m`;
    };

    const formatDistance = (distance) => {
      const metric = get(useMetric);
      return metric 
          ? `${(distance / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km` 
          : `${(distance / 1609.34).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
    };

    const formatSpeed = (speed) => {
      const metric = get(useMetric);
      return metric 
          ? `${speed.toFixed(2)} km/h` 
          : `${(speed / 1.60934).toFixed(2)} mph`;
    };

    const formatTimeOfDay = (startTime) => {
        startTime = Number(startTime);
        const hour = Math.floor(startTime / 3600);
      const minute = Math.floor((startTime % 3600) / 60);
      return `${hour}:${minute < 10 ? '0' + minute : minute}`;
    };
</script>

<g id="beeswarmContainer" class='bee-group'>
  {#each circles as d}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
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
        <b>Distance:</b> {formatDistance(hoveredCircle.data.data.distance)}
      </p>
      <p class="m-0">
        <b>Duration:</b> {formatTime(hoveredCircle.data.data.duration)}
      </p>
      <p class="m-0">
        <b>Elevation Gain:</b> {hoveredCircle.data.data.elevationGain.toFixed(0)} m
      </p>
      <p class="m-0">
        <b>Calories:</b> {hoveredCircle.data.data.calories.toFixed(0)} kcal
      </p>
      <p class="m-0">
        <b>Avg Speed:</b> {formatSpeed(hoveredCircle.data.data.avgSpeed)}
      </p>
      <p class="m-0">
        <b>Start Time:</b> {formatTimeOfDay(hoveredCircle.data.data.startTime)}
      </p>
    </div>
  </foreignObject>
{/if}

<style>
  .tooltip-content {
    pointer-events: none;
  }
</style>