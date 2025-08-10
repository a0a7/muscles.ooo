<script lang="ts">
  import BodyMap from '$lib/components/BodyMap.svelte';
  import { onMount } from 'svelte';
  import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';
  import { Button } from "$lib/components/ui/button";
  import Label from '$lib/components/ui/label/label.svelte';
  import { LayerCake, Svg } from 'layercake';
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import Sankey from '$lib/components/charts/Sankey.svelte';
  import Radar from '$lib/components/charts/radar/Radar.svelte';
  import AxisRadial from '$lib/components/charts/radar/AxisRadial.svelte';
  import exerciseMuscleGroups from '$lib/components/exercise-muscle-groups.json';
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

  export let activities: any[] = [];
  export let volumeType: string = 'weight';
  export let weightUnit: string = 'kg';

  let muscleSets: Record<string, number> = {};
  let musclePrimarySets: Record<string, number> = {};
  let muscleSecondarySets: Record<string, number> = {};
  
  let muscleReps: Record<string, number> = {};
  let musclePrimaryReps: Record<string, number> = {};
  let muscleSecondaryReps: Record<string, number> = {};
  let muscleVolume: Record<string, number> = {};
  let simplifiedMuscleGroupsData: Record<string, number> = {};
  let flatSimplifiedMuscleGroupsData: number[] = [];
  let maxActivation = 0;
  let totalVolume = 0;
  let filteredActivities = activities;
  let startDate = new Date();
  let endDate = new Date();
  let timeFilter = 'allTime';
  let sankeyData: { nodes: any[], links: any[] } = { nodes: [], links: [] };

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
    "REAR_DELTS",
    "SIDE_DELTS",
    "FRONT_DELTS"
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
        muscleSets = {};
        muscleReps = {};
        musclePrimaryReps = {};
        muscleSecondaryReps = {};
        musclePrimarySets = {};
        muscleSecondarySets = {};
        muscleVolume = {};
        filteredActivities.forEach(activity => {
            if (activity && activity.exerciseSets && activity.exerciseSets.length > 0) {
                activity.exerciseSets.forEach((set: any) => { // @ts-ignore
                        const muscles = exerciseMuscleGroups[set.name];
                        if (muscles) {
                          if (set.reps && set.reps > 0) {
                            muscles.primaryMuscles.forEach((muscle: string) => {
                                muscleSets[muscle] = (muscleSets[muscle] || 0) + 1;
                                muscleReps[muscle] = (muscleReps[muscle] || 0) + set.reps;
                                musclePrimarySets[muscle] = (musclePrimarySets[muscle] || 0) + 1;
                                musclePrimaryReps[muscle] = (musclePrimaryReps[muscle] || 0) + set.reps;
                                muscleVolume[muscle] = (muscleVolume[muscle] || 0) + (set.weight * set.reps) / 1000;
                            });
                            muscles.secondaryMuscles.forEach((muscle: string) => {
                                muscleSets[muscle] = (muscleSets[muscle] || 0) + 0.5;
                                muscleReps[muscle] = (muscleReps[muscle] || 0) + (set.reps * 0.5);
                                muscleSecondarySets[muscle] = (muscleSecondarySets[muscle] || 0) + 1;
                                muscleSecondaryReps[muscle] = (muscleSecondaryReps[muscle] || 0) + set.reps;
                                muscleVolume[muscle] = (muscleVolume[muscle] || 0) + (set.weight * set.reps) / 1000;
                            });
                          } else {
                            return;
                          };
                        }
                    });
            }
        });
        maxActivation = Math.max(...Object.values(muscleSets));
        totalVolume = Object.values(muscleSets).reduce((a, b) => a + b, 0);
    }

    $: {
    simplifiedMuscleGroupsData = Object.keys(muscleSets).reduce((acc, muscle) => {
      const broadGroup = broadMuscleGroups[muscle];
      if (broadGroup) {
        acc[broadGroup] = (acc[broadGroup] || 0) + muscleSets[muscle];
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

  // Divide all values by 1000 for display (axis and radar chart)
  $: transformedData = transformData(simplifiedMuscleGroupsData);
  $: transformedDataInThousands = Object.fromEntries(Object.entries(transformedData).map(([k, v]) => [k, v / 1_000]));

  function createSankeyDataset(data: Record<string, number>) {
    const nodes = [
      { id: 'All Sets' },
      { id: 'Upper' },
      { id: 'Lower' },
      ...broadMuscles.map(muscle => ({ id: `-${muscle.charAt(0).toUpperCase() + muscle.slice(1)}` })),
      ...allMuscles.map(muscle => ({ id: `${muscle.charAt(0).toUpperCase() + muscle.slice(1).toLowerCase()}` }))
    ];

    const links = [];

    const upperMuscles = ['arms', 'back', 'chest', 'core', 'shoulders'];
    const lowerMuscles = ['legs'];

    // Link All Sets to Upper and Lower
    links.push({ source: 'All Sets', target: 'Upper', value: upperMuscles.reduce((acc, muscle) => acc + (data[muscle] || 0), 0) });
    links.push({ source: 'All Sets', target: 'Lower', value: lowerMuscles.reduce((acc, muscle) => acc + (data[muscle] || 0), 0) });

    // Link Upper and Lower to Broad Muscle Groups
    upperMuscles.forEach(muscle => {
      const target = `-${muscle.charAt(0).toUpperCase() + muscle.slice(1)}`;
      if (target !== '-Upper') {
        links.push({ source: 'Upper', target, value: data[muscle] || 0 });
      }
    });

    lowerMuscles.forEach(muscle => {
      const target = `-${muscle.charAt(0).toUpperCase() + muscle.slice(1)}`;
      if (target !== '-Lower') {
        links.push({ source: 'Lower', target, value: data[muscle] || 0 });
      }
    });

    // Link Broad Muscle Groups to Specific Muscles
    Object.entries(broadMuscleGroups).forEach(([muscle, group]) => {
      const source = `-${group.charAt(0).toUpperCase() + group.slice(1)}`;
      const target = `${muscle.charAt(0).toUpperCase() + muscle.slice(1).toLowerCase()}`;
      if (source !== target) {
        links.push({
          source,
          target,
          value: muscleSets[muscle] || 0
        });
      }
    });

    return { nodes, links };
  }

  $: sankeyData = createSankeyDataset(transformedData);
</script>

<div class="max-w-[80%] px-6 lg:px-8 mx-auto">
  <h2 class="text-3xl font-black mx-auto mt-6 text-center">Relative Muscle Activation (Volume in Thousands)</h2>
  <div class="mb-4 mt-4 w-full flex flex-col items-center justify-center gap-2">
    
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
  <Carousel.Root class="max-w-[100%] lg:max-w-[60%] mx-auto">
    <Carousel.Content>
      <Carousel.Item class=""><BodyMap {muscleSets} {musclePrimarySets} {muscleSecondarySets} {musclePrimaryReps} {muscleSecondaryReps} {maxActivation} {totalVolume}/></Carousel.Item>
      <Carousel.Item class="">
        <div class="w-full h-full p-4">
          <LayerCake data={sankeyData}>
            <Svg>
              <Sankey colorNodes={(d: string) => '#00bbff'} colorLinks={(d: string) => '#00bbff35'} />
            </Svg>
          </LayerCake>        
        </div>
      </Carousel.Item>
      <Carousel.Item class="">
        <h3 class="text-center text-xl font-bold">Total Sets (Volume in Thousands)</h3>
        <div class="flex flex-row justify-center items-center pb-8">
          {#each Object.entries(transformedData) as [name, sets], index}
            <p class="mx-3 inline text-lg text-center leading-5">
              <b>{name.charAt(0).toUpperCase() + name.slice(1)}</b>:<br/>{Math.round(sets)}
            </p>
          {/each}
        </div>
        <div class="w-[70%] h-[70%] mx-auto my-auto text-foreground">
          <LayerCake
            padding={{ top: 60, right: 0, bottom: 0, left: 0 }}
            x={broadMuscles}
            xRange={({ height }: {height: number}) => [0, height / 2]}
            data={[transformedDataInThousands]}
          >
            <Svg>
              <AxisRadial tickFormat={d => d.toLocaleString(undefined, { maximumFractionDigits: 1 })} />
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