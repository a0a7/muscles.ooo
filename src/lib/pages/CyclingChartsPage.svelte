<script lang="ts">
    import { onMount } from 'svelte';
    import { format, subDays, subYears, parseISO, getDayOfYear, getDay, differenceInDays } from 'date-fns';
    import { Button } from "$lib/components/ui/button";
    import Label from '$lib/components/ui/label/label.svelte';
    import CyclingBeeswarm from '$lib/components/charts/beeswarm/CyclingBeeswarm.svelte';
    import CyclingAxisX from '$lib/components/charts/beeswarm/CyclingAxisX.svelte';
    import { get } from 'svelte/store';
  
    import { LayerCake, Svg } from 'layercake'; // @ts-ignore
    import { scaleLog, scaleLinear   } from 'd3-scale';
    import { format as d3Format } from 'd3-format';
    import { useMetric } from '../../stores/useMetric';
  
    export let activities: any[] = [];
  
    let filteredActivities = activities;
    let startDate = new Date();
    let endDate = new Date();
    let timeFilter = 'allTime';
    let metricFilter = 'distance';
    let useLogScale = true;
  
    const filterActivities = () => {
      const now = new Date();
      switch (timeFilter) {
        case 'last7days':
          startDate = subDays(now, 7);
          endDate = now;
          break;
        case 'last30days':
          startDate = subDays(now, 30);
          endDate = now;
          break;
        case 'lastYear':
          startDate = subYears(now, 1);
          endDate = now;
          break;
        case 'allTime':
          startDate = new Date(0); // Earliest possible date
          endDate = now;
          break;
        default:
          startDate = new Date(timeFilter);
          endDate = new Date(timeFilter);
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
      filteredActivities = activities.filter(activity => {
        const activityDate = new Date(activity.startTime);
        return activityDate >= startDate && activityDate < endDate;
      });
    };
  
    onMount(() => {
      filterActivities();
    });
  
    $: filterActivities();
  
    let beeswarmData: any[] = [];
  
    $: beeswarmData = filteredActivities.map(activity => {
      if (!activity.dist || activity.dist === 0) {
        return null;
      }
      const date = new Date(activity.startTime);
      const dayOfWeek = (getDay(date) + 6) % 7; // Adjust to make Monday the first day of the week
      const timeOfDay = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
      const dayTimeOfWeek = dayOfWeek * 86400 + timeOfDay; // Total seconds since the start of the week
      return {
        name: activity.name,
        distance: activity.dist,
        duration: activity.time,
        elevationGain: activity.elevationGain,
        calories: activity.calories,
        avgSpeed: activity.avgSpeed,
        startTime: timeOfDay,
        dayTimeOfWeek: dayTimeOfWeek,
        date: format(parseISO(activity.startTime), 'yyyy-MM-dd'),
        dayOfYear: getDayOfYear(date),
        daysSinceStart: differenceInDays(date, startDate)
      };
    }).filter(d => d !== null);
  
    const metrics = {
      distance: 'Distance',
      duration: 'Duration',
      avgSpeed: 'Average Speed',
      elevationGain: 'Elevation Gain',
      calories: 'Calories',
      startTime: 'Time of Day (Start)'
    };
  
    const titleKey = 'date';
  
    const r = 4;
  
    $: dataTransformed = beeswarmData.map(d => {
      return {
        title: d[titleKey],
        [metricFilter]: +(d as any)[metricFilter],
        data: d
      };
    });
  
    const addCommas = d3Format(',');
  
    function calculateMeanAndStdDev(data: any[], key: string) {
      const values = data.map(d => d[key]).filter(v => v != null && !isNaN(v));
      const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length);
      return { mean, stdDev };
    }
  
    function formatTime(seconds: number) {
      const minutes = seconds / 60;
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      return `${h > 0 ? h + "h " : ""}${m}m`;
    }
  
    function formatStartTime(seconds: number) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  
    function formatDistance(distance: number) {
      const metric = get(useMetric);
      return metric 
          ? `${(distance / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km` 
          : `${(distance / 1609.34).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
    }
  
    $: stats = calculateMeanAndStdDev(beeswarmData, metricFilter);
  
    $: formattedMean = metricFilter === 'startTime' ? formatStartTime(stats.mean) : 
                       metricFilter === 'duration' ? formatTime(stats.mean) : 
                       metricFilter === 'distance' ? formatDistance(stats.mean) : 
                       stats.mean.toFixed(2);
  
    $: formattedStdDev = metricFilter === 'startTime' ? formatStartTime(stats.stdDev) : 
                         metricFilter === 'duration' ? formatTime(stats.stdDev) : 
                         metricFilter === 'distance' ? formatDistance(stats.stdDev) : 
                         stats.stdDev.toFixed(2);
  
    // Adjust tick count based on viewport width
    let tickCount = 10;
    $: {
      if (window.innerWidth < 768) {
        tickCount = 5;
      } else {
        tickCount = 10;
      }
    }
</script>
  
<div class="max-w-[86.5%] h-full px-6 lg:px-8 mx-auto items-center justify-center">
    <h2 class="text-3xl font-black mx-auto mt-8 text-center w-full">Cycling Metrics Beeswarm Charts</h2>
    <div class="mb-4 mt-8 w-full mx-auto flex flex-col items-center justify-center gap-2">
      <Label for="timeFilter">Filter by Time</Label>
      <div class="flex space-x-2 max-w-[75vw] overflow-x-scroll md:overflow-x-auto" id="timeFilter">
        <Button onclick={() => { timeFilter = 'allTime'; filterActivities(); }} variant={timeFilter==='allTime' ? "secondary" : "outline"} >All Time</Button>
        <Button onclick={() => { timeFilter = 'last7days'; filterActivities(); }} variant={timeFilter === 'last7days' ? "secondary" : "outline"}>Last 7 Days</Button>
        <Button onclick={() => { timeFilter = 'last30days'; filterActivities(); }} variant={timeFilter === 'last30days' ? "secondary" : "outline"}>Last 30 Days</Button>
        <Button onclick={() => { timeFilter = 'lastYear'; filterActivities(); }} variant={timeFilter === 'lastYear' ? "secondary" : "outline"}>Last Year</Button>
        {#each Array.from(new Set(activities.map(activity => new Date(activity.startTime).getFullYear()))).sort((a, b) => b - a) as year}
          <Button onclick={() => { timeFilter = year.toString(); filterActivities(); }} variant={timeFilter === year.toString() ? "secondary" : "outline"}>{year}</Button>
        {/each}
      </div>
    </div>
    <div class="mb-4 py-4 max-w-full mx-auto flex flex-col items-center justify-center gap-2">
      <Label for="metricFilter">Metric</Label>
      <div class="flex space-x-2 max-w-[75vw] overflow-x-scroll md:overflow-x-auto" id="metricFilter">
        {#each Object.entries(metrics) as [key, label]}
          <Button onclick={() => { metricFilter = key; }} variant={metricFilter === key ? "secondary" : "outline"}>{label}</Button>
        {/each}
      </div>
    </div>
    <div class="mb-4 py-4 max-w-full mx-auto flex flex-col items-center justify-center gap-2">
      <Label for="logScaleToggle">Log Scale</Label>
      <Button onclick={() => { useLogScale = !useLogScale; }} variant={useLogScale ? "secondary" : "outline"}>{useLogScale ? "On" : "Off"}</Button>
    </div>
    <div class="h-full w-full max-w-full lg:max-w-[60%] mx-auto p-4">
      <div class="h-full w-full">
        <LayerCake 
          padding={{bottom: 15}}
          x={metricFilter}
          data={dataTransformed}
          custom={{ getTitle: (d: { data: { title: string } }) => d.data.title }}
          let:width
          let:xScale
        >
          <Svg>
            <CyclingAxisX
              baseline={true}
              formatTick={addCommas}
              tickMarks={true}
              isDistance={metricFilter === 'distance'}
              isTime={metricFilter === 'duration'}
              isStartTime={metricFilter === 'startTime'}
              ticks={tickCount}
              useLogScale={useLogScale}
            />
            <CyclingBeeswarm
              r={width < 400 ? r / 1.6 : r*1.15}
              spacing={3}
              useLogScale={useLogScale}
            />
          </Svg>
        </LayerCake>
      </div>
    </div>
    <div class="mt-4 text-center">
      <p><strong>Mean:</strong> {formattedMean} - <strong>Standard Deviation:</strong> {formattedStdDev}</p>
    </div>
</div>