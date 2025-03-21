<script>
    import { getContext } from 'svelte';
    import { useMetric } from '../../../../stores/useMetric';
    import { get } from 'svelte/store';

    const { width, height, xScale, yRange } = getContext('LayerCake');

    export let gridlines = true;
    export let tickMarks = false;
    export let formatTick = (/** @type {any} */ d) => d;
    export let baseline = false;
    export let snapTicks = false;
    export let ticks = undefined;
    export let xTick = undefined;
    export let yTick = 16;
    export let dxTick = 0;
    export let dyTick = 0;
    export let isVolume = false;
    export let isTime = false;
    export let isStartTime = false;
    export let isWeekday = false;
    export let isYear = false;

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

    // Add additional ticks for dividing lines
    $: if (isWeekday) {
        const dayTicks = [];
        for (let i = 0; i <= 7; i++) {
            dayTicks.push(i * 86400); // 86400 seconds in a day
        }
        tickVals = dayTicks;
    } else if (isYear) {
        const monthTicks = [];
        for (let i = 0; i <= 12; i++) {
            monthTicks.push(i * 2592000); // 2592000 seconds in a month (approx)
        }
        tickVals = monthTicks;
    } else if (isVolume) {
        tickVals = $xScale.ticks(ticks / 2); // Reduce the number of ticks for volume
    }

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

    function formatVolumeTick(tick) {
        const metric = get(useMetric);
        return metric 
            ? `${(tick / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg` 
            : `${(tick / 453.592).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} lbs`;
    }

    function formatTimeTick(tick) {
        const hours = Math.floor(tick / 3600);
        const minutes = Math.floor((tick % 3600) / 60);
        return `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
    }

    function formatStartTimeTick(tick) {
        const hours = Math.floor(tick / 3600);
        const minutes = Math.floor((tick % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    function formatWeekdayTick(tick) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayIndex = Math.floor(tick / 86400);
        return days[dayIndex % 7];
    }

    function formatYearTick(tick) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = Math.floor(tick / 2592000);
        return months[monthIndex % 12];
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
                x="{isWeekday ? $xScale(tick + 43200) : (xTick || isBandwidth ? $xScale.bandwidth() / 2 : 0)}"
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
                {:else if isWeekday && tick % 86400 === 0}
                    {formatWeekdayTick(tick)}
                {:else if isYear && tick % 2592000 === 0}
                    {formatYearTick(tick)}
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