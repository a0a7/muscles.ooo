<script>
    import { getContext } from 'svelte';
    import { useMetric } from '../../../../stores/useMetric';
    import { get } from 'svelte/store';
    import { format } from 'date-fns';

    const { width, height, xScale, yRange } = getContext('LayerCake');

    export let gridlines = true;
    export let tickMarks = false;
    export let formatTick = (/** @type {any} */ d) => d;
    export let baseline = false;
    export let snapTicks = false;
    /**
	 * @type {number | ((arg0: any) => any) | undefined}
	 */
     export let ticks = undefined;
    export let xTick = undefined;
    export let yTick = 16;
    export let dxTick = 0;
    export let dyTick = 0;
    export let isVolume = false;
    export let isTime = false;
    export let isStartTime = false;

    $: isBandwidth = typeof $xScale.bandwidth === 'function';

    // Determine the number of ticks based on viewport width
    $: {
        const viewportWidth = window.innerWidth;
        if (viewportWidth < 768) {
            ticks = 5; // Fewer ticks for mobile
        } else {
            ticks = 10; // More ticks for larger screens
        }
    }

    $: tickVals = Array.isArray(ticks) ? ticks :
        isBandwidth ?
            $xScale.domain() :
            typeof ticks === 'function' ?
                // @ts-ignore
                ticks($xScale.ticks()) :
                    $xScale.ticks(ticks);

    /**
     * @param {number} i
     */
    function textAnchor(i) {
        if (snapTicks === true) {
            if (i === 0) {
                return 'start';
            }
            if (i === tickVals.length - 1) {
                return 'end';
            }
        }
        return 'middle';
    }

    /**
     * @param {number} tick
     */
    function formatVolumeTick(tick) {
        const metric = get(useMetric);
        return metric 
            ? `${(tick / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg` 
            : `${(tick / 453.592).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} lbs`;
    }

    /**
     * @param {number} tick
     */
    function formatTimeTick(tick) {
        const hours = Math.floor(tick / 3600);
        const minutes = Math.floor((tick % 3600) / 60);
        return `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
    }

    /**
     * @param {number} tick
     */
    function formatStartTimeTick(tick) {
        const hours = Math.floor(tick / 3600);
        const minutes = Math.floor((tick % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
</script>

<g class='axis x-axis'>
    {#each tickVals as tick, i}
        <g class='tick tick-{ tick }' transform='translate({$xScale(tick)},{$yRange[0]})'>
            {#if gridlines !== false}
                <line class="gridline" y1='{$height * -1}' y2='0' x1='0' x2='0'></line>
            {/if}
            {#if tickMarks === true}
                <line class="tick-mark" y1='{0}' y2='{6}' x1='0' x2='0'></line>
            {/if}
            <text class="dark:invert"
                x="{xTick || isBandwidth ? $xScale.bandwidth() / 2 : 0 }"
                y='{yTick}'
                dx='{dxTick}'
                dy='{dyTick}'
                text-anchor='{textAnchor(i)}'>
                {#if isVolume}
                    {formatVolumeTick(tick)}
                {:else if isTime}
                    {formatTimeTick(tick)}
                {:else if isStartTime}
                    {formatStartTimeTick(tick)}
                {:else}
                    {formatTick(tick)}
                {/if}
            </text>
        </g>
    {/each}
    {#if baseline === true}
        <line class="baseline" y1='{$height + 0.5}' y2='{$height + 0.5}' x1='0' x2='{$width}'></line>
    {/if}
</g>

<style>
    line,
    .tick line {
        stroke: #aaa;
        stroke-dasharray: 2;
    }

    .tick text {
        fill: #222;
    }

    .tick .tick-mark,
    .baseline {
        stroke-dasharray: 0;
    }
</style>