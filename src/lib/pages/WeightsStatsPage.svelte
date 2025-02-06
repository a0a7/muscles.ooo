<script lang="ts">
  import { onMount } from 'svelte';
  import { format, subDays, subYears, parseISO } from 'date-fns';
  import { Button } from "$lib/components/ui/button";
  import Label from '$lib/components/ui/label/label.svelte';
  import Beeswarm from '$lib/components/charts/beeswarm/Beeswarm.svelte';
  import AxisX from '$lib/components/charts/beeswarm/AxisX.svelte';
  import { get } from 'svelte/store';

  import { LayerCake, Svg } from 'layercake'; // @ts-ignore
  import { format as d3Format } from 'd3-format';
  import { useMetric } from '../../stores/useMetric';

  export let activities: any[] = [];

  let filteredActivities = activities;
  let startDate = new Date();
  let endDate = new Date();
  let timeFilter = 'allTime';
  let metricFilter = 'totalVolume';

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
    if (!activity.exerciseSets || activity.exerciseSets.length === 0) {
      return null;
    }
    const date = new Date(activity.startTime);
    return {
      name: activity.name,
      duration: activity.time,
      workingTime: activity.movingTime,
      sets: activity.exerciseSets.length,
      startTime: date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(),
      date: format(parseISO(activity.startTime), 'yyyy-MM-dd'),
      reps: activity.exerciseSets.reduce((acc: any, set: { reps: any; }) => acc + set.reps, 0),
      avgWeight: activity.exerciseSets.reduce((acc: any, set: { weight: any; }) => acc + set.weight, 0) / activity.exerciseSets.length,
      totalVolume: activity.exerciseSets.reduce((acc: number, set: { weight: number; reps: number; }) => acc + (set.weight * set.reps), 0)
    };
  }).filter(d => d !== null);

  const metrics = {
    sets: '# Sets',
    reps: '# Reps',
    totalVolume: 'Total Volume',
    startTime: 'Time of Day (Start)',
    duration: 'Duration',
    workingTime: 'Working Time',
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

  // Calculate mean and standard deviation
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

  function formatVolume(volume: number) {
    const metric = get(useMetric);
    return metric 
        ? `${(volume / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg` 
        : `${(volume / 453.592).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lbs`;
  }

  $: stats = calculateMeanAndStdDev(beeswarmData, metricFilter);

  $: formattedMean = metricFilter === 'startTime' ? formatStartTime(stats.mean) : 
                     metricFilter === 'duration' || metricFilter === 'workingTime' ? formatTime(stats.mean) : 
                     metricFilter === 'totalVolume' ? formatVolume(stats.mean) : 
                     stats.mean.toFixed(2);

  $: formattedStdDev = metricFilter === 'startTime' ? formatStartTime(stats.stdDev) : 
                       metricFilter === 'duration' || metricFilter === 'workingTime' ? formatTime(stats.stdDev) : 
                       metricFilter === 'totalVolume' ? formatVolume(stats.stdDev) : 
                       stats.stdDev.toFixed(2);
</script>

<div class="max-w-[86.5%] h-full px-6 lg:px-8 mx-auto items-center justify-center">
  <h2 class="text-3xl font-bold mx-auto mt-8 text-center w-full">Weightlifting Statistics</h2>
  <div class="mb-4 mt-4 w-full mx-auto flex flex-col items-center justify-center gap-2">
    <Label for="timeFilter">Timeframe</Label>
    <div class="flex space-x-2 max-w-[75vw] overflow-x-scroll md:overflow-x-auto" id="timeFilter">
      <Button onclick={() => { timeFilter = 'allTime'; filterActivities(); }} variant={timeFilter==='allTime' ? "default" : "outline"} >All Time</Button>
      <Button onclick={() => { timeFilter = 'last7days'; filterActivities(); }} variant={timeFilter === 'last7days' ? "default" : "outline"}>Last 7 Days</Button>
      <Button onclick={() => { timeFilter = 'last30days'; filterActivities(); }} variant={timeFilter === 'last30days' ? "default" : "outline"}>Last 30 Days</Button>
      <Button onclick={() => { timeFilter = 'lastYear'; filterActivities(); }} variant={timeFilter === 'lastYear' ? "default" : "outline"}>Last Year</Button>
      {#each Array.from(new Set(activities.map(activity => new Date(activity.startTime).getFullYear()))).sort((a, b) => b - a) as year}
        <Button onclick={() => { timeFilter = year.toString(); filterActivities(); }} variant={timeFilter === year.toString() ? "default" : "outline"}>{year}</Button>
      {/each}
    </div>
  </div>
  <div class="mb-4 mt-4 max-w-full mx-auto flex flex-col items-center justify-center gap-2">
    <Label for="metricFilter">Metric</Label>
    <div class="flex space-x-2 max-w-[75vw] overflow-x-scroll md:overflow-x-auto" id="metricFilter">
      {#each Object.entries(metrics) as [key, label]}
        <Button onclick={() => { metricFilter = key; }} variant={metricFilter === key ? "default" : "outline"}>{label}</Button>
      {/each}
    </div>
  </div>
  <div class="h-full w-full max-w-[100%] lg:max-w-[60%] mx-auto p-16">
    <div class="h-full w-full">
      <LayerCake 
        padding={{bottom: 15, top: 5}}
        x={metricFilter}
        data={dataTransformed}
        custom={{ getTitle: (d: { data: { title: string } }) => d.data.title }}
        let:width
      >
        <Svg>
          <AxisX
            baseline={true}
            formatTick={addCommas}
            tickMarks={true}
            isVolume={metricFilter === 'totalVolume'}
            isTime={metricFilter === 'duration' || metricFilter === 'workingTime'}
            isStartTime={metricFilter === 'startTime'}
          />
          <Beeswarm
            r={width < 400 ? r / 1.6 : r*1.15}
            spacing={3}
          />
        </Svg>
      </LayerCake>
    </div>
  </div>
  <div class="mt-4 text-center">
    <p><strong>Mean:</strong> {formattedMean} - <strong>Standard Deviation:</strong> {formattedStdDev}</p>
  </div>
</div>