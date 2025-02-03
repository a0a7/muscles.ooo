<script lang="ts">
  import BodyMap from '$lib/components/BodyMap.svelte';
  import { onMount } from 'svelte';
  import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';
  import { Button } from "$lib/components/ui/button";
	import Label from '$lib/components/ui/label/label.svelte';
  import { LayerCake, Svg } from 'layercake';
  import * as Carousel from "$lib/components/ui/carousel/index.js";

  import Radar from '$lib/components/charts/radar/Radar.svelte';
  import AxisRadial from '$lib/components/charts/radar/AxisRadial.svelte';
  import exerciseMuscleGroups from '$lib/components/exercise-muscle-groups.json';

  export let activities: any[] = [];
  export let volumeType: string = 'weight';
  export let weightUnit: string = 'kg';

  let muscleReps: Record<string, number> = {};
  let musclePrimaryReps: Record<string, number> = {};
  let muscleSecondaryReps: Record<string, number> = {};
  let muscleVolume: Record<string, number> = {};
  let simplifiedMuscleGroupsData: Record<string, number> = {};
  let flatSimplifiedMuscleGroupsData: number[] = [];
  let maxActivation = 0;
  let totalVolume = 0;


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

  const broadMuscleGroups: Record<string, string> = {
    ABDUCTORS: 'legs',
    ABS: 'core',
    ADDUCTORS: 'legs',
    BICEPS: 'arms',
    CALVES: 'legs',
    CHEST: 'chest',
    FOREARM: 'arms',
    GLUTES: 'legs',
    HAMSTRINGS: 'legs',
    HIPS: 'legs',
    LATS: 'back',
    LOWER_BACK: 'back',
    NECK: 'back',
    OBLIQUES: 'core',
    QUADS: 'legs',
    SHOULDERS: 'shoulders',
    TRAPS: 'back',
    TRICEPS: 'arms',
  };

  const broadMuscles = ["arms", "back", "chest", "core", "legs", "shoulders"]; 
  
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
    processActivities();
  });

  $: filterActivities();

  $: { 
      filteredActivities
      processActivities();
  }

  function processActivities() {
        muscleReps = {};
        musclePrimaryReps = {};
        muscleSecondaryReps = {};
        muscleVolume = {};
        filteredActivities.forEach(activity => {
            if (activity && activity.exerciseSets && activity.exerciseSets.length > 0) {
                activity.exerciseSets.forEach((set: any) => { // @ts-ignore
                        const muscles = exerciseMuscleGroups[set.name];
                        if (muscles) {
                          if (set.reps) {
                            muscles.primaryMuscles.forEach((muscle: string) => {
                                muscleReps[muscle] = (muscleReps[muscle] || 0) + set.reps;
                                musclePrimaryReps[muscle] = (musclePrimaryReps[muscle] || 0) + set.reps;
                                muscleVolume[muscle] = (muscleVolume[muscle] || 0) + set.weight * set.reps;
                            });
                            muscles.secondaryMuscles.forEach((muscle: string) => {
                                muscleReps[muscle] = (muscleReps[muscle] || 0) + set.reps * 0.5;
                                muscleSecondaryReps[muscle] = (muscleSecondaryReps[muscle] || 0) + set.reps;
                                muscleVolume[muscle] = (muscleVolume[muscle] || 0) + set.weight * set.reps;
                            });
                          } else {
                            return;
                          };
                        }
                    });
            }
        });
        maxActivation = Math.max(...Object.values(muscleReps));
        totalVolume = Object.values(muscleReps).reduce((a, b) => a + b, 0);
    }

    $: {
    simplifiedMuscleGroupsData = Object.keys(muscleReps).reduce((acc, muscle) => {
      const broadGroup = broadMuscleGroups[muscle];
      if (broadGroup) {
        acc[broadGroup] = (acc[broadGroup] || 0) + muscleReps[muscle];
      }
      return acc;
    }, {} as Record<string, number>); 
  }

  // Transform data to the desired format
  function transformData(data: Record<string, number>): Record<string, number> {
    return broadMuscles.reduce((acc, group) => {
      acc[group] = data[group] || 0;
      return acc;
    }, {} as Record<string, number>);
  }

  $: transformedData = transformData(simplifiedMuscleGroupsData);
  $: console.log(transformedData);
</script>

<div class="max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 ">
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
  <Carousel.Root class="lg:max-w-[50%] mx-auto">
    <Carousel.Content>
      <Carousel.Item class=""><div id="content"><BodyMap {muscleReps} {musclePrimaryReps} {muscleSecondaryReps} {maxActivation} {totalVolume}/></div></Carousel.Item>
      <Carousel.Item class="">
        <h3 class="text-center text-xl font-bold">Reps</h3>
        <div class="flex flex-row justify-center items-center">
          {#each Object.entries(transformedData) as [name, sets], index}
            <p class="mx-3 inline text-lg">
              {name.charAt(0).toUpperCase() + name.slice(1)} - {Math.round(sets)}
            </p>
            {#if index < Object.entries(transformedData).length - 1}<p class="font-bold text-sm mb-1">|</p> {/if}
          {/each}
        </div>
        <div class="w-[70%] h-[70%] mx-auto my-auto text-foreground">
          <LayerCake
            padding={{ top: 60, right: 0, bottom: 0, left: 0 }}
            x={broadMuscles}
            xRange={({ height }: {height: number}) => [0, height / 2]}
            data={[transformedData]}
          >
            <Svg>
              <AxisRadial />
              <Radar />
            </Svg>
          </LayerCake>
        </div>
      
      </Carousel.Item>
    </Carousel.Content>
    <Carousel.Previous class="transform scale-150 mr-4"/>
    <Carousel.Next class="transform scale-150 ml-4"/>    
  </Carousel.Root>  
</div>