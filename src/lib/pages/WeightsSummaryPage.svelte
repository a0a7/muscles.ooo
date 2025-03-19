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
  
    let filteredActivities = [];
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
    let sweatUnit = get(useMetric) ? 'liters' : 'gallons';

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
      return sweatUnit === 'liters' ? sweat : sweat * 0.264172;
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
        sweatUnit = value ? 'L' : 'gal';
        console.log(weightUnit, sweatUnit);
        processActivities(filteredActivities);
    });
  </script>
  
  <div class="max-w-[86.5%] px-6 lg:px-8 mx-auto">
    <h2 class="text-3xl font-bold mx-auto mt-8 text-center">Weightlifting Summary</h2>
    
    <div class="flex flex-wrap justify-center gap-2 mt-6">
      <Button 
          variant={timeFilter === 'last7days' ? 'default' : 'outline'} 
          onclick={() => timeFilter = 'last7days'}>
          Last 7 Days
      </Button>
      <Button 
          variant={timeFilter === 'last30days' ? 'default' : 'outline'} 
          onclick={() => timeFilter = 'last30days'}>
          Last 30 Days
      </Button>
      <Button 
          variant={timeFilter === 'lastYear' ? 'default' : 'outline'} 
          onclick={() => timeFilter = 'lastYear'}>
          Last Year
      </Button>
      <Button 
          variant={timeFilter === 'allTime' ? 'default' : 'outline'} 
          onclick={() => timeFilter = 'allTime'}>
          All Time
      </Button>
    </div>

    <!-- All Time Section -->
    <div class="mb-8">
      <h3 class="text-2xl font-bold mx-auto mt-8 text-center">Summary</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-100 p-4 rounded-lg mt-8">
          <div class="text-center">
              <div class="text-sm text-gray-500">Total Workouts</div>
              <div class="text-xl font-bold">{totalWorkouts}</div>
          </div>
          <div class="text-center">
              <div class="text-sm text-gray-500">Total Time</div>
              <div class="text-xl font-bold">{Math.floor(totalTime / 3600)}h {Math.floor((totalTime % 3600) / 60)}m</div>
          </div>
          <div class="text-center">
              <div class="text-sm text-gray-500">Total Sets</div>
              <div class="text-xl font-bold">{totalSets}</div>
          </div>
          <div class="text-center">
              <div class="text-sm text-gray-500">Total Reps</div>
              <div class="text-xl font-bold">{totalReps}</div>
          </div>
          <div class="text-center">
              <div class="text-sm text-gray-500">Total Volume</div>
              <div class="text-xl font-bold">{(convertWeight(totalVolume) / 1000).toFixed(2)} {weightUnit}</div>
          </div>
          <div class="text-center">
              <div class="text-sm text-gray-500">Average Reps per Set</div>
              <div class="text-xl font-bold">{averageRepsPerSet.toFixed(2)}</div>
          </div>
          <div class="text-center">
              <div class="text-sm text-gray-500">Average Time per Workout</div>
              <div class="text-xl font-bold">{Math.floor(averageTimePerWorkout / 3600)}h {Math.floor((averageTimePerWorkout % 3600) / 60)}m</div>
          </div>
          <div class="text-center">
              <div class="text-sm text-gray-500">Total Calories Burned</div>
              <div class="text-xl font-bold">{totalCaloriesBurned}</div>
          </div>
          <div class="text-center">
              <div class="text-sm text-gray-500">Total Sweat Lost</div>
              <div class="text-xl font-bold">{convertSweat(totalSweatLost).toFixed(2)} {sweatUnit}</div>
          </div>
      </div>
  </div>  
    <!-- Yearly Section -->
    <div class="mb-8">
      <h3 class="text-2xl font-bold mx-auto mt-8 text-center">Yearly</h3>
      <Carousel.Root class="max-w-[100%] lg:max-w-[60%] mx-auto">
          <Carousel.Content>
              {#each Array.from(new Set(activities.map(activity => new Date(activity.startTime).getFullYear()))).sort((a, b) => b - a) as year}
                  <Carousel.Item class="">
                      <h4 class="text-xl font-bold mx-auto mt-8 text-center">{year}</h4>
                      {#if activities.filter(activity => new Date(activity.startTime).getFullYear() === year && activity.hasOwnProperty('exerciseSets')).length > 0}
                          {#await new Promise(resolve => resolve(getYearlyStats(year))) then stats}
                              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-100 p-4 rounded-lg mt-8">
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Total Workouts</div>
                                      <div class="text-xl font-bold">{stats.yearTotalWorkouts}</div>
                                  </div>
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Total Time</div>
                                      <div class="text-xl font-bold">{Math.floor(stats.yearTotalTime / 3600)}h {Math.floor((stats.yearTotalTime % 3600) / 60)}m</div>
                                  </div>
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Total Sets</div>
                                      <div class="text-xl font-bold">{stats.yearTotalSets}</div>
                                  </div>
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Total Reps</div>
                                      <div class="text-xl font-bold">{stats.yearTotalReps}</div>
                                  </div>
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Total Volume</div>
                                      <div class="text-xl font-bold">{(stats.yearTotalVolume / 1000).toFixed(2)} {weightUnit}</div>
                                  </div>
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Average Reps per Set</div>
                                      <div class="text-xl font-bold">{stats.yearAverageRepsPerSet.toFixed(2)}</div>
                                  </div>
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Average Time per Workout</div>
                                      <div class="text-xl font-bold">{Math.floor(stats.yearAverageTimePerWorkout / 3600)}h {Math.floor((stats.yearAverageTimePerWorkout % 3600) / 60)}m</div>
                                  </div>
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Total Calories Burned</div>
                                      <div class="text-xl font-bold">{stats.yearTotalCaloriesBurned}</div>
                                  </div>
                                  <div class="text-center">
                                      <div class="text-sm text-gray-500">Total Sweat Lost</div>
                                      <div class="text-xl font-bold">{stats.yearTotalSweatLost.toFixed(2)} {sweatUnit}</div>
                                  </div>
                              </div>
                          {:catch error}
                              <p class="text-lg text-center">Error loading data for {year}</p>
                          {/await}
                      {:else}
                          <p class="text-lg text-center">No workout data available for {year}</p>
                      {/if}
                  </Carousel.Item>
              {/each}
          </Carousel.Content>
          <Carousel.Previous class="transform scale-150 mr-4"/>
          <Carousel.Next class="transform scale-150 ml-4"/>    
      </Carousel.Root>  
  </div>
</div>