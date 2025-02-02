<script lang="ts">
  import BodyMap from '$lib/components/BodyMap.svelte';
  import { onMount } from 'svelte';
  import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';
  import { Button } from "$lib/components/ui/button";
	import Label from '$lib/components/ui/label/label.svelte';

  export let activities: any[] = [];
  export let volumeType: string = 'weight';
  export let weightUnit: string = 'kg';

  const allMuscles = [
    "ABDUCTORS",
    "ABS",
    "ADDUCTORS",
    "BICEPS",
    "CALVES",
    "CHEST",
    "FOREARM",
    "GLUTES",
    "HAMSTRINGS",
    "HIPS",
    "LATS",
    "LOWER_BACK",
    "NECK",
    "OBLIQUES",
    "QUADS",
    "SHOULDERS",
    "TRAPS",
    "TRICEPS",
  ];

  let filteredActivities = activities;
  let startDate = new Date();
  let endDate = new Date();
  let timeFilter = 'allTime';

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
</script>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ">
  <h2 class="text-3xl font-bold mx-auto mt-8 text-center">Relative Muscle Activation</h2>
  <div class="mb-4 mt-8 w-full flex flex-col items-center justify-center gap-2">
    <Label for="timeFilter">Filter by Time</Label>
    <div class="flex space-x-2" id="timeFilter">
      <Button onclick={() => { timeFilter = 'allTime'; filterActivities(); }} variant={timeFilter==='allTime' ? "default" : "outline"} >All Time</Button>
      <Button onclick={() => { timeFilter = 'last7days'; filterActivities(); }} variant={timeFilter === 'last7days' ? "default" : "outline"}>Last 7 Days</Button>
      <Button onclick={() => { timeFilter = 'last30days'; filterActivities(); }} variant={timeFilter === 'last30days' ? "default" : "outline"}>Last 30 Days</Button>
      <Button onclick={() => { timeFilter = 'lastYear'; filterActivities(); }} variant={timeFilter === 'lastYear' ? "default" : "outline"}>Last Year</Button>
      {#each Array.from(new Set(activities.map(activity => new Date(activity.startTime).getFullYear()))).sort((a, b) => b - a) as year}
        <Button onclick={() => { timeFilter = year.toString(); filterActivities(); }} variant={timeFilter === year.toString() ? "default" : "outline"}>{year}</Button>
      {/each}
    </div>
  </div>
  <BodyMap {filteredActivities} />
</div>