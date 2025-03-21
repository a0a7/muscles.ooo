<script lang="ts">
    import { onMount } from 'svelte';
    import { subDays, subYears } from 'date-fns';
    import { Button } from "$lib/components/ui/button";
    import Label from '$lib/components/ui/label/label.svelte';
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { useMetric } from "../../stores/useMetric.js";
    import { get } from 'svelte/store';
  
    export let activities: any[] = [];
    export let volumeType: string = 'weight';
  
    let filteredActivities: any[] = [];
    let startDate = new Date();
    let endDate = new Date();
    let timeFilter = 'allTime';
  
    let totalWorkouts = 0;
    let totalTime = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    let averageRepsPerSet = 0;
    let averageTimePerWorkout = 0;
    let totalCaloriesBurned = 0;
    let totalSweatLost = 0;

    let weightUnit = get(useMetric) ? 'kg' : 'lbs';
    let sweatUnit = get(useMetric) ? 'mL' : 'oz';

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
        return activityDate >= startDate && activityDate < endDate && activity.hasOwnProperty('exerciseSets');
      });
      processActivities(filteredActivities);
    };
  
    const processActivities = (activitiesToProcess: any[]) => {
      console.log(activitiesToProcess)
      totalWorkouts = activitiesToProcess.length;
      totalTime = activitiesToProcess.reduce((acc, activity) => acc + (activity.time || 0), 0);
      totalSets = activitiesToProcess.reduce((acc, activity) => acc + (activity.exerciseSets ? activity.exerciseSets.length : 0), 0);
      totalReps = activitiesToProcess.reduce((acc, activity) => acc + (activity.exerciseSets ? activity.exerciseSets.reduce((setAcc: any, set: { reps: any; }) => setAcc + (set.reps || 0), 0) : 0), 0);
      totalVolume = activitiesToProcess.reduce((acc, activity) => acc + (activity.exerciseSets ? activity.exerciseSets.reduce((setAcc: number, set: { weight: number; reps: number; }) => setAcc + ((set.weight || 0) * (set.reps || 0)), 0) : 0), 0);
      averageRepsPerSet = totalSets > 0 ? totalReps / totalSets : 0;
      averageTimePerWorkout = totalWorkouts > 0 ? totalTime / totalWorkouts : 0;
      totalCaloriesBurned = activitiesToProcess.reduce((acc, activity) => acc + (activity.calories || 0), 0);
      totalSweatLost = activitiesToProcess.reduce((acc, activity) => acc + (activity.sweat || 0), 0);
    };
  
    const convertWeight = (weight: number) => {
      return weightUnit === 'kg' ? weight : weight * 2.20462;
    };

    const convertSweat = (sweat: number) => {
      return sweatUnit === 'mL' ? sweat : sweat * 0.0338140227;
    };
  
    interface YearlyStats {
      yearTotalWorkouts: number;
      yearTotalTime: number;
      yearTotalSets: number;
      yearTotalReps: number;
      yearTotalVolume: number;
      yearAverageRepsPerSet: number;
      yearAverageTimePerWorkout: number;
      yearTotalCaloriesBurned: number;
      yearTotalSweatLost: number;
    }
    
    const getYearlyStats = (year: number): YearlyStats => {
      const yearActivities = activities.filter(activity => new Date(activity.startTime).getFullYear() === year && activity.hasOwnProperty('exerciseSets'));
      const yearTotalWorkouts = yearActivities.length;
      const yearTotalTime = yearActivities.reduce((acc, activity) => acc + (activity.time || 0), 0);
      const yearTotalSets = yearActivities.reduce((acc, activity) => acc + (activity.exerciseSets ? activity.exerciseSets.length : 0), 0);
      const yearTotalReps = yearActivities.reduce((acc, activity) => acc + (activity.exerciseSets ? activity.exerciseSets.reduce((setAcc: any, set: { reps: any; }) => setAcc + (set.reps || 0), 0) : 0), 0);
      const yearTotalVolume = yearActivities.reduce((acc, activity) => acc + (activity.exerciseSets ? activity.exerciseSets.reduce((setAcc: number, set: { weight: number; reps: number; }) => setAcc + ((set.weight || 0) * (set.reps || 0)), 0) : 0), 0);
      const yearAverageRepsPerSet = yearTotalSets > 0 ? yearTotalReps / yearTotalSets : 0;
      const yearAverageTimePerWorkout = yearTotalWorkouts > 0 ? yearTotalTime / yearTotalWorkouts : 0;
      const yearTotalCaloriesBurned = yearActivities.reduce((acc, activity) => acc + (activity.calories || 0), 0);
      const yearTotalSweatLost = yearActivities.reduce((acc, activity) => acc + (activity.sweat || 0), 0);

      return {
        yearTotalWorkouts,
        yearTotalTime,
        yearTotalSets,
        yearTotalReps,
        yearTotalVolume: convertWeight(yearTotalVolume),
        yearAverageRepsPerSet,
        yearAverageTimePerWorkout,
        yearTotalCaloriesBurned,
        yearTotalSweatLost: convertSweat(yearTotalSweatLost)
      };
    };
  
    onMount(() => {
      filterActivities();
    });
  
    $: if (timeFilter) {
      filterActivities();
    }
    
    useMetric.subscribe(value => {
        weightUnit = value ? 'kg' : 'lbs';
        sweatUnit = value ? 'mL' : 'oz';
        console.log(weightUnit, sweatUnit);
        processActivities(filteredActivities);
    });

    function onInit(event) {
    }
    const numberFormatter = new Intl.NumberFormat('en-US');

  </script>
  
  <div class="max-w-[86.5%] px-6 lg:px-8 mx-auto">
    <h2 class="text-3xl font-black mx-auto mt-6 text-center">Lifting Statistics</h2>
    
    <div class="flex flex-wrap justify-center gap-2 mt-6">
      <Button 
        variant={timeFilter === 'allTime' ? 'secondary' : 'outline'} 
        onclick={() => timeFilter = 'allTime'}>
        All Time
    </Button>
    <Button 
      variant={timeFilter === 'lastYear' ? 'secondary' : 'outline'} 
      onclick={() => timeFilter = 'lastYear'}>
      Last Year
    </Button>
    <Button 
    variant={timeFilter === 'last30days' ? 'secondary' : 'outline'} 
    onclick={() => timeFilter = 'last30days'}>
    Last 30 Days
  </Button>
      <Button 
          variant={timeFilter === 'last7days' ? 'secondary' : 'outline'} 
          onclick={() => timeFilter = 'last7days'}>
          Last 7 Days
      </Button>
  


    </div>

    <div class="mb-6 max-w-[100%] lg:max-w-[75%] mx-auto">
        <div class="flex flex-wrap justify-center gap-4 bg-gray-100 dark:bg-gray-800 dark:bg-opacity-[15%] p-4 rounded-lg mt-8">
            <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]" >
                <div class="text-sm text-gray-500">Total Workouts</div>
                <div class="text-xl font-bold">{numberFormatter.format(Number((totalWorkouts)))}</div>
            </div>
            <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]" >
                <div class="text-sm text-gray-500">Total Time</div>
                <div class="text-xl font-bold">{Math.floor(totalTime / 3600)}h {Math.floor((totalTime % 3600) / 60)}m</div>
            </div>
            <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]" >
                <div class="text-sm text-gray-500">Total Sets</div>
                <div class="text-xl font-bold">{numberFormatter.format(Number((totalSets)))}</div>
            </div>
            <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]" >
                <div class="text-sm text-gray-500">Total Reps</div>
                <div class="text-xl font-bold">{numberFormatter.format(Number((totalReps)))}</div>
            </div>
            <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]" >
                <div class="text-sm text-gray-500">Total Volume</div>
                <div class="text-xl font-bold">{numberFormatter.format(Number((totalVolume / 1000).toFixed(0)))} {weightUnit}</div>
            </div>
            <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]" >
                <div class="text-sm text-gray-500">Average Reps per Set</div>
                <div class="text-xl font-bold">{averageRepsPerSet.toFixed(2)}</div>
            </div>
            <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]" >
                <div class="text-sm text-gray-500">Average Time per Workout</div>
                <div class="text-xl font-bold">{Math.floor(averageTimePerWorkout / 3600)}h {Math.floor((averageTimePerWorkout % 3600) / 60)}m</div>
            </div>
            <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]" >
                <div class="text-sm text-gray-500">Total Calories Burned</div>
                <div class="text-xl font-bold">{numberFormatter.format(Number(totalCaloriesBurned))} kcal</div>
            </div>
        </div>
    </div>   <!-- Yearly Section -->
    <div class="mb-8">
      <h3 class="text-2xl font-bold mx-auto text-center -mb-8">Yearly</h3>
      <Carousel.Root opts={{
        align: "end"/*,
        loop: true*/
              }} class="max-w-[100%] lg:max-w-[75%] mx-auto" >
          <Carousel.Content on:emblaInit={onInit}>
              {#each Array.from(new Set(activities.map(activity => new Date(activity.startTime).getFullYear()))).sort((a, b) => b - a).reverse() as year}
                  {#if activities.filter(activity => new Date(activity.startTime).getFullYear() === year && activity.hasOwnProperty('exerciseSets')).length > 0}
                      <Carousel.Item class="">
                          <h4 class="drop-shadow-2xl text-[4rem] opacity-50  transform scale-x-[110%] -mb-[2rem] font-black mx-auto mt-6 text-center bg-gradient-to-b from-slate-800 dark:from-blue-200 to-transparent bg-clip-text text-transparent">{year}</h4>
                          {#await new Promise(resolve => resolve(getYearlyStats(year))) then stats}
                              <div class="flex flex-wrap justify-center gap-4 bg-gray-100 dark:bg-gray-800 dark:bg-opacity-[15%] p-4 rounded-lg mt-8">
                                  <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]">
                                      <div class="text-sm text-gray-500">Total Workouts</div>
                                      <div class="text-xl font-bold">{numberFormatter.format(Number((stats as YearlyStats).yearTotalWorkouts))}</div>
                                  </div>
                                  <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]">
                                      <div class="text-sm text-gray-500">Total Time</div>
                                      <div class="text-xl font-bold">{Math.floor((stats as YearlyStats).yearTotalTime / 3600)}h {Math.floor(((stats as YearlyStats).yearTotalTime % 3600) / 60)}m</div>
                                  </div>
                                  <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]">
                                      <div class="text-sm text-gray-500">Total Sets</div>
                                      <div class="text-xl font-bold">{numberFormatter.format(Number((stats as YearlyStats).yearTotalSets))}</div>
                                  </div>
                                  <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]">
                                      <div class="text-sm text-gray-500">Total Reps</div>
                                      <div class="text-xl font-bold">{numberFormatter.format(Number((stats as YearlyStats).yearTotalReps))}</div>
                                  </div>
                                  <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]">
                                      <div class="text-sm text-gray-500">Total Volume</div>
                                      <div class="text-xl font-bold">{numberFormatter.format(Number(((stats as YearlyStats).yearTotalVolume / 1000).toFixed(0)))} {weightUnit}</div>
                                  </div>
                                  <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]">
                                      <div class="text-sm text-gray-500">Average Reps per Set</div>
                                      <div class="text-xl font-bold">{(stats as YearlyStats).yearAverageRepsPerSet.toFixed(2)}</div>
                                  </div>
                                  <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]">
                                      <div class="text-sm text-gray-500">Average Time per Workout</div>
                                      <div class="text-xl font-bold">{Math.floor((stats as YearlyStats).yearAverageTimePerWorkout / 3600)}h {Math.floor(((stats as YearlyStats).yearAverageTimePerWorkout % 3600) / 60)}m</div>
                                  </div>
                                  <div class="flex-1 min-w-[150px] text-center basis-[calc(50%-1rem)] md:basis-[calc(25%-1rem)]">
                                      <div class="text-sm text-gray-500">Total Calories Burned</div>
                                      <div class="text-xl font-bold">{numberFormatter.format(Number((stats as YearlyStats).yearTotalCaloriesBurned))} kcal</div>
                                  </div>
                              </div>
                          {:catch error}
                              <p class="text-lg text-center mt-10">Error loading data for {year}</p>
                          {/await}
                      </Carousel.Item>
                  {/if}
              {/each}
          </Carousel.Content>
          <Carousel.Previous class="transform scale-150 mr-4"/>
          <Carousel.Next class="transform scale-150 ml-4"/>    
      </Carousel.Root>  
    </div></div>